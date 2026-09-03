import Link from "next/link";
import type { TopTrack } from "@/lib/dashboard-analytics";
import { ArrowIcon, MusicIcon } from "@/components/ui/icons";

export function TopTracks({ tracks }: { tracks: TopTrack[] }) {
  return (
    <article className="analytics-panel top-tracks-panel">
      <header><div><p className="eyebrow">Catalog performance</p><h2>Top tracks</h2></div><span>Ranked by plays</span></header>
      {tracks.length ? <ol>{tracks.map((track, index) => {
        const completion = track.plays ? Math.round((track.completions / track.plays) * 100) : 0;
        return <li key={track.id}><span className="track-rank">{String(index + 1).padStart(2, "0")}</span><span aria-hidden="true" className="top-track-art" style={{ backgroundImage: `url("${track.coverUrl}")` }} /><div className="top-track-name"><strong>{track.title}</strong><span>{track.likes} likes</span></div><div className="top-track-value"><strong>{track.plays}</strong><span>plays</span></div><div className="top-track-value"><strong>{completion}%</strong><span>complete</span></div><Link aria-label={`Open ${track.title} player`} href={`/embed/${track.id}`}><ArrowIcon /></Link></li>;
      })}</ol> : <div className="panel-empty"><MusicIcon /><p>No track rankings yet.</p><span>Tracks appear after they receive plays or likes.</span></div>}
    </article>
  );
}
