# PublishMax — Candidate Note

PublishMax is an artist-to-audience distribution MVP. An artist uploads a track once, receives a public profile and portable player, shares the best format each destination supports, and measures the response.

## What we use and why

| Technology | Purpose | Why it fits |
|---|---|---|
| Next.js + TypeScript | Web application, public pages, player routes, and APIs | One typed codebase for server-rendered social metadata, authenticated tools, and public listening experiences. |
| Supabase Auth | Artist accounts and sessions | Secure email/password authentication without building an identity system. |
| Supabase Postgres + RLS | Profiles, tracks, jobs, likes, and playback events | Relational data suits ownership and analytics; row-level security protects artist data. |
| Cloudflare R2 | Original audio, processed audio, and images | S3-compatible object storage with direct browser uploads and low media-delivery overhead. |
| FFmpeg on Railway | Audio processing | A small background worker can reliably convert uploaded masters into 320 kbps MP3 files. |
| Vercel | Next.js deployment | Public HTTPS pages are required for widgets and social crawlers; deployment is straightforward. |
| Native iframe | Website and blog distribution | The most broadly supported way to place the real player on sites that allow embeds. |
| Open Graph + X Cards | Social sharing | Discord, Reddit, and X control feed rendering, so PublishMax supplies the richest metadata each can consume. |
| First-party event API | Plays, retention, likes, and referrals | Keeps product analytics tied to real player interactions without exposing database credentials. |

## Product flow

1. The browser uploads the master and cover directly to R2 through short-lived signed URLs.
2. Supabase records the track and queues a processing job.
3. The Railway worker claims the job, runs FFmpeg, and publishes the playable MP3.
4. PublishMax exposes the compact iframe, immersive player, artist profile, and platform-specific links.
5. Players report starts, 25/50/75 percent milestones, completions, likes, and attribution.
6. The artist dashboard turns those events into a 30-day performance view.

## Platform strategy

- **Websites and blogs:** real inline iframe player.
- **X:** Player Card attempt with a rich-link fallback controlled by X.
- **Discord:** Open Graph preview that opens the PublishMax player.
- **Reddit:** optimized link post and preview that opens the player.
- **Closed surfaces:** use a direct player link unless the platform deliberately supports an integration.

## Scope control: games

Music playback inside games is technically possible, but it is not another universal sharing format. Supporting it properly would add:

- SDK distribution, versioning, documentation, and developer support.
- Separate integrations for Unity, Unreal, Godot, Roblox, browser games, and other platforms.
- Public API-key issuance, scopes, rotation, rate limiting, and abuse controls.
- New analytics dimensions for games, builds, installations, scenes, placements, devices, and sessions.

This is too much surface area for the current MVP. It would make the product harder to validate before there is evidence that game developers want it. The current scope stays focused on the upload → player/profile → website/social sharing → analytics loop. A game SDK can be evaluated later as its own product phase.

The key decision is to avoid pretending every platform permits arbitrary inline audio. PublishMax owns the reliable core loop and degrades gracefully where a platform limits embeds.
