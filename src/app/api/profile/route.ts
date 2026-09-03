import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { createR2Client, getR2Config, publicObjectUrl } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { username?: string; displayName?: string; bio?: string; avatarKey?: string | null; bannerKey?: string | null } | null;
  if (!body) return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });
  const username = body.username?.trim().toLowerCase();
  if (!username || !/^[a-z0-9_]{3,30}$/.test(username) || (body.bio?.length ?? 0) > 500 || (body.displayName?.length ?? 0) > 80) {
    return NextResponse.json({ error: "Invalid profile details" }, { status: 400 });
  }

  try {
    const imageEntries = [["avatar", body.avatarKey, 5242880], ["banner", body.bannerKey, 10485760]] as const;
    const updates: Record<string, string | null> = {
      username,
      display_name: body.displayName?.trim() || null,
      bio: body.bio?.trim() || null,
    };
    for (const [kind, key, max] of imageEntries) {
      if (!key) continue;
      if (!key.startsWith(`${user.id}/${kind}/`)) return NextResponse.json({ error: "Invalid image ownership" }, { status: 403 });
      const object = await createR2Client().send(new HeadObjectCommand({ Bucket: getR2Config().publicBucket, Key: key }));
      if (!object.ContentLength || object.ContentLength > max || !["image/jpeg", "image/png", "image/webp"].includes(object.ContentType ?? "")) {
        return NextResponse.json({ error: `Invalid ${kind} image` }, { status: 400 });
      }
      updates[`${kind}_url`] = publicObjectUrl(key);
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    const message = error && typeof error === "object" && "code" in error && error.code === "23505" ? "That username is already taken" : "Could not save profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
