import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbedPlayer } from "@/components/player/embed-player";
import { createClient } from "@/lib/supabase/server";

type Artist = { username: string | null; display_name: string | null };

export default async function EmbedPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const supabase = await createClient();
  const { data: track } = await supabase.from("tracks").select("id, title, cover_url, audio_url, owner_id").eq("id", trackId).eq("status", "ready").eq("is_published", true).single();
  if (!track?.audio_url) notFound();
  const { data: artist } = await supabase.from("profiles").select("username, display_name").eq("id", track.owner_id).single() as { data: Artist | null };

  return (
    <main className="embed-player">
      <div aria-label={`${track.title} cover art`} className="embed-art" role="img" style={{ backgroundImage: `url("${track.cover_url}")` }} />
      <section className="embed-content">
        <div className="embed-meta">
          <div><p>Now playing</p><h1>{track.title}</h1></div>
          {artist && <Link href={`/profile/${track.owner_id}`} target="_blank">{artist.display_name || artist.username || "Artist profile"} ↗</Link>}
        </div>
        <EmbedPlayer audioUrl={track.audio_url} trackId={track.id} />
      </section>
    </main>
  );
}
