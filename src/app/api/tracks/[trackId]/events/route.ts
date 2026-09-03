import { NextResponse } from "next/server";
import { hashVisitor, safeText } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";

const eventTypes = ["play", "progress_25", "progress_50", "progress_75", "complete"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.visitorId !== "string" || typeof body.sessionId !== "string" || !eventTypes.includes(body.eventType as typeof eventTypes[number])) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: track } = await admin.from("tracks").select("id").eq("id", trackId).eq("status", "ready").eq("is_published", true).single();
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
    let referrerHost: string | null = null;
    if (typeof body.referrer === "string" && body.referrer.length <= 500) {
      try { referrerHost = new URL(body.referrer).hostname.slice(0, 253); } catch {}
    }
    const position = typeof body.position === "number" && body.position >= 0 ? Math.min(body.position, 86400) : 0;
    const { error } = await admin.from("playback_events").upsert({
      track_id: trackId,
      visitor_hash: hashVisitor(body.visitorId),
      session_id: body.sessionId,
      event_type: body.eventType,
      position_seconds: position,
      referrer_host: referrerHost,
      utm_source: safeText(body.utmSource),
      utm_medium: safeText(body.utmMedium),
      utm_campaign: safeText(body.utmCampaign),
    }, { onConflict: "track_id,session_id,event_type", ignoreDuplicates: true });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Could not record event" }, { status: 400 });
  }
}
