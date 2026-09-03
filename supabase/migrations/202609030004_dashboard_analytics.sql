create or replace function public.get_artist_dashboard_analytics(artist_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with bounds as (
  select
    date_trunc('day', now()) - interval '29 days' as current_start,
    date_trunc('day', now()) + interval '1 day' as current_end,
    date_trunc('day', now()) - interval '59 days' as previous_start
),
artist_tracks as (
  select id, title, cover_url
  from public.tracks
  where owner_id = artist_id
),
period_events as (
  select events.*
  from public.playback_events events
  join artist_tracks tracks on tracks.id = events.track_id
  cross join bounds
  where events.created_at >= bounds.previous_start
    and events.created_at < bounds.current_end
),
period_likes as (
  select likes.*
  from public.track_likes likes
  join artist_tracks tracks on tracks.id = likes.track_id
  cross join bounds
  where likes.created_at >= bounds.previous_start
    and likes.created_at < bounds.current_end
),
metrics as (
  select
    count(*) filter (where event_type = 'play' and created_at >= current_start)::integer as plays,
    count(distinct visitor_hash) filter (where event_type = 'play' and created_at >= current_start)::integer as listeners,
    count(*) filter (where event_type = 'complete' and created_at >= current_start)::integer as completions,
    count(*) filter (where event_type = 'play' and created_at < current_start)::integer as previous_plays,
    count(distinct visitor_hash) filter (where event_type = 'play' and created_at < current_start)::integer as previous_listeners,
    count(*) filter (where event_type = 'complete' and created_at < current_start)::integer as previous_completions
  from period_events
  cross join bounds
),
like_metrics as (
  select
    count(*) filter (where created_at >= current_start)::integer as likes,
    count(*) filter (where created_at < current_start)::integer as previous_likes
  from period_likes
  cross join bounds
),
days as (
  select generate_series(current_start, current_end - interval '1 day', interval '1 day') as day
  from bounds
),
daily as (
  select
    days.day,
    count(events.id)::integer as plays,
    count(distinct events.visitor_hash)::integer as listeners
  from days
  left join period_events events
    on events.event_type = 'play'
   and events.created_at >= days.day
   and events.created_at < days.day + interval '1 day'
  group by days.day
  order by days.day
),
funnel as (
  select stage.event_type, stage.position, count(events.id)::integer as total
  from (values
    ('play'::text, 1),
    ('progress_25'::text, 2),
    ('progress_50'::text, 3),
    ('progress_75'::text, 4),
    ('complete'::text, 5)
  ) as stage(event_type, position)
  cross join bounds
  left join period_events events
    on events.event_type = stage.event_type
   and events.created_at >= bounds.current_start
  group by stage.event_type, stage.position
  order by stage.position
),
sources as (
  select
    coalesce(nullif(lower(utm_source), ''), nullif(lower(referrer_host), ''), 'direct / unknown') as source,
    count(*)::integer as plays
  from period_events
  cross join bounds
  where event_type = 'play'
    and created_at >= current_start
  group by 1
  order by plays desc, source
  limit 6
),
track_events as (
  select
    track_id,
    count(*) filter (where event_type = 'play')::integer as plays,
    count(*) filter (where event_type = 'complete')::integer as completions
  from period_events
  cross join bounds
  where created_at >= current_start
  group by track_id
),
track_likes as (
  select track_id, count(*)::integer as likes
  from period_likes
  cross join bounds
  where created_at >= current_start
  group by track_id
),
top_tracks as (
  select
    tracks.id,
    tracks.title,
    tracks.cover_url,
    coalesce(events.plays, 0) as plays,
    coalesce(likes.likes, 0) as likes,
    coalesce(events.completions, 0) as completions
  from artist_tracks tracks
  left join track_events events on events.track_id = tracks.id
  left join track_likes likes on likes.track_id = tracks.id
  where coalesce(events.plays, 0) > 0 or coalesce(likes.likes, 0) > 0
  order by plays desc, likes desc, tracks.title
  limit 5
)
select jsonb_build_object(
  'metrics', jsonb_build_object(
    'plays', metrics.plays,
    'previousPlays', metrics.previous_plays,
    'listeners', metrics.listeners,
    'previousListeners', metrics.previous_listeners,
    'likes', like_metrics.likes,
    'previousLikes', like_metrics.previous_likes,
    'completionRate', case when metrics.plays > 0 then round(metrics.completions * 100.0 / metrics.plays, 1) else 0 end,
    'previousCompletionRate', case when metrics.previous_plays > 0 then round(metrics.previous_completions * 100.0 / metrics.previous_plays, 1) else 0 end
  ),
  'daily', coalesce((select jsonb_agg(jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'plays', plays, 'listeners', listeners) order by day) from daily), '[]'::jsonb),
  'funnel', coalesce((select jsonb_agg(jsonb_build_object('stage', event_type, 'count', total) order by position) from funnel), '[]'::jsonb),
  'sources', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'plays', plays) order by plays desc, source) from sources), '[]'::jsonb),
  'topTracks', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'coverUrl', cover_url, 'plays', plays, 'likes', likes, 'completions', completions) order by plays desc, likes desc, title) from top_tracks), '[]'::jsonb)
)
from metrics
cross join like_metrics;
$$;

revoke all on function public.get_artist_dashboard_analytics(uuid) from public, anon, authenticated;
grant execute on function public.get_artist_dashboard_analytics(uuid) to service_role;
