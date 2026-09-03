"use client";

import { useEffect, useRef, useState } from "react";
import { HeartIcon, MutedIcon, PauseIcon, PlayIcon, VolumeIcon } from "@/components/ui/icons";

function visitorId() {
  const key = "publishmax_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

type Attribution = { source: string; medium: string; campaign?: string };
type PlayerVariant = "immersive" | "inline" | "compact" | "x-linear";

type PlayerProps = {
  trackId: string;
  audioUrl: string;
  showLike?: boolean;
  attribution?: Attribution;
  variant?: PlayerVariant;
};

export function EmbedPlayer({ trackId, audioUrl, showLike = true, attribution, variant = "compact" }: PlayerProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const session = useRef(crypto.randomUUID());
  const sent = useRef(new Set<string>());
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!showLike) return;
    fetch(`/api/tracks/${trackId}/like?visitorId=${encodeURIComponent(visitorId())}`)
      .then((response) => response.json())
      .then((data) => { setLikes(data.count ?? 0); setLiked(Boolean(data.liked)); });
  }, [showLike, trackId]);

  function event(eventType: string, position: number) {
    if (sent.current.has(eventType)) return;
    sent.current.add(eventType);
    const query = new URLSearchParams(window.location.search);
    fetch(`/api/tracks/${trackId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: visitorId(),
        sessionId: session.current,
        eventType,
        position,
        referrer: document.referrer,
        utmSource: attribution?.source ?? query.get("utm_source"),
        utmMedium: attribution?.medium ?? query.get("utm_medium"),
        utmCampaign: attribution?.campaign ?? query.get("utm_campaign"),
      }),
    });
  }

  function updateProgress() {
    const player = audio.current;
    if (!player?.duration) return;
    setCurrentTime(player.currentTime);
    setDuration(player.duration);
    const percent = (player.currentTime / player.duration) * 100;
    if (percent >= 25) event("progress_25", player.currentTime);
    if (percent >= 50) event("progress_50", player.currentTime);
    if (percent >= 75) event("progress_75", player.currentTime);
  }

  async function toggle() {
    if (!audio.current) return;
    if (audio.current.paused) {
      setError(false);
      try { await audio.current.play(); event("play", audio.current.currentTime); } catch { setError(true); }
    } else audio.current.pause();
  }

  function seek(value: number) {
    if (!audio.current) return;
    audio.current.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    if (!audio.current) return;
    audio.current.volume = value;
    setVolume(value);
  }

  async function like() {
    if (liked) return;
    const response = await fetch(`/api/tracks/${trackId}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: visitorId() }) });
    if (response.ok) { const data = await response.json(); setLikes(data.count); setLiked(true); }
  }

  return (
    <div className={`audio-player audio-player-${variant}`}>
      <audio onEnded={() => { setPlaying(false); event("complete", audio.current?.duration ?? 0); }} onError={() => setError(true)} onLoadedMetadata={() => setDuration(audio.current?.duration ?? 0)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onTimeUpdate={updateProgress} preload="metadata" ref={audio} src={audioUrl} />
      <button aria-label={playing ? "Pause track" : "Play track"} className="player-play" onClick={toggle} type="button">{playing ? <PauseIcon /> : <PlayIcon />}</button>
      <div className="player-timeline">
        <input aria-label="Track position" max={duration || 0} min="0" onChange={(event) => seek(Number(event.target.value))} step="0.1" type="range" value={Math.min(currentTime, duration || 0)} />
        <div className="player-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
      </div>
      <div className="player-volume">
        {volume === 0 ? <MutedIcon /> : <VolumeIcon />}
        <input aria-label="Volume" max="1" min="0" onChange={(event) => changeVolume(Number(event.target.value))} step="0.05" type="range" value={volume} />
      </div>
      {showLike && <button aria-label={liked ? `Liked, ${likes} likes` : `Like track, ${likes} likes`} aria-pressed={liked} className="player-like" onClick={like} type="button"><HeartIcon fill={liked ? "currentColor" : "none"} /><span>{likes}</span></button>}
      {error && <p className="player-error" role="alert">Playback unavailable. Try again.</p>}
    </div>
  );
}
