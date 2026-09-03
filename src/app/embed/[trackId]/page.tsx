import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbedPlayer } from "@/components/player/embed-player";
import { ArrowIcon } from "@/components/ui/icons";
import { getPublicTrack } from "@/lib/tracks/public-track";

type PageProps = {
  params: Promise<{ trackId: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { trackId } = await params;
  const { mode } = await searchParams;
  const track = await getPublicTrack(trackId);
  if (!track) notFound();
  const artistName = track.artist.displayName || track.artist.username || "Independent artist";

  if (mode === "compact") {
    return (
      <main className="compact-player-shell">
        <div aria-label={`${track.title} cover art`} className="compact-player-art" role="img" style={{ backgroundImage: `url("${track.cover_url}")` }} />
        <section className="compact-player-content">
          <div className="compact-player-meta">
            <div><p>{artistName}</p><h1>{track.title}</h1></div>
            <Link aria-label={`Open ${artistName} profile`} href={`/profile/${track.owner_id}`} target="_blank"><ArrowIcon /></Link>
          </div>
          <EmbedPlayer audioUrl={track.audio_url} trackId={track.id} variant="compact" />
        </section>
      </main>
    );
  }

  return (
    <main className="immersive-player" style={{ "--artwork": `url("${track.cover_url}")` } as React.CSSProperties}>
      <div className="immersive-player-backdrop" />
      <nav><Link className="wordmark" href="/">PUBLISH<span>MAX</span></Link><Link className="player-profile-link" href={`/profile/${track.owner_id}`}>Artist profile <ArrowIcon /></Link></nav>
      <article className="immersive-player-stage">
        <div aria-label={`${track.title} cover art`} className="immersive-player-art" role="img" />
        <section className="immersive-player-info">
          <p className="eyebrow">Now playing</p>
          <h1>{track.title}</h1>
          <Link href={`/profile/${track.owner_id}`}>{artistName}</Link>
          <EmbedPlayer audioUrl={track.audio_url} trackId={track.id} variant="immersive" />
        </section>
      </article>
    </main>
  );
}
