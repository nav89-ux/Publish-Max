"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type DashboardTrack = {
  id: string;
  title: string;
  status: string;
  cover_url: string;
  created_at: string;
};

export function TrackList({ tracks }: { tracks: DashboardTrack[] }) {
  const router = useRouter();
  const hasPendingTrack = tracks.some((track) => ["queued", "processing"].includes(track.status));

  useEffect(() => {
    if (!hasPendingTrack) return;
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [hasPendingTrack, router]);

  function copyEmbed(trackId: string) {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`<iframe src="${origin}/embed/${trackId}" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`);
  }

  if (!tracks.length) return <div className="empty-state"><h3>No tracks yet.</h3><p>Upload your first master to create a player.</p></div>;

  return (
    <div className="track-list">
      {tracks.map((track) => (
        <article className="track-row" key={track.id}>
          <div className="track-cover" style={{ backgroundImage: `url("${track.cover_url}")` }} />
          <div><h3>{track.title}</h3><p>{new Date(track.created_at).toLocaleDateString()}</p></div>
          <span className={`status status-${track.status}`}>{track.status}</span>
          {track.status === "ready" ? <button className="secondary-button" onClick={() => copyEmbed(track.id)} type="button">Copy embed</button> : <span className="processing-note">Player pending</span>}
        </article>
      ))}
    </div>
  );
}
