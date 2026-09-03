import { NextResponse } from "next/server";
import { hashVisitor } from "@/lib/analytics";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const admin = createAdminClient();
  const visitor = new URL(request.url).searchParams.get("visitorId");
  const validVisitor = visitor && /^[0-9a-f-]{36}$/i.test(visitor) ? visitor : null;
  const [{ count }, existing] = await Promise.all([
    admin.from("track_likes").select("track_id", { count: "exact", head: true }).eq("track_id", trackId),
    validVisitor ? admin.from("track_likes").select("track_id").eq("track_id", trackId).eq("visitor_hash", hashVisitor(validVisitor)).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return NextResponse.json({ count: count ?? 0, liked: Boolean(existing.data) });
}

export async function POST(request: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const body = await request.json().catch(() => null) as { visitorId?: string } | null;
  if (!body?.visitorId) return NextResponse.json({ error: "Missing visitor identity" }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data: track } = await admin.from("tracks").select("id").eq("id", trackId).eq("status", "ready").eq("is_published", true).single();
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
    const { error } = await admin.from("track_likes").upsert({ track_id: trackId, visitor_hash: hashVisitor(body.visitorId) }, { onConflict: "track_id,visitor_hash", ignoreDuplicates: true });
    if (error) throw error;
    const { count } = await admin.from("track_likes").select("track_id", { count: "exact", head: true }).eq("track_id", trackId);
    return NextResponse.json({ count: count ?? 0, liked: true });
  } catch {
    return NextResponse.json({ error: "Could not record like" }, { status: 400 });
  }
}
