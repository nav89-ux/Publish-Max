import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardMetric } from "@/components/dashboard/dashboard-metric";
import { ListeningFunnel } from "@/components/dashboard/listening-funnel";
import { PlaysTrend } from "@/components/dashboard/plays-trend";
import { SourceBreakdown } from "@/components/dashboard/source-breakdown";
import { TopTracks } from "@/components/dashboard/top-tracks";
import { TrackList, type DashboardTrack } from "@/components/dashboard/track-list";
import { UploadModal } from "@/components/upload/upload-modal";
import { UserIcon } from "@/components/ui/icons";
import { getDashboardAnalytics } from "@/lib/dashboard-analytics";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: tracks }, analytics] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase.from("tracks").select("id, title, status, cover_url, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
    getDashboardAnalytics(user.id),
  ]);
  const artistTracks = (tracks ?? []) as DashboardTrack[];
  const metrics = analytics.metrics;

  return (
    <main className="dashboard">
      <nav>
        <Link className="wordmark" href="/dashboard">PUBLISH<span>MAX</span></Link>
        <div className="nav-actions">
          <Link className="text-button nav-profile-link" href={`/profile/${user.id}`}><UserIcon /> Profile</Link>
          <UploadModal />
          <form action="/auth/signout" method="post"><button className="text-button" type="submit">Sign out</button></form>
        </div>
      </nav>
      <section className="dashboard-content analytics-dashboard">
        <header className="dashboard-masthead">
          <div><p className="eyebrow">Performance control room</p><h1>{profile?.display_name || "Your sound"}</h1><p>Understand what gets played, what keeps listeners, and where discovery happens.</p></div>
          <div className="dashboard-period"><span>Reporting window</span><strong>Last 30 days</strong><small>Compared with previous 30</small></div>
        </header>
        {!profile?.username && <Link className="profile-alert" href={`/profile/${user.id}`}>Complete your public profile →</Link>}

        <section className="metric-grid" aria-label="30-day performance overview">
          <DashboardMetric detail="Player sessions started" label="Plays" previous={metrics.previousPlays} value={metrics.plays} />
          <DashboardMetric detail="Estimated unique browsers" label="Listeners" previous={metrics.previousListeners} value={metrics.listeners} />
          <DashboardMetric detail="New listener endorsements" label="Likes" previous={metrics.previousLikes} value={metrics.likes} />
          <DashboardMetric detail="Listeners reaching the end" label="Completion" previous={metrics.previousCompletionRate} suffix="%" value={metrics.completionRate} />
        </section>

        <section className="analytics-primary-grid">
          <PlaysTrend points={analytics.daily} />
          <ListeningFunnel stages={analytics.funnel} />
        </section>

        <section className="analytics-secondary-grid">
          <SourceBreakdown sources={analytics.sources} />
          <TopTracks tracks={analytics.topTracks} />
        </section>

        <section className="dashboard-section catalog-section">
          <div className="section-heading"><div><p className="eyebrow">Operational catalog</p><h2>Your tracks</h2><p>{artistTracks.length} {artistTracks.length === 1 ? "track" : "tracks"} · upload, monitor, and distribute</p></div></div>
          <TrackList tracks={artistTracks} />
        </section>
      </section>
    </main>
  );
}
