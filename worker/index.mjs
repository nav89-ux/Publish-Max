import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
  return process.env[name];
};
const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const r2 = new S3Client({ region: "auto", endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`, credentials: { accessKeyId: required("R2_ACCESS_KEY_ID"), secretAccessKey: required("R2_SECRET_ACCESS_KEY") } });
const privateBucket = required("R2_PRIVATE_BUCKET");
const publicBucket = required("R2_PUBLIC_BUCKET");
const publicUrl = required("NEXT_PUBLIC_MEDIA_URL").replace(/\/$/, "");
let running = true;

process.on("SIGTERM", () => { running = false; });
process.on("SIGINT", () => { running = false; });

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => { error = `${error}${chunk}`.slice(-4000); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} failed: ${error}`)));
  });
}

async function processJob(job) {
  const directory = `/tmp/publishmax-${job.track_id}`;
  const input = `${directory}/source`;
  const output = `${directory}/output.mp3`;
  const outputKey = `${job.track_id}/audio/stream.mp3`;
  await mkdir(directory, { recursive: true });
  try {
    const source = await r2.send(new GetObjectCommand({ Bucket: privateBucket, Key: job.original_key }));
    await pipeline(source.Body, createWriteStream(input));
    await run("ffmpeg", ["-y", "-i", input, "-vn", "-codec:a", "libmp3lame", "-b:a", "320k", "-map_metadata", "-1", output]);
    const bytes = await readFile(output);
    await r2.send(new PutObjectCommand({ Bucket: publicBucket, Key: outputKey, Body: bytes, ContentType: "audio/mpeg", CacheControl: "public, max-age=31536000, immutable" }));
    const audioUrl = `${publicUrl}/${outputKey}`;
    const { error: trackError } = await supabase.from("tracks").update({ status: "ready", audio_key: outputKey, audio_url: audioUrl, processing_error: null }).eq("id", job.track_id);
    if (trackError) throw trackError;
    await supabase.from("processing_jobs").update({ status: "completed", locked_at: null, error: null }).eq("id", job.job_id);
    console.log(JSON.stringify({ event: "track_ready", trackId: job.track_id }));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown processing error";
    const retry = job.attempts < 3;
    await supabase.from("processing_jobs").update({ status: retry ? "queued" : "failed", locked_at: null, error: message }).eq("id", job.job_id);
    await supabase.from("tracks").update({ status: retry ? "queued" : "failed", processing_error: message }).eq("id", job.track_id);
    console.error(JSON.stringify({ event: "track_failed", trackId: job.track_id, retry }));
  }
}

while (running) {
  const { data, error } = await supabase.rpc("claim_processing_job");
  if (error) {
    console.error(JSON.stringify({ event: "claim_failed", message: error.message }));
    await new Promise((resolve) => setTimeout(resolve, 5000));
    continue;
  }
  const job = data?.[0];
  if (job) await processJob(job);
  else await new Promise((resolve) => setTimeout(resolve, 3000));
}
