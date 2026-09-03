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

Create a Railway service from this repository, add `RAILWAY_DOCKERFILE_PATH=worker/Dockerfile`, and do not assign a public domain. The legacy `worker/railway.json` file is not required for new Railway services. Configure these variables:

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

## X sharing

Deploy the Next.js application to a public HTTPS host and set `NEXT_PUBLIC_APP_URL` to its origin, for example `https://app.publishmax.com`. Add the same value to the local environment when generating production share links. `NEXT_PUBLIC_X_HANDLE` is optional and should remain empty until PublishMax has an official X account.

Ready tracks provide three dashboard actions: share on X, copy iframe, and copy player link. The X action shares `/share/x/{trackId}`, whose initial server-rendered HTML contains Player Card metadata and Open Graph fallback metadata. Its restricted `/share/x/{trackId}/player` iframe contains only linear playback controls and records events with `utm_source=x`.

Before testing, verify as a signed-out visitor that the HTTPS share page, player iframe, cover image, and MP3 all return successfully without redirects. X cannot crawl localhost. X controls Player Card domain acceptance and client rendering, so valid metadata may still fall back to a cover-art card that opens the PublishMax player. Card metadata can remain cached after changes; use a newly generated track URL or a harmless version query parameter for repeated tests.

## Verification

```bash
npm run typecheck
npm run build
```
