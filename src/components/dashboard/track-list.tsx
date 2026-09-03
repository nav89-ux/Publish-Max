"use client";

import { useEffect, useState } from "react";
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
  const [copyState, setCopyState] = useState<{ trackId: string; action: "embed" | "link"; status: "copied" | "failed" } | null>(null);
  const hasPendingTrack = tracks.some((track) => ["queued", "processing"].includes(track.status));

  useEffect(() => {
    if (!hasPendingTrack) return;
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [hasPendingTrack, router]);

  async function copyText(trackId: string, action: "embed" | "link", value: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      setCopyState({ trackId, action, status: "copied" });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setCopyState({ trackId, action, status: copied ? "copied" : "failed" });
    }
  }

  function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  }

  function copyEmbed(trackId: string) {
    const embed = `<iframe src="${appUrl()}/embed/${trackId}" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`;
    return copyText(trackId, "embed", embed);
  }

  function shareOnX(track: DashboardTrack) {
    const shareUrl = `${appUrl()}/share/x/${track.id}`;
    const text = `Listen to ${track.title} on PublishMax\n${shareUrl}`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=720,height=620");
  }

  function copyLabel(trackId: string, action: "embed" | "link", idleLabel: string) {
    if (copyState?.trackId !== trackId || copyState.action !== action) return idleLabel;
    return copyState.status === "copied" ? "Copied" : "Copy failed";
  }

  if (!tracks.length) return <div className="empty-state"><h3>No tracks yet.</h3><p>Upload your first master to create a player.</p></div>;

  return (
    <div className="track-list">
      {tracks.map((track) => (
        <article className="track-row" key={track.id}>
          <div className="track-cover" style={{ backgroundImage: `url("${track.cover_url}")` }} />
          <div><h3>{track.title}</h3><p>{new Date(track.created_at).toLocaleDateString()}</p></div>
          <span className={`status status-${track.status}`}>{track.status}</span>
          {track.status === "ready" ? (
            <details className="share-menu">
              <summary>Share</summary>
              <div>
                <button onClick={() => shareOnX(track)} type="button">Share on X</button>
                <button onClick={() => void copyEmbed(track.id)} type="button">{copyLabel(track.id, "embed", "Copy iframe")}</button>
                <button onClick={() => void copyText(track.id, "link", `${appUrl()}/embed/${track.id}`)} type="button">{copyLabel(track.id, "link", "Copy player link")}</button>
              </div>
            </details>
          ) : <span className="processing-note">Player pending</span>}
        </article>
      ))}
    </div>
  );
}
