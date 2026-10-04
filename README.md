# Senior Engineer Roadmap

A 20-week (140-day) senior software engineer interview prep tracker built with **Next.js (App Router) + Tailwind CSS + Neon Postgres**, designed to deploy on **Vercel**.

Covers DSA (LeetCode), system design, .NET (basic to advanced), Next.js, Angular, DevOps (Docker, Kubernetes, CI/CD), databases and behavioral prep, at 2-3 hours a day.

## How saving works (local-first)

- Every tick, note and the start date is saved **in your browser immediately**, so the app works with no database at all.
- The **Sync** button sends your changes to `/api/sync`, which stores them in Neon and returns the latest data. For each item the newest edit wins, so home and office merge cleanly.
- Sync also runs automatically after edits, when you return to the tab, and once a minute while the tab is visible.
- Sync is protected by a passcode (`SYNC_PASSCODE`). You enter it once per browser.

## Setup

1. **Neon:** create a project at <https://neon.tech>, then **Connect** -> keep *Pooled connection* on -> copy the connection string.
2. **Tables:** Neon **SQL Editor** -> paste [`neon/schema.sql`](neon/schema.sql) -> Run.
3. **Env vars:** copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `SYNC_PASSCODE`.
4. Run it:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, pick your Day 1, press **Sync** and enter your passcode.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New -> Project**, import the repo (framework: Next.js, no extra settings).
3. Add `DATABASE_URL` and `SYNC_PASSCODE` under **Settings -> Environment Variables** (or use the Neon integration from the Vercel Marketplace, which adds `DATABASE_URL` for you), then deploy.
4. On each device (home, office), open the site, press **Sync**, and enter the passcode.

## How it works

| Piece | Where |
| --- | --- |
| Roadmap content (140 days, tasks, resources) | `src/data/roadmap.json` |
| Task ids | `d{day}-t{index}`, so keep task order stable if you edit the JSON |
| Local store + merge logic | `src/components/ProgressProvider.tsx` |
| Server sync endpoint (Neon) | `src/app/api/sync/route.ts` |
| Tables | `neon/schema.sql` (`task_progress`, `day_notes`, `settings`) |
| Dashboard stats | `src/lib/stats.ts` |

Pages: `/` dashboard, `/today` jumps to the current day, `/roadmap` all weeks with search and topic filters, `/day/[n]` tasks, resources and notes.

To change the plan, edit `src/data/roadmap.json`. Adding tasks to the end of a day is safe; reordering tasks changes which ticks map to which task.

> Merge uses each device's clock to decide which edit is newest, so keep your devices' clocks roughly correct.
