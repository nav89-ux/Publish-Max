import type { TrafficSource } from "@/lib/dashboard-analytics";

export function SourceBreakdown({ sources }: { sources: TrafficSource[] }) {
  const total = sources.reduce((sum, source) => sum + source.plays, 0);
  const max = Math.max(...sources.map((source) => source.plays), 1);

  return (
    <article className="analytics-panel source-panel">
      <header><div><p className="eyebrow">Placement signal</p><h2>Top sources</h2></div><span>{total.toLocaleString()} attributed</span></header>
      {sources.length ? <ol>{sources.map((source, index) => <li key={source.source}><span className="source-rank">{String(index + 1).padStart(2, "0")}</span><div><div><strong>{source.source}</strong><span>{Math.round((source.plays / total) * 100)}%</span></div><span className="source-bar"><i style={{ width: `${(source.plays / max) * 100}%` }} /></span></div><b>{source.plays}</b></li>)}</ol> : <div className="panel-empty"><p>No referral sources yet.</p><span>Platform and campaign traffic will be ranked here.</span></div>}
    </article>
  );
}
