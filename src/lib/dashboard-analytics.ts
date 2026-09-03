import { createAdminClient } from "@/lib/supabase/admin";

export type AnalyticsMetrics = {
  plays: number;
  previousPlays: number;
  listeners: number;
  previousListeners: number;
  likes: number;
  previousLikes: number;
  completionRate: number;
  previousCompletionRate: number;
};

export type DailyPoint = { date: string; plays: number; listeners: number };
export type FunnelStage = { stage: string; count: number };
export type TrafficSource = { source: string; plays: number };
export type TopTrack = { id: string; title: string; coverUrl: string; plays: number; likes: number; completions: number };
export type DashboardAnalytics = { metrics: AnalyticsMetrics; daily: DailyPoint[]; funnel: FunnelStage[]; sources: TrafficSource[]; topTracks: TopTrack[] };

const emptyMetrics: AnalyticsMetrics = {
  plays: 0,
  previousPlays: 0,
  listeners: 0,
  previousListeners: 0,
  likes: 0,
  previousLikes: 0,
  completionRate: 0,
  previousCompletionRate: 0,
};

export const emptyDashboardAnalytics: DashboardAnalytics = {
  metrics: emptyMetrics,
  daily: Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return { date: date.toISOString().slice(0, 10), plays: 0, listeners: 0 };
  }),
  funnel: ["play", "progress_25", "progress_50", "progress_75", "complete"].map((stage) => ({ stage, count: 0 })),
  sources: [],
  topTracks: [],
};

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function getDashboardAnalytics(artistId: string): Promise<DashboardAnalytics> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return emptyDashboardAnalytics;
  const { data, error } = await createAdminClient().rpc("get_artist_dashboard_analytics", { artist_id: artistId });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) return emptyDashboardAnalytics;
  const result = data as Record<string, unknown>;
  const metrics = result.metrics && typeof result.metrics === "object" && !Array.isArray(result.metrics) ? result.metrics as Record<string, unknown> : {};
  const array = (value: unknown) => Array.isArray(value) ? value as Record<string, unknown>[] : [];

  return {
    metrics: {
      plays: number(metrics.plays),
      previousPlays: number(metrics.previousPlays),
      listeners: number(metrics.listeners),
      previousListeners: number(metrics.previousListeners),
      likes: number(metrics.likes),
      previousLikes: number(metrics.previousLikes),
      completionRate: number(metrics.completionRate),
      previousCompletionRate: number(metrics.previousCompletionRate),
    },
    daily: array(result.daily).map((point) => ({ date: String(point.date ?? ""), plays: number(point.plays), listeners: number(point.listeners) })),
    funnel: array(result.funnel).map((stage) => ({ stage: String(stage.stage ?? ""), count: number(stage.count) })),
    sources: array(result.sources).map((source) => ({ source: String(source.source ?? "Direct / unknown"), plays: number(source.plays) })),
    topTracks: array(result.topTracks).map((track) => ({ id: String(track.id ?? ""), title: String(track.title ?? "Untitled"), coverUrl: String(track.coverUrl ?? ""), plays: number(track.plays), likes: number(track.likes), completions: number(track.completions) })),
  };
}
