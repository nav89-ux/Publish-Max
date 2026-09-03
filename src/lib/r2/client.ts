import { S3Client } from "@aws-sdk/client-s3";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getR2Config() {
  return {
    privateBucket: required("R2_PRIVATE_BUCKET"),
    publicBucket: required("R2_PUBLIC_BUCKET"),
    publicUrl: required("NEXT_PUBLIC_MEDIA_URL").replace(/\/$/, ""),
  };
}

export function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function publicObjectUrl(key: string) {
  return `${getR2Config().publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
