import type { DailyPoint } from "@/lib/dashboard-analytics";

export function PlaysTrend({ points }: { points: DailyPoint[] }) {
  const width = 720;
  const height = 260;
  const padding = 24;
  const max = Math.max(...points.map((point) => point.plays), 1);
  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (point.plays / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coordinates.length ? `M ${coordinates[0].x} ${height - padding} L ${coordinates.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${coordinates.at(-1)!.x} ${height - padding} Z` : "";
  const total = points.reduce((sum, point) => sum + point.plays, 0);
  const peak = Math.max(...points.map((point) => point.plays), 0);

  return (
    <article className="analytics-panel trend-panel">
      <header><div><p className="eyebrow">Listening trend</p><h2>Daily plays</h2></div><div className="panel-stat"><strong>{peak}</strong><span>Peak day</span></div></header>
      {total ? (
        <>
          <svg aria-label={`${total} plays over the last 30 days, with a peak of ${peak} plays in one day`} className="plays-chart" role="img" viewBox={`0 0 ${width} ${height}`}>
            <defs><linearGradient id="plays-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e62d2d" stopOpacity=".3" /><stop offset="1" stopColor="#e62d2d" stopOpacity="0" /></linearGradient></defs>
            {[0, .25, .5, .75, 1].map((level) => <line key={level} stroke="#ffffff12" x1={padding} x2={width - padding} y1={padding + level * (height - padding * 2)} y2={padding + level * (height - padding * 2)} />)}
            <path d={area} fill="url(#plays-fill)" />
            <polyline fill="none" points={line} stroke="#ff4a43" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            {coordinates.map((point, index) => index % 5 === 0 || index === coordinates.length - 1 ? <circle key={point.date} cx={point.x} cy={point.y} fill="#070707" r="4" stroke="#ff4a43" strokeWidth="2" /> : null)}
          </svg>
          <div className="chart-axis"><span>{points[0]?.date.slice(5)}</span><span>{points[Math.floor(points.length / 2)]?.date.slice(5)}</span><span>{points.at(-1)?.date.slice(5)}</span></div>
          <ol className="visually-hidden">{points.map((point) => <li key={point.date}>{point.date}: {point.plays} plays</li>)}</ol>
        </>
      ) : <div className="chart-empty"><span>—</span><p>Daily listening activity will appear after your first shared play.</p></div>}
    </article>
  );
}
