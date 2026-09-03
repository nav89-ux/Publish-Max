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
  const title = `${track.title} by ${artistName}`;
  const description = `Listen to ${track.title} by ${artistName} on PublishMax.`;
  const site = process.env.NEXT_PUBLIC_X_HANDLE?.trim();

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/share/x/${track.id}` },
    other: { "twitter:player:stream:content_type": "audio/mpeg" },
    openGraph: {
      type: "website",
      url: `${appUrl}/share/x/${track.id}`,
      title,
      description,
      images: [{ url: track.cover_url, alt: `Cover artwork for ${track.title}` }],
    },
    twitter: {
      card: "player",
      ...(site ? { site: site.startsWith("@") ? site : `@${site}` } : {}),
      title,
      description,
      images: [{ url: track.cover_url, alt: `Cover artwork for ${track.title}` }],
      players: {
        playerUrl: `${appUrl}/share/x/${track.id}/player?utm_source=x&utm_medium=player_card`,
        streamUrl: track.audio_url,
        width: 480,
        height: 180,
      },
    },
  };
}

export default async function XSharePage({ params }: PageProps) {
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
          <p className="eyebrow">Listen now</p>
          <h1>{track.title}</h1>
          <Link className="x-artist-link" href={`/profile/${track.owner_id}`}>{artistName} →</Link>
          <EmbedPlayer audioUrl={track.audio_url} attribution={{ source: "x", medium: "share_page" }} trackId={track.id} variant="inline" />
        </section>
      </article>
    </main>
  );
}
