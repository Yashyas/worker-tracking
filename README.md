# Worker Shift Tracker

A small, no-frills web app for tracking daily worker attendance and shift hours across construction project sites — built for a real estate client who just needed a dead-simple way to log who showed up, when, and what they're owed, with the data exportable to CSV for payroll.

## Why this exists

The client runs multiple construction/project sites and was tracking worker attendance and hours manually (paper or spreadsheets). The ask was intentionally narrow:

- Add a project site, add workers to it
- Mark each worker Present/Absent per day
- Log shift time blocks (workers can have more than one shift segment in a day)
- See hours and wages calculated automatically
- Export everything to CSV for payroll, by worker/month or by full project

That's it. No logins, no multi-user roles, no notifications, no payment processing. One supervisor, one tool, fast data entry — especially on a phone, on-site.

## What it does

**Home page** — list of project sites (Active / Completed / Archived), add a new project.

**Project page** — pick a date, see every worker on that project as a card, toggle Present/Absent, add/remove shift time blocks, see live hours + wage per worker for that day. Export the whole project's attendance as CSV.

**Worker page** — a payroll-style monthly view for one worker: a table of every day in the month (status, time blocks, hours, wage), with weekly subtotal rows and a monthly total row. Export that worker's month as CSV.

Wages and hours are calculated automatically from the logged time blocks (including handling shifts that cross midnight, splitting them across the two calendar days correctly).

## How it was built — kept deliberately simple

No big dev team, no expensive tooling. The whole thing was built using:

- **OpenCode with free/open models** as the coding agent doing the actual implementation — reading two short spec documents (`architecture.md` for the data model, logic, and build order; `design.md` for layout and style) and building the app phase by phase (schema → server actions → Home page → Project page → Worker page → CSV export → polish), rather than one giant unstructured prompt.
- **Stitch (Google's AI UI tool)**, used once per page (Home, Project, Worker) to generate a quick visual mockup from a written prompt, which the agent then used purely as a *layout reference* — it re-built the real UI with proper components rather than dropping in Stitch's raw output. If Stitch wasn't available, the agent just built straight from the written design spec instead.
- A conventional, boring, well-supported stack underneath: Next.js + Tailwind + shadcn/ui components for the interface, Prisma + Supabase Postgres for the database, and Vercel's free tier for hosting. Nothing exotic — easy to maintain, cheap to run, no infrastructure to babysit.

The point of this approach: get a working, good-looking internal tool out the door fast and cheaply, without over-engineering a feature that's fundamentally "mark attendance, log hours, export CSV."

## Explicitly NOT included (by design)

- No authentication — it's a single-supervisor tool, anyone with the link can use it
- No multi-user conflict handling
- No notifications/reminders/scheduling
- No worker photos or document storage
- No payment processing — CSV export is the end of the pipeline; actual payment happens outside the app

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase Postgres via Prisma |
| Hosting | Vercel (free tier) |
| Design reference | Stitch AI |
| Build agent | OpenCode (free models) |

## Project structure

```
/app            → pages (Home, Project, Worker) + CSV export API routes
/components     → ProjectCard, WorkerCard, dialogs, time-block picker, etc.
/lib            → hour/wage calculation, CSV generation, date helpers
/prisma         → schema.prisma + migrations
```

See `architecture.md` for the full schema and business logic, and `design.md` for page layouts and the Stitch prompts used.