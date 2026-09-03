import Link from "next/link";
import { notFound } from "next/navigation";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
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
  const { data: tracks } = await supabase.from("tracks").select("id, title, cover_url, created_at").eq("owner_id", profile.id).eq("status", "ready").eq("is_published", true).order("created_at", { ascending: false });
  const artistName = profile.display_name || profile.username || "Unnamed artist";

  return (
    <main className="artist-page">
      <header className="artist-banner" style={profile.banner_url ? { backgroundImage: `linear-gradient(0deg, #090909 0%, transparent 70%), url("${profile.banner_url}")` } : undefined}>
        <nav className="profile-nav">
          <Link className="wordmark" href={isOwner ? "/dashboard" : "/"}>PUBLISH<span>MAX</span></Link>
          {isOwner && <Link className="text-button" href="/dashboard">Dashboard</Link>}
        </nav>
      </header>
      <section className="artist-identity">
        {profile.avatar_url ? <div aria-label={`${artistName} profile picture`} className="artist-avatar" role="img" style={{ backgroundImage: `url("${profile.avatar_url}")` }} /> : <div aria-hidden="true" className="artist-avatar artist-avatar-empty" />}
        <div className="profile-title-row">
          <div>
            <p className="eyebrow">{profile.username ? `@${profile.username}` : "Artist profile"}</p>
            <h1>{artistName}</h1>
          </div>
          {isOwner && <EditProfileModal profile={profile} />}
        </div>
        {profile.bio ? <p>{profile.bio}</p> : isOwner && <p>Your bio is empty. Edit your profile to tell listeners who you are.</p>}
      </section>
      <section className="discography">
        <p className="eyebrow">Discography</p>
        <h2>Music</h2>
        {tracks?.length ? <div className="release-grid">{tracks.map((track) => (
          <Link className="release-card" href={`/embed/${track.id}`} key={track.id}>
            <div aria-label={`${track.title} cover art`} className="release-art" role="img" style={{ backgroundImage: `url("${track.cover_url}")` }} />
            <h3>{track.title}</h3>
            <p>Play track →</p>
          </Link>
        ))}</div> : <div className="empty-state"><h3>No published tracks yet.</h3><p>{isOwner ? "Ready tracks will appear here after upload and processing." : "Check back for new music."}</p></div>}
      </section>
    </main>
  );
}
