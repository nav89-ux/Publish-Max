# PublishMax

Next.js, Supabase, Cloudflare R2, and FFmpeg-based music publishing MVP.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill every value.
3. In Supabase Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/confirm` as a redirect URL.
4. Link the Supabase CLI and apply migrations with `npx supabase link --project-ref YOUR_PROJECT_REF` then `npx supabase db push`.
5. Run `npm run dev`.

## Cloudflare R2

Create two buckets:

- `publishmax-originals`: private audio masters.
- `publishmax-public`: processed MP3 files and public images.

Create an R2 API token scoped to read/write objects in these two buckets. Add its S3 access key ID and secret to the server and Railway environments. Connect a custom domain to the public bucket and use its origin as `NEXT_PUBLIC_MEDIA_URL`.

Set this CORS policy on both buckets, replacing the origins with the deployed application origin:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-app.example.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Browser uploads use ten-minute, object-specific presigned URLs. Original audio is capped at 250 MB. Public images are capped at 5 MB for avatars and 10 MB for covers/banners.

## Railway FFmpeg worker

Create a Railway service from this repository and set the config file or Dockerfile path to `worker/railway.json` or `worker/Dockerfile`. Do not assign a public domain. Configure these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PRIVATE_BUCKET`
- `R2_PUBLIC_BUCKET`
- `NEXT_PUBLIC_MEDIA_URL`

The worker polls Supabase for queued jobs, transcodes sources to 320 kbps MP3, publishes the output to R2, and marks the corresponding track ready.

## Player and analytics

Ready tracks expose an iframe player at `/embed/{trackId}`. The dashboard provides copyable iframe markup. The player records one anonymous like per browser identity and sends playback events at play, 25%, 50%, 75%, and completion. Visitor identifiers are HMAC-hashed before storage; set `ANALYTICS_VISITOR_PEPPER` to a long random server-only secret.

Referrer headers are not guaranteed across every host. Add `utm_source`, `utm_medium`, and `utm_campaign` query parameters to iframe URLs when deterministic placement attribution is required.

## Verification

```bash
npm run typecheck
npm run build
```
