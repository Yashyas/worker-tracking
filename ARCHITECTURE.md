# Architecture.md — Worker Shift Tracking App

This document defines the technical architecture for an OpenCode agent to build the app step by step. It does not contain implementation code — only schema, structure, logic rules, and build order. Implementation details (exact code) are left to the agent.

---

## 1. Overview

A no-auth, single-supervisor web app to manually track worker attendance and shift hours across multiple construction project sites, calculate wages, and export payment-ready data as CSV.

**Core entities:** Project → Worker → Attendance (one per worker per day) → TimeBlock (one or more shift segments per Attendance).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Database | Supabase Postgres |
| Hosting | Vercel (Free tier) |
| Frontend design reference | Stitch AI (Google) — see design.md for prompts |
| Auth | None |

No auth means: no NextAuth, no middleware-based route protection, no user/session tables. The app is effectively a single-tenant tool. Anyone with the deployed URL has full access — acceptable per requirements since it's used by one supervisor.

---

## 3. Project Structure (target)

```
/app
  /(dashboard)
    page.tsx                  → Home page (all projects)
  /projects/[projectId]
    page.tsx                  → Project page (worker list, attendance entry)
  /projects/[projectId]/workers/[workerId]
    page.tsx                  → Worker detail page (monthly spreadsheets)
  /api/export/worker/[workerId]/route.ts     → CSV export, single worker single month
  /api/export/project/[projectId]/route.ts   → CSV export, full project
  layout.tsx
  globals.css

/components
  /ui            → shadcn generated components
  project-card.tsx
  worker-card.tsx
  add-project-dialog.tsx
  add-worker-dialog.tsx
  attendance-toggle.tsx
  time-block-picker.tsx
  monthly-attendance-table.tsx
  export-button.tsx

/lib
  prisma.ts            → Prisma client singleton
  hours.ts             → hour calculation, midnight-split logic
  wages.ts             → wage aggregation logic
  csv.ts               → CSV generation helpers
  dates.ts             → date utilities (day/week/month bucketing)

/prisma
  schema.prisma
  migrations/

/server-actions (or /app/**/actions.ts, colocated)
  project-actions.ts
  worker-actions.ts
  attendance-actions.ts
```

Use **Next.js Server Actions** for all mutations (create project, add worker, mark attendance, edit time blocks) instead of building a separate REST API — simpler for a no-auth single-tenant app. Reserve `/api` routes only for CSV export endpoints, since those need to return a file stream/blob rather than a server-action response.

---

## 4. Database Schema (Prisma)

```prisma
enum ProjectStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
}

model Project {
  id        String        @id @default(cuid())
  name      String
  location  String?
  status    ProjectStatus @default(ACTIVE)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  workers   Worker[]
}

model Worker {
  id          String       @id @default(cuid())
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name        String
  workerType  String       // free text: e.g. "Mason", "Helper", "Electrician"
  hourlyWage  Decimal      @db.Decimal(10, 2)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  attendances Attendance[]
}

model Attendance {
  id         String           @id @default(cuid())
  workerId   String
  worker     Worker           @relation(fields: [workerId], references: [id], onDelete: Cascade)
  date       DateTime         @db.Date   // calendar day only, no time component
  status     AttendanceStatus
  timeBlocks TimeBlock[]
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  @@unique([workerId, date])   // exactly one attendance record per worker per day
}

model TimeBlock {
  id           String     @id @default(cuid())
  attendanceId String
  attendance   Attendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)
  fromTime     String     // "HH:mm", 24hr format
  toTime       String     // "HH:mm", 24hr format
  hoursWorked  Decimal    @db.Decimal(5, 2)  // precomputed at save time
  createdAt    DateTime   @default(now())
}
```

