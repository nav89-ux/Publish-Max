import Link from "next/link";
import { redirect } from "next/navigation";
import { TrackList, type DashboardTrack } from "@/components/dashboard/track-list";
import { UploadModal } from "@/components/upload/upload-modal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getAnalytics(trackIds: string[]) {
  const empty = { plays: 0, likes: 0, completions: 0, referrals: [] as { host: string; plays: number }[] };
  if (!trackIds.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return empty;
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [plays, likes, completions, referralEvents] = await Promise.all([
    admin.from("playback_events").select("id", { count: "exact", head: true }).in("track_id", trackIds).eq("event_type", "play").gte("created_at", since),
    admin.from("track_likes").select("track_id", { count: "exact", head: true }).in("track_id", trackIds).gte("created_at", since),
    admin.from("playback_events").select("id", { count: "exact", head: true }).in("track_id", trackIds).eq("event_type", "complete").gte("created_at", since),
    admin.from("playback_events").select("referrer_host").in("track_id", trackIds).eq("event_type", "play").gte("created_at", since).not("referrer_host", "is", null).limit(5000),
  ]);
  const referralCounts = new Map<string, number>();
  referralEvents.data?.forEach(({ referrer_host }) => referralCounts.set(referrer_host, (referralCounts.get(referrer_host) ?? 0) + 1));
  const referrals = [...referralCounts].map(([host, count]) => ({ host, plays: count })).sort((a, b) => b.plays - a.plays).slice(0, 5);
  return { plays: plays.count ?? 0, likes: likes.count ?? 0, completions: completions.count ?? 0, referrals };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: tracks }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase.from("tracks").select("id, title, status, cover_url, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
  ]);
  const artistTracks = (tracks ?? []) as DashboardTrack[];
  const analytics = await getAnalytics(artistTracks.map((track) => track.id));
  const completionRate = analytics.plays ? Math.round((analytics.completions / analytics.plays) * 100) : 0;

  return (
    <main className="dashboard">
      <nav>
        <Link className="wordmark" href="/dashboard">PUBLISH<span>MAX</span></Link>
        <div className="nav-actions">
          <Link className="text-button" href={`/profile/${user.id}`}>Profile</Link>
          <UploadModal />
          <form action="/auth/signout" method="post"><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </nav>
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div><p className="eyebrow">Artist workspace</p><h1>{profile?.display_name || "Your sound"}</h1></div>
          {!profile?.username && <Link className="profile-alert" href={`/profile/${user.id}`}>Complete your public profile →</Link>}
        </div>
        <section className="analytics-grid" aria-label="Last 30 days">
          <div><span>Plays</span><strong>{analytics.plays}</strong></div>
          <div><span>Likes</span><strong>{analytics.likes}</strong></div>
          <div><span>Completion</span><strong>{completionRate}%</strong></div>
          <div><span>Tracks</span><strong>{artistTracks.length}</strong></div>
        </section>
        <section className="referrals-section">
          <div><p className="eyebrow">Discovery</p><h2>Top referrals</h2></div>
          {analytics.referrals.length ? <ol>{analytics.referrals.map((referral) => <li key={referral.host}><span>{referral.host}</span><strong>{referral.plays}</strong></li>)}</ol> : <p>No referral traffic in the last 30 days.</p>}
        </section>
        <section className="dashboard-section">
          <div className="section-heading"><div><p className="eyebrow">Catalog</p><h2>Your tracks</h2></div></div>
          <TrackList tracks={artistTracks} />
        </section>
      </section>
    </main>
  );
}
