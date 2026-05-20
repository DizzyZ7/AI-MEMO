# AI Memo

Voice-first memo diary built as a Next.js 15 PWA. AI Memo turns quick thoughts into searchable notes, extracted tasks, mood signals, repeated themes, and weekly patterns.

The app works immediately in local demo mode and progressively upgrades to a cloud-backed product when Auth.js, Supabase, OpenAI, QStash, R2, and Resend credentials are configured.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS with shadcn-style local UI primitives
- Zustand for local MVP state
- TanStack Query + tRPC v11 client/server plumbing
- Auth.js v5 with Google/GitHub OAuth
- Prisma 6 + Supabase PostgreSQL + pgvector
- Upstash Redis/QStash, Cloudflare R2, OpenAI, Resend

## Run Locally

```bash
npm install
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

The app UI works without service credentials by using local demo data. Server routes require the relevant env vars from `.env.example`.

Use the full validation command before opening a PR:

```bash
npm run validate
```

If Prisma engine download fails through a local proxy, clear proxy variables for the command:

```powershell
$env:http_proxy=''; $env:https_proxy=''; $env:HTTP_PROXY=''; $env:HTTPS_PROXY=''; npx prisma generate
```

## Database

1. Create a Supabase project.
2. Enable pgvector: `create extension if not exists vector;`
3. Fill `DATABASE_URL` and `DIRECT_URL`.
4. Run:

```bash
npx prisma migrate dev
```

The initial migration creates Auth.js models, `Memo`, `Task`, enums, and an `ivfflat` pgvector index for `Memo.embedding`.

## External Services

- Auth: set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- AI: set `OPENAI_API_KEY` for GPT-4o mini, Whisper, and `text-embedding-3-small`.
- Queue: set `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.
- Storage: set `CF_ACCOUNT_ID`, `CF_ACCESS_KEY_ID`, `CF_SECRET_ACCESS_KEY`, `CF_R2_BUCKET`.
- Email: set `RESEND_API_KEY`.

## Implemented

- Dashboard shell, memo editor, voice recorder, memo feed, tag/search filters.
- Local demo analysis for tags, mood, and explicit tasks.
- Persistent local state with demo reset, audio playback, memo copy, and mobile navigation.
- Local JSON export/import for browser demo data.
- Task filters, inline task editing, inferred due dates, browser reminders, and cloud sync for task actions.
- Cloud-aware memo creation, cloud status, onboarding, semantic search, and lexical fallback search.
- Tasks, insights, weekly digest preview, settings screens.
- Auth.js route, tRPC route, QStash webhook.
- Server services for Whisper transcription, GPT analysis, embeddings, R2 presigned uploads, weekly digest email.
- Redis-backed monthly AI usage counters with Free/Pro limits.
- Synchronous memo processing fallback when QStash is not configured.
- PWA manifest and service worker.
- GitHub Actions CI for lint, typecheck, Prisma Client generation, and production build.

## Next Work

- Add Stripe subscription state and webhook handling.
- Add account migration from local demo state.
- Add integration tests around `processMemo` and tRPC authorization.
