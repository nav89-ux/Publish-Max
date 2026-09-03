alter table public.profiles
add column banner_url text;

alter table public.profiles
add constraint profiles_username_lowercase check (username is null or username = lower(username));

create unique index profiles_username_lower_unique
on public.profiles (lower(username))
where username is not null;

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  status text not null default 'uploading' check (status in ('uploading', 'queued', 'processing', 'ready', 'failed')),
  is_published boolean not null default true,
  original_key text not null unique,
  audio_key text unique,
  cover_key text not null unique,
  cover_url text not null,
  audio_url text,
  source_mime_type text not null,
  source_size_bytes bigint not null check (source_size_bytes between 1 and 262144000),
  duration_seconds numeric(10, 3),
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tracks_owner_created_idx on public.tracks (owner_id, created_at desc);
create index tracks_public_ready_idx on public.tracks (owner_id, created_at desc) where status = 'ready' and is_published;

create trigger tracks_set_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null unique references public.tracks(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 3),
  locked_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index processing_jobs_claim_idx on public.processing_jobs (status, created_at);

create trigger processing_jobs_set_updated_at
before update on public.processing_jobs
for each row execute function public.set_updated_at();

create table public.track_likes (
  track_id uuid not null references public.tracks(id) on delete cascade,
  visitor_hash text not null,
  created_at timestamptz not null default now(),
  primary key (track_id, visitor_hash)
);

create index track_likes_track_created_idx on public.track_likes (track_id, created_at desc);

create table public.playback_events (
  id bigint generated always as identity primary key,
  track_id uuid not null references public.tracks(id) on delete cascade,
  visitor_hash text not null,
  session_id uuid not null,
  event_type text not null check (event_type in ('play', 'progress_25', 'progress_50', 'progress_75', 'complete')),
  position_seconds numeric(10, 3) not null default 0 check (position_seconds >= 0),
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  unique (track_id, session_id, event_type)
);

create index playback_events_track_created_idx on public.playback_events (track_id, created_at desc);
create index playback_events_track_referrer_idx on public.playback_events (track_id, referrer_host) where referrer_host is not null;

alter table public.tracks enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.track_likes enable row level security;
alter table public.playback_events enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_url, banner_url) on public.profiles to authenticated;

revoke all on public.tracks from anon, authenticated;
grant select on public.tracks to anon, authenticated;
grant update (title, is_published) on public.tracks to authenticated;

revoke all on public.processing_jobs from anon, authenticated;
revoke all on public.track_likes from anon, authenticated;
revoke all on public.playback_events from anon, authenticated;

create policy "Ready published tracks are publicly readable"
on public.tracks
for select
using (status = 'ready' and is_published);

create policy "Artists can read their own tracks"
on public.tracks
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Artists can update their own tracks"
on public.tracks
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create or replace function public.finalize_track_upload(
  track_title text,
  original_object_key text,
  cover_object_key text,
  public_cover_url text,
  original_mime_type text,
  original_size_bytes bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_track_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if trim(track_title) = '' or char_length(trim(track_title)) > 160 then
    raise exception 'Invalid track title';
  end if;
  if original_object_key not like (auth.uid()::text || '/audio/%')
     or cover_object_key not like (auth.uid()::text || '/cover/%') then
    raise exception 'Invalid object ownership';
  end if;
  if original_size_bytes < 1 or original_size_bytes > 262144000
     or original_mime_type not in ('audio/wav', 'audio/x-wav', 'audio/aiff', 'audio/x-aiff', 'audio/flac', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg') then
    raise exception 'Invalid source audio';
  end if;

  insert into public.tracks (
    owner_id,
    title,
    status,
    original_key,
    cover_key,
    cover_url,
    source_mime_type,
    source_size_bytes
  ) values (
    auth.uid(),
    trim(track_title),
    'queued',
    original_object_key,
    cover_object_key,
    public_cover_url,
    original_mime_type,
    original_size_bytes
  )
  returning id into new_track_id;

  insert into public.processing_jobs (track_id) values (new_track_id);
  return new_track_id;
end;
$$;

revoke all on function public.finalize_track_upload(text, text, text, text, text, bigint) from public, anon;
grant execute on function public.finalize_track_upload(text, text, text, text, text, bigint) to authenticated;

create or replace function public.claim_processing_job()
returns table (
  job_id uuid,
  track_id uuid,
  original_key text,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with next_job as (
    select jobs.id
    from public.processing_jobs jobs
    where jobs.status = 'queued'
       or (jobs.status = 'processing' and jobs.locked_at < now() - interval '15 minutes')
    order by jobs.created_at
    for update skip locked
    limit 1
  ), claimed as (
    update public.processing_jobs jobs
    set status = 'processing', attempts = jobs.attempts + 1, locked_at = now(), error = null
    from next_job
    where jobs.id = next_job.id and jobs.attempts < 3
    returning jobs.id, jobs.track_id, jobs.attempts
  )
  update public.tracks tracks
  set status = 'processing', processing_error = null
  from claimed
  where tracks.id = claimed.track_id
  returning claimed.id, tracks.id, tracks.original_key, claimed.attempts;
end;
$$;

revoke all on function public.claim_processing_job() from public, anon, authenticated;
grant execute on function public.claim_processing_job() to service_role;
