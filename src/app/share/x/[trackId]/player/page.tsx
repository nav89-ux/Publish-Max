import { notFound } from "next/navigation";
import { EmbedPlayer } from "@/components/player/embed-player";
import { getPublicTrack } from "@/lib/tracks/public-track";

export default async function XPlayerPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const track = await getPublicTrack(trackId);
  if (!track) notFound();
  const artistName = track.artist.displayName || track.artist.username || "Independent artist";

  return (
    <main className="x-card-player">
      <div aria-label={`Cover artwork for ${track.title}`} className="x-card-art" role="img" style={{ backgroundImage: `url("${track.cover_url}")` }} />
      <section className="x-card-content">
        <div><p>{artistName}</p><h1>{track.title}</h1></div>
        <EmbedPlayer audioUrl={track.audio_url} attribution={{ source: "x", medium: "player_card" }} showLike={false} trackId={track.id} />
      </section>
    </main>
  );
}
