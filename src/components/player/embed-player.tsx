"use client";

import { useEffect, useRef, useState } from "react";

function visitorId() {
  const key = "publishmax_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export function EmbedPlayer({ trackId, audioUrl }: { trackId: string; audioUrl: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const session = useRef(crypto.randomUUID());
  const sent = useRef(new Set<string>());
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch(`/api/tracks/${trackId}/like?visitorId=${encodeURIComponent(visitorId())}`)
      .then((response) => response.json())
      .then((data) => { setLikes(data.count ?? 0); setLiked(Boolean(data.liked)); });
  }, [trackId]);

  function event(eventType: string, position: number) {
    if (sent.current.has(eventType)) return;
    sent.current.add(eventType);
    const query = new URLSearchParams(window.location.search);
    fetch(`/api/tracks/${trackId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ visitorId: visitorId(), sessionId: session.current, eventType, position, referrer: document.referrer, utmSource: query.get("utm_source"), utmMedium: query.get("utm_medium"), utmCampaign: query.get("utm_campaign") }),
    });
  }

  function updateProgress() {
    const player = audio.current;
    if (!player?.duration) return;
    const percent = (player.currentTime / player.duration) * 100;
    setProgress(percent);
    if (percent >= 25) event("progress_25", player.currentTime);
    if (percent >= 50) event("progress_50", player.currentTime);
    if (percent >= 75) event("progress_75", player.currentTime);
  }

  async function toggle() {
    if (!audio.current) return;
    if (audio.current.paused) { await audio.current.play(); event("play", audio.current.currentTime); } else audio.current.pause();
  }

  async function like() {
    if (liked) return;
    const response = await fetch(`/api/tracks/${trackId}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitorId() }) });
    if (response.ok) { const data = await response.json(); setLikes(data.count); setLiked(true); }
  }

  return (
    <div className="embed-controls">
      <audio onEnded={() => { setPlaying(false); event("complete", audio.current?.duration ?? 0); }} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onTimeUpdate={updateProgress} preload="metadata" ref={audio} src={audioUrl} />
      <button aria-label={playing ? "Pause" : "Play"} className="play-button" onClick={toggle} type="button">{playing ? "Ⅱ" : "▶"}</button>
      <div className="player-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <button aria-pressed={liked} className="like-button" onClick={like} type="button">{liked ? "Liked" : "Like"} <strong>{likes}</strong></button>
    </div>
  );
}
