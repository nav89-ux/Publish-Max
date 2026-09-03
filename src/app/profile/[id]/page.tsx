import Link from "next/link";
import { notFound } from "next/navigation";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { ProfileAvatarEditor, ProfileBannerEditor } from "@/components/profile/profile-media-editor";
import { ProfileDiscography, type ProfileTrack } from "@/components/profile/profile-discography";
import { ArrowIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, bio, avatar_url, banner_url").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);
  if (!profile) notFound();

  const isOwner = user?.id === profile.id;
  const { data: tracks } = await supabase.from("tracks").select("id, title, cover_url, audio_url, created_at").eq("owner_id", profile.id).eq("status", "ready").eq("is_published", true).order("created_at", { ascending: false });
  const artistName = profile.display_name || profile.username || "Unnamed artist";
  const profileTracks = (tracks ?? []).filter((track) => Boolean(track.audio_url)) as ProfileTrack[];

  return (
    <main className="artist-page">
      <header className={`artist-banner${isOwner ? " is-editable" : ""}`} style={profile.banner_url ? { backgroundImage: `linear-gradient(0deg, #090909 0%, transparent 70%), url("${profile.banner_url}")` } : undefined}>
        {isOwner && <ProfileBannerEditor artistName={artistName} />}
        <nav className="profile-nav">
          <Link className="wordmark" href={isOwner ? "/dashboard" : "/"}>PUBLISH<span>MAX</span></Link>
          {isOwner && <Link className="profile-dashboard-link" href="/dashboard"><ArrowIcon /> Back to dashboard</Link>}
        </nav>
      </header>
      <section className="artist-identity">
        {isOwner ? <ProfileAvatarEditor artistName={artistName} imageUrl={profile.avatar_url} /> : profile.avatar_url ? <div aria-label={`${artistName} profile picture`} className="artist-avatar" role="img" style={{ backgroundImage: `url("${profile.avatar_url}")` }} /> : <div aria-hidden="true" className="artist-avatar artist-avatar-empty" />}
        <div className="profile-title-row">
          <div>
            <p className="eyebrow">{profile.username ? `@${profile.username}` : "Artist profile"}</p>
            <h1>{artistName}</h1>
          </div>
          {isOwner && <EditProfileModal profile={profile} />}
        </div>
        {profile.bio ? <p>{profile.bio}</p> : isOwner && <p>Your bio is empty. Edit your details to tell listeners who you are.</p>}
      </section>
      <section className="discography">
        <p className="eyebrow">Discography</p>
        <h2>Music</h2>
        <ProfileDiscography isOwner={isOwner} tracks={profileTracks} />
      </section>
    </main>
  );
}
