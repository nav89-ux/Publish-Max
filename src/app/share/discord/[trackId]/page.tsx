import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmbedPlayer } from "@/components/player/embed-player";
import { getPublicAppUrl, getPublicTrack } from "@/lib/tracks/public-track";

type PageProps = { params: Promise<{ trackId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { trackId } = await params;
  const track = await getPublicTrack(trackId);
  if (!track) return { title: "Track unavailable | PublishMax" };
  const appUrl = getPublicAppUrl();
  const artistName = track.artist.displayName || track.artist.username || "an independent artist";
  const title = `${track.title} — ${artistName}`;
  const description = `Listen to ${track.title} by ${artistName} on PublishMax.`;
  const url = `${appUrl}/share/discord/${track.id}`;
  const image = `${appUrl}/share/image/${track.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    other: { "theme-color": "#e02828" },
    openGraph: {
      type: "website",
      siteName: "PublishMax",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${track.title} by ${artistName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image, alt: `${track.title} by ${artistName}` }],
    },
  };
}

export default async function DiscordSharePage({ params }: PageProps) {
  const { trackId } = await params;
  const track = await getPublicTrack(trackId);
  if (!track) notFound();
  const artistName = track.artist.displayName || track.artist.username || "Independent artist";

  return (
    <main className="x-share-page">
      <nav><Link className="wordmark" href="/">PUBLISH<span>MAX</span></Link></nav>
      <article className="x-share-card">
        <div aria-label={`Cover artwork for ${track.title}`} className="x-share-art" role="img" style={{ backgroundImage: `url("${track.cover_url}")` }} />
        <section>
          <p className="eyebrow">Shared from Discord</p>
          <h1>{track.title}</h1>
          <Link className="x-artist-link" href={`/profile/${track.owner_id}`}>{artistName} →</Link>
          <EmbedPlayer audioUrl={track.audio_url} attribution={{ source: "discord", medium: "link_preview" }} trackId={track.id} variant="inline" />
        </section>
      </article>
    </main>
  );
}