**Notes:**
- `Attendance.date` stores only the calendar date. `TimeBlock.fromTime`/`toTime` store time-of-day as strings, kept simple since shifts are manually entered and don't need timezone math.
- A worker can have multiple `TimeBlock`s under one `Attendance` (multiple shift segments per day, per your requirement).
- `hoursWorked` per block is precomputed and stored (not derived on every read) so monthly aggregation queries stay cheap — just `SUM(hoursWorked)`.
- One worker belongs to exactly one project (`Worker.projectId` is required, not nullable) — matches your "one worker = one project only" answer.

---

## 5. Business Logic Rules

### 5.1 Midnight-crossing shifts (split into two day entries)
When a supervisor enters a shift where `toTime < fromTime` (e.g. 22:00 → 06:00):
1. The agent must NOT store this as a single invalid block.
2. Split into two `TimeBlock`s:
   - Block A: `fromTime` → `23:59`, attached to the `Attendance` for the **start date**.
   - Block B: `00:00` → `toTime`, attached to the `Attendance` for the **next calendar date** (create that `Attendance` if it doesn't exist yet, status PRESENT).
3. `hoursWorked` for each block is computed independently and summed normally in aggregations — no special-casing needed downstream once split.
4. This splitting logic should live in `/lib/hours.ts` as a pure function: `splitShiftIfOvernight(date, fromTime, toTime) → TimeBlock[] grouped by date`.

### 5.2 Hour calculation
- `hoursWorked = (toTime - fromTime)` in decimal hours, rounded to 2 decimal places.
- Since splitting (5.1) happens before save, every stored block always has `toTime >= fromTime` — no negative durations to handle at calculation time.

### 5.3 Wage calculation
- Per day: `dayWage = SUM(hoursWorked across all TimeBlocks for that Attendance) × Worker.hourlyWage`.
- Weekly/monthly totals: sum of daily totals within the relevant range.
- Absent days contribute 0 hours and 0 wage automatically (no TimeBlocks exist for an ABSENT Attendance).

### 5.4 Attendance marking
- Default view for "today" on the Project page; supervisor can navigate to any past date and freely add/edit/delete TimeBlocks or flip PRESENT/ABSENT (per your answer: backfill allowed).
- Marking ABSENT for a date should delete any existing TimeBlocks for that Attendance (status flip is destructive of time data — confirm via dialog in UI).

### 5.5 Aggregation buckets (Worker page)
- **Daily**: raw Attendance + TimeBlock rows, one row per day.
- **Weekly**: group by ISO week within the displayed month.
- **Monthly**: one full table per calendar month (per your requirement — "each month has a separate spreadsheet of itself"). Worker page should let the supervisor switch between months (e.g. a month selector/tabs), each rendering its own table with a totals row at the bottom.

---

## 6. Server Actions Plan

No code here — just contract definitions for the agent to implement.

| Action | Input | Output | Notes |
|---|---|---|---|
| `createProject` | name, location? | Project | status defaults ACTIVE |
| `updateProjectStatus` | projectId, status | Project | for Active/Completed/Archived toggle |
| `listProjects` | status filter? | Project[] | Home page; default shows ACTIVE, with toggle for Completed/Archived |
| `createWorker` | projectId, name, workerType, hourlyWage | Worker | from "Add Worker" dialog on Project page |
| `listWorkersByProject` | projectId | Worker[] with today's Attendance joined | Project page main query |
| `markAttendance` | workerId, date, status (PRESENT/ABSENT) | Attendance | creates/updates the unique (workerId, date) record |
| `addTimeBlock` | workerId, date, fromTime, toTime | TimeBlock[] | runs `splitShiftIfOvernight` internally, may create 2 blocks across 2 dates |
| `deleteTimeBlock` | timeBlockId | void | |
| `getWorkerMonthlyData` | workerId, year, month | structured daily rows + weekly/monthly totals | Worker page primary query |
| `getWorkerAvailableMonths` | workerId | list of {year, month} that have data | for month selector tabs on Worker page |

---

## 7. Routing Structure

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | List all projects (grouped/filterable by status), "Add Project" button |
| `/projects/[projectId]` | Project page | Worker cards, attendance entry, "Add Worker" button, project-level CSV export |
| `/projects/[projectId]/workers/[workerId]` | Worker page | Monthly spreadsheet(s), daily/weekly/monthly totals, worker-level CSV export |

---

## 8. CSV Export

Two export endpoints (per your "both" answer):

1. **Worker-month export** — `GET /api/export/worker/[workerId]?year=YYYY&month=MM`
   Columns: Date, Day, Status (Present/Absent), Time Blocks (e.g. "08:00–13:00, 14:00–18:00"), Total Hours, Hourly Wage, Day Wage. Footer row: Monthly Total Hours, Monthly Total Wage.

2. **Project export** — `GET /api/export/project/[projectId]?from=DATE&to=DATE` (default: full project lifetime if no range given)
   Columns: Worker Name, Worker Type, Date, Status, Total Hours, Day Wage. One row per worker per day. Suitable for a full payroll dump.

Use `/lib/csv.ts` to centralize CSV-string generation (simple manual join or a small library like `papaparse`'s `unparse`) and stream it back with `Content-Type: text/csv` and a `Content-Disposition: attachment; filename=...` header.

---

## 9. Environment Variables

```
DATABASE_URL=            # Supabase pooled connection string (for app runtime)
DIRECT_URL=              # Supabase direct connection string (for Prisma migrations)
```

Supabase free tier: use the **pooled connection (port 6543, pgbouncer)** for `DATABASE_URL` and the **direct connection (port 5432)** for `DIRECT_URL` in `schema.prisma`'s `datasource` block — this is required because Vercel serverless functions need connection pooling.

---

## 10. Deployment Plan

1. Create Supabase project → copy `DATABASE_URL` and `DIRECT_URL` into `.env`.
2. Run `npx prisma migrate dev` locally to create schema, then `npx prisma migrate deploy` for production.
3. Push repo to GitHub.
4. Import into Vercel, set the two env vars in Vercel project settings.
5. Vercel free tier: confirm function timeout/region defaults are sufficient (they are, for this workload — simple CRUD, no heavy compute).
6. Add a `postinstall` script (`prisma generate`) so Vercel's build step regenerates the Prisma client.

---

## 11. Build Phases for OpenCode Agent

Follow this order strictly — each phase should be a working, testable increment.

**Phase 0 — Project setup**
- `create-next-app` with TypeScript + Tailwind + App Router.
- Init shadcn/ui, install base components needed (button, card, dialog, table, input, select, tabs, badge, toggle-group).
- Init Prisma, connect to Supabase using env vars above.

**Phase 1 — Schema & migration**
- Write `schema.prisma` exactly as in Section 4.
- Run first migration.
- Seed script (optional) with 1 dummy project + 2 workers for local testing.

**Phase 2 — Core server actions**
- Implement all actions in Section 6 except CSV export.
- Implement `/lib/hours.ts` (overnight split + hour calc) and `/lib/wages.ts` first — these are the trickiest pure logic and should be unit-testable independent of UI.

**Phase 3 — Home page**
- Project list (cards), grouped by status, "Add Project" dialog.

**Phase 4 — Project page**
- Worker cards list, "Add Worker" dialog, attendance Present/Absent toggle per worker per day (default today), time-block add/edit UI per worker per day.

**Phase 5 — Worker page**
- Month selector/tabs, spreadsheet table per month (daily rows + weekly subtotal rows + monthly total row).

**Phase 6 — CSV export**
- Implement both export routes from Section 8, wire up export buttons on Project and Worker pages.

**Phase 7 — Polish & deploy**
- Responsive check on mobile + desktop (per design.md).
- Empty states, loading states, confirmation dialogs for destructive actions (e.g. marking Absent after Present data exists).
- Deploy per Section 10.

---

## 12. Out of Scope (explicitly, to avoid scope creep)

- Authentication/authorization of any kind.
- Multi-supervisor concurrent editing/conflict resolution.
- Notifications, reminders, or scheduling.
- Worker photo uploads or document storage.
- Payroll processing/payment integration — CSV export is the final deliverable, not payment execution.