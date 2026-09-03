import { ArrowIcon } from "@/components/ui/icons";

export function DashboardMetric({ label, value, previous, suffix = "", detail }: { label: string; value: number; previous: number; suffix?: string; detail: string }) {
  const delta = previous > 0 ? Math.round(((value - previous) / previous) * 100) : null;
  const direction = delta === null ? "new" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const comparison = delta === null ? (value > 0 ? "New activity" : "No prior activity") : delta === 0 ? "No change" : `${Math.abs(delta)}% ${delta > 0 ? "increase" : "decrease"}`;

  return (
    <article className="metric-card">
      <div className="metric-card-label"><span>{label}</span><span>30D</span></div>
      <strong>{Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1)}{suffix}</strong>
      <div className={`metric-change metric-change-${direction}`}><ArrowIcon /><span>{comparison}</span></div>
      <p>{detail}</p>
    </article>
  );
}
