import type { FunnelStage } from "@/lib/dashboard-analytics";

const labels: Record<string, string> = { play: "Started", progress_25: "25% heard", progress_50: "Halfway", progress_75: "75% heard", complete: "Completed" };

export function ListeningFunnel({ stages }: { stages: FunnelStage[] }) {
  const starts = stages.find((stage) => stage.stage === "play")?.count ?? 0;

  return (
    <article className="analytics-panel funnel-panel">
      <header><div><p className="eyebrow">Listening behavior</p><h2>Retention</h2></div><span>30 days</span></header>
      {starts ? <ol>{stages.map((stage) => {
        const percentage = Math.min(100, Math.round((stage.count / starts) * 100));
        return <li key={stage.stage}><div><span>{labels[stage.stage] ?? stage.stage}</span><strong>{stage.count.toLocaleString()} <small>{percentage}%</small></strong></div><span className="funnel-bar"><i style={{ width: `${percentage}%` }} /></span></li>;
      })}</ol> : <div className="panel-empty"><p>No listening sessions yet.</p><span>Share a player to begin measuring retention.</span></div>}
    </article>
  );
}
