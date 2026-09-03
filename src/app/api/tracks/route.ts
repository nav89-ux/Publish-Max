import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { createR2Client, getR2Config, publicObjectUrl } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { title?: string; audioKey?: string; coverKey?: string } | null;
  const title = body?.title?.trim();
  if (!title || title.length > 160 || !body?.audioKey || !body.coverKey) {
    return NextResponse.json({ error: "Title, audio, and cover art are required" }, { status: 400 });
  }
  if (!body.audioKey.startsWith(`${user.id}/audio/`) || !body.coverKey.startsWith(`${user.id}/cover/`)) {
    return NextResponse.json({ error: "Invalid object ownership" }, { status: 403 });
  }

  try {
    const r2 = createR2Client();
    const config = getR2Config();
    const [audio, cover] = await Promise.all([
      r2.send(new HeadObjectCommand({ Bucket: config.privateBucket, Key: body.audioKey })),
      r2.send(new HeadObjectCommand({ Bucket: config.publicBucket, Key: body.coverKey })),
    ]);
    if (!audio.ContentLength || audio.ContentLength > 262144000 || !audio.ContentType?.startsWith("audio/")) {
      return NextResponse.json({ error: "Uploaded audio is invalid" }, { status: 400 });
    }
    if (!cover.ContentLength || cover.ContentLength > 10485760 || !["image/jpeg", "image/png", "image/webp"].includes(cover.ContentType ?? "")) {
      return NextResponse.json({ error: "Uploaded cover art is invalid" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("finalize_track_upload", {
      track_title: title,
      original_object_key: body.audioKey,
      cover_object_key: body.coverKey,
      public_cover_url: publicObjectUrl(body.coverKey),
      original_mime_type: audio.ContentType,
      original_size_bytes: audio.ContentLength,
    });
    if (error) throw error;
    return NextResponse.json({ trackId: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not verify or finalize the upload" }, { status: 500 });
  }
}
