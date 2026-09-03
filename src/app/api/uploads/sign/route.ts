import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { createR2Client, getR2Config } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

const rules = {
  audio: { max: 262144000, types: ["audio/wav", "audio/x-wav", "audio/aiff", "audio/x-aiff", "audio/flac", "audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg"] },
  cover: { max: 10485760, types: ["image/jpeg", "image/png", "image/webp"] },
  avatar: { max: 5242880, types: ["image/jpeg", "image/png", "image/webp"] },
  banner: { max: 10485760, types: ["image/jpeg", "image/png", "image/webp"] },
} as const;

type UploadKind = keyof typeof rules;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { kind?: UploadKind; contentType?: string; size?: number } | null;
  if (!body?.kind || !(body.kind in rules) || !body.contentType || !Number.isSafeInteger(body.size)) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const rule = rules[body.kind];
  if (!(rule.types as readonly string[]).includes(body.contentType) || body.size! < 1 || body.size! > rule.max) {
    return NextResponse.json({ error: "Unsupported file type or size" }, { status: 400 });
  }

  const extension = body.contentType === "image/jpeg" ? "jpg" : body.contentType.split("/").pop()!.replace("x-", "");
  const key = `${user.id}/${body.kind}/${crypto.randomUUID()}.${extension}`;
  const config = getR2Config();
  const bucket = body.kind === "audio" ? config.privateBucket : config.publicBucket;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.contentType });
  const uploadUrl = await getSignedUrl(createR2Client(), command, { expiresIn: 600 });

  return NextResponse.json({ key, uploadUrl });
}
