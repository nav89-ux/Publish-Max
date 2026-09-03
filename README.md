# PublishMax

Next.js and Supabase MVP.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and add the project URL and anon key from Supabase Project Settings → API.
3. In Supabase Authentication → URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/confirm` as a redirect URL.
4. Run `npm run dev`.

Email/password authentication includes sign-up confirmation, sign-in, sign-out, session refresh, and a protected dashboard.
