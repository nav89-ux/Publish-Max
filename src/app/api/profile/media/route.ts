import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { createR2Client, getR2Config, publicObjectUrl } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

const limits = { avatar: 5242880, banner: 10485760 } as const;
type MediaKind = keyof typeof limits;

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { kind?: MediaKind; key?: string } | null;
  if (!body?.kind || !(body.kind in limits) || !body.key?.startsWith(`${user.id}/${body.kind}/`)) {
    return NextResponse.json({ error: "Invalid profile image" }, { status: 400 });
  }

  try {
    const object = await createR2Client().send(new HeadObjectCommand({ Bucket: getR2Config().publicBucket, Key: body.key }));
    if (!object.ContentLength || object.ContentLength > limits[body.kind] || !["image/jpeg", "image/png", "image/webp"].includes(object.ContentType ?? "")) {
      return NextResponse.json({ error: "Unsupported profile image" }, { status: 400 });
    }
    const field = body.kind === "avatar" ? "avatar_url" : "banner_url";
    const url = publicObjectUrl(body.key);
    const { error } = await supabase.from("profiles").update({ [field]: url }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Could not update profile image" }, { status: 400 });
  }
}
