"use client";

import { useState } from "react";
import Link from "next/link";
import { EmbedPlayer } from "@/components/player/embed-player";
import { TrackShareMenu } from "@/components/share/track-share-menu";
import { ArrowIcon, ExternalIcon, MusicIcon, PlayIcon } from "@/components/ui/icons";

export type ProfileTrack = {
  id: string;
  title: string;
  cover_url: string;
  audio_url: string;
  created_at: string;
};

export function ProfileDiscography({ tracks, isOwner }: { tracks: ProfileTrack[]; isOwner: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!tracks.length) return <div className="profile-empty"><MusicIcon /><h3>No published tracks yet.</h3><p>{isOwner ? "Ready tracks will appear here after upload and processing." : "Check back for new music."}</p></div>;

  return (
    <div className="profile-track-list">
      {tracks.map((track, index) => {
        const active = activeId === track.id;
        return (
          <article className={`profile-track${active ? " is-active" : ""}`} key={track.id}>
            <div className="profile-track-main">
              <span className="track-index">{String(index + 1).padStart(2, "0")}</span>
              <button aria-expanded={active} aria-label={`${active ? "Close" : "Play"} ${track.title}`} className="profile-track-art-button" onClick={() => setActiveId(active ? null : track.id)} type="button">
                <span aria-hidden="true" className="profile-track-art" style={{ backgroundImage: `url("${track.cover_url}")` }} />
                <span className="profile-track-art-action"><PlayIcon /></span>
              </button>
              <button aria-expanded={active} className="profile-track-title" onClick={() => setActiveId(active ? null : track.id)} type="button"><strong>{track.title}</strong><small>{new Date(track.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</small></button>
              <div className="profile-track-actions">
                <button className="track-play-label" onClick={() => setActiveId(active ? null : track.id)} type="button"><PlayIcon /> {active ? "Close" : "Play here"}</button>
                <Link aria-label={`Open ${track.title} in full player`} className="track-full-player" href={`/embed/${track.id}`}><ExternalIcon /> Full player</Link>
                <TrackShareMenu align="left" track={track} />
              </div>
            </div>
            {active && (
              <div className="profile-track-player">
                <EmbedPlayer audioUrl={track.audio_url} trackId={track.id} variant="inline" />
                <Link href={`/embed/${track.id}`}>Open full player <ArrowIcon /></Link>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
