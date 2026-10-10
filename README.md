# NorthStar

Official music streaming site for Vercel. Listeners do not sign in. The creator can upload MP3/WAV music, add artwork and lyrics, create releases, schedule publication, delete unreleased songs/drafts, and view individual song and release analytics.

## First deployment

1. Create a Supabase project at https://supabase.com/dashboard.
2. Run **supabase/schema.sql** in its SQL Editor. This creates empty tables; it does not transfer the existing Site's data.
3. In Storage, create a **private** bucket named **northstar**. Set the bucket and project upload limit to support your file sizes (the app allows up to 100 MB audio and 10 MB artwork; your plan may allow less). Do not make the bucket public or add public read/write policies.
4. In Authentication → Users, create your creator account with a strong password and confirmed email. Disable new user signups.
5. In Vercel, import **muzzzculer/northstar**, select the Next.js framework, and add the variables from **.env.example**. The database connection should use Supabase's transaction pooler. Use the legacy anon and service-role keys from Supabase API settings; they are used on the server only. Set NORTHSTAR_OWNER_EMAIL to the exact creator email.
6. Generate separate random values for NORTHSTAR_SESSION_SECRET and NORTHSTAR_ANALYTICS_SALT, at least 32 characters each. Never commit keys or passwords to GitHub.
7. Deploy, then open **/studio** and sign in. Creator sessions last 12 hours. Signing out clears the session; rotating the session secret invalidates all sessions.

## Required environment variables

| Variable | Source |
| --- | --- |
| DATABASE_URL | Supabase Connect → Transaction pooler URI, with your database password |
| SUPABASE_URL | Supabase project API URL |
| SUPABASE_ANON_KEY | Supabase legacy anon API key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase legacy service-role API key; server only |
| SUPABASE_STORAGE_BUCKET | northstar |
| NORTHSTAR_OWNER_EMAIL | Your confirmed creator account email |
| NORTHSTAR_SESSION_SECRET | Random server secret, at least 32 characters |
| NORTHSTAR_ANALYTICS_SALT | Separate random server secret |

## Local development

Copy .env.example to .env.local, fill in your own values, then:

```sh
npm install
npm run dev
```

## Migration status

This repository contains source code, not the existing uploaded music, private drafts, lyrics, or listener records. The current NorthStar Site remains live. Do not switch your public links until its records and file objects have been transferred and the Vercel deployment is verified.

The PostgreSQL tables preserve the original IDs and timestamp format so song/release links can be retained. Assets must be uploaded into the private bucket using their original object_key values. Import database rows in this order: assets, tracks, releases, release_tracks, streams, listen_sessions. Keep exports outside GitHub in the ignored migration-data folder.

Use `node --env-file=.env.local scripts/import-data.mjs migration-data/export.json` only after transferring and verifying all asset files. The import script accepts a table-keyed JSON export, preserves IDs, and never overwrites an existing conflicting row. A conflicting ID stops the transaction for manual review.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Account-connected database, auth, storage, and end-to-end streaming checks require the project's environment variables. The local adapter tests use controlled service doubles; they are not a substitute for those checks.
