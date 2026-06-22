# Design.md — Worker Shift Tracking App

This document defines the visual and UX design for the app, including ready-to-use prompts for Stitch AI (Google) to generate frontend mockups, and component-level guidance for the OpenCode agent to implement with shadcn/ui + Tailwind.

---

## 1. Design Philosophy

- **Functional first.** This is a field tool used by one supervisor, often on a phone, often outdoors, often in a hurry. Every screen should prioritize speed of data entry over visual flourish.
- **High contrast, large tap targets.** Buttons, toggles, and inputs should be comfortably tappable on mobile (min 44px height).
- **Status at a glance.** Present/Absent, project status, and totals should be readable via color/badge without needing to read text closely.
- **Tables that don't feel like spreadsheets until they need to.** Cards for browsing (Home, Project page), genuine data tables only where dense data review is the job (Worker page monthly view).

---

## 2. Style Guide

**Theme base:** shadcn/ui default theme, **slate** or **zinc** base color, light mode primary (allow dark mode as a bonus, not required).

**Color usage:**
| Purpose | Color |
|---|---|
| Present / success | green (shadcn `success`-style badge — emerald-500/600) |
| Absent / inactive | red/rose-500 badge |
| Active project | blue/primary badge |
| Completed project | gray/slate badge |
| Archived project | muted/outline badge |
| Primary actions (Add Project, Add Worker, Export) | primary button (default shadcn primary) |
| Destructive actions (delete, mark absent over existing data) | destructive button variant |

**Typography:** Default shadcn/Tailwind font stack (Inter or system-ui). Headings: `font-semibold`, sizes `text-2xl` (page titles), `text-lg` (card titles), `text-sm` (metadata/labels).

**Spacing:** Generous padding on cards (`p-4`/`p-6`), consistent gap-4 grid layouts.

**Components needed from shadcn:** `button`, `card`, `dialog`, `table`, `input`, `select`, `tabs`, `badge`, `toggle-group`, `calendar` (for date navigation), `popover` (to pair with calendar), `separator`, `dropdown-menu` (for export/status menus), `alert-dialog` (for destructive confirmations).

---

## 3. Page 1 — Home (Dashboard)

**Purpose:** Entry point. Shows all project sites, lets supervisor jump into any project or create a new one.

**Layout:**
- Top bar: App title/logo placeholder + "Add Project" primary button (top right).
- Filter/tabs row: `All | Active | Completed | Archived` (shadcn `tabs`), default to Active.
- Grid of `ProjectCard`s (responsive: 1 column mobile, 2 columns tablet, 3+ columns desktop).

**ProjectCard contents:**
- Project name (bold, large)
- Location (muted, small, if provided)
- Status badge (color per Section 2)
- Worker count (e.g. "12 workers")
- Click anywhere on card → navigate to `/projects/[id]`
- Small dropdown menu (⋮) on card for "Mark Completed" / "Archive" / "Reactivate" actions without entering the project.

**Add Project dialog:** Simple form — Name (required), Location (optional). Submit → creates project with status ACTIVE, closes dialog, new card appears.

**Empty state:** If no projects exist, show a centered illustration-less message: "No projects yet. Add your first project site to get started." + the Add Project button repeated inline.

### Stitch AI prompt — Home page
```
Design a clean, functional dashboard for a construction site management tool.
Top bar with app title on the left and a primary "Add Project" button on the right.
Below that, a horizontal tab/filter bar with options: All, Active, Completed, Archived.
Main content is a responsive grid of project cards (3 columns on desktop, 1 on mobile).
Each card shows: project name (bold, large), location (small gray text), a colored
status badge (blue for active, gray for completed, outline for archived), and a worker
count line like "12 workers". Each card has a small three-dot menu in the top-right
corner for quick status actions. Use a light theme, slate/zinc color palette, rounded
corners (shadcn/ui style), generous spacing, sans-serif typography. Mobile-first,
must look equally good on phone and desktop.
```

---

## 4. Page 2 — Project Page

**Purpose:** The main working page — supervisor manages attendance for all workers on this project, day by day.

**Layout:**
- Top bar: Project name + status badge, back button to Home, "Export Project CSV" button, "Add Worker" primary button.
- Date navigator: a horizontal control showing the currently selected date (default: today), with `< >` arrows and a calendar popover to jump to any date. **This date selection applies to the whole page** — supervisor reviews/edits attendance for one date at a time, across all workers.
- List/grid of `WorkerCard`s for the selected date.

**WorkerCard contents:**
- Worker name (bold)
- Worker type (badge or muted text, e.g. "Mason")
- Hourly wage (small, e.g. "₹150/hr")
- Present/Absent toggle (shadcn `toggle-group`, two options, defaults to whatever is already saved for the selected date, or unset/neutral if no record yet)
- If Present: a "Shift Times" area showing existing time blocks as chips (e.g. "08:00–13:00 ✕", "14:00–18:00 ✕") plus a "+ Add time block" button that opens a small inline/dialog time picker (two `select` or native time inputs: From, To — 24hr format).
- Computed line at the bottom of the card: "Today: 8.5 hrs · ₹1275" (live recalculated as blocks are added/removed).
- Click on worker name/card body (not the toggle/time area) → navigate to `/projects/[id]/workers/[workerId]`.

**Add Worker dialog:** Form — Name (required), Worker Type (text input or a `select` with common presets + "Other" free text), Hourly Wage (number input, required). Submit → new WorkerCard appears in the list for the project.

**Marking Absent when time blocks exist:** trigger an `alert-dialog`: "This will remove X recorded time blocks for [date]. Continue?" before destructive switch.

**Empty state:** "No workers added to this project yet." + Add Worker button.

### Stitch AI prompt — Project page
```
Design a project management page for tracking daily worker attendance on a construction
site. Top bar: project name with a status badge next to it, a back arrow on the far left,
and two buttons on the right — a secondary "Export CSV" button and a primary "Add Worker"
button. Below the top bar, a date navigation bar centered or left-aligned: left arrow,
current date display (e.g. "Mon, 22 June 2026"), right arrow, and a small calendar icon
to jump to any date.
Main content: a vertical list of worker cards (stacking nicely as a 2-column grid on
wider screens). Each card shows the worker's name in bold, their job type as a small
badge, and hourly wage in muted text. Below that, a two-option toggle switch for
Present/Absent (green when present, red/gray when absent). When present, show small
removable chip elements representing shift time ranges like "08:00–13:00", with a
small "+ Add time block" dashed-outline button below them. At the bottom of each card,
show a computed summary line like "Today: 8.5 hrs · ₹1275" in slightly bolder text.
Light theme, rounded cards with subtle shadow, slate/zinc palette, clean spacing,
mobile-first responsive layout.
```

---

## 5. Page 3 — Worker Page

**Purpose:** Payment-focused detail view. Full attendance history for one worker, organized by month, exportable.

**Layout:**
- Top bar: Worker name + worker type badge + hourly wage, back button to Project page, "Export CSV" dropdown (options: "This month", "All time" — maps to the worker-month export endpoint, called repeatedly per month if "all time" is chosen, or zipped — agent's discretion, simplest is per-month export only if "all time" proves complex).
- Month selector: horizontal `tabs` or a `select` listing all months that have data (e.g. "June 2026", "May 2026", ...), most recent first, defaulting to the current month.
- Summary row (3 stat cards side by side): **This Month Hours**, **This Month Wage**, **Days Present** (out of days elapsed in month).
- Main spreadsheet `table` for the selected month:
  - Columns: Date | Day (Mon/Tue..) | Status | Time Blocks | Hours | Wage
  - One row per calendar day of the month (including weekends — supervisor may or may not log work on weekends, table still shows the row).
  - Absent or unmarked days shown with muted/grayed-out row styling.
  - **Weekly subtotal rows** inserted after each week (bold, light background, "Week total: X hrs · ₹Y").
  - **Monthly total row** pinned at the bottom (bold, distinct background): total hours + total wage for the month.

**Responsiveness:** On mobile, the table should switch to a stacked card-per-day layout (same data, vertical cards) rather than a horizontally-scrolled table, OR allow horizontal scroll within a bordered container — agent's choice based on what shadcn `table` handles better; horizontal scroll is acceptable and common for data tables on mobile.

### Stitch AI prompt — Worker page
```
Design a payroll detail page for a single construction worker. Top bar: worker's name
in bold with a small job-type badge next to it and their hourly wage in muted text,
a back arrow on the left, and an export button (with dropdown arrow) on the right.
Below that, a horizontal row of month tabs (e.g. "June 2026", "May 2026", "April 2026")
with the active month highlighted.
Below the tabs, three small summary stat cards side by side: "Hours This Month",
"Wage This Month", and "Days Present", each with a large bold number and a small label.
Main content is a clean data table with columns: Date, Day, Status, Time Blocks, Hours,
Wage. Status column uses small colored badges (green present, gray absent). Rows for
absent days are slightly grayed out. After every 7 rows, insert a bold subtotal row
with a light highlighted background showing the week's total hours and wage. At the
very bottom, a bold "Monthly Total" row with a distinct background color showing the
full month's hours and wage. Light theme, slate/zinc palette, clean borders between
rows, comfortable padding, readable on both desktop and mobile (allow horizontal
scroll on small screens if needed).
```

---

## 6. Shared / Cross-Page Components

| Component | Used on | Notes |
|---|---|---|
| `StatusBadge` | Home, Project, Worker | Generic colored badge, takes a status enum + maps to color |
| `ExportButton` | Project, Worker | Triggers file download from the relevant `/api/export/...` route |
| `ConfirmDialog` | Project (mark absent), any delete action | Wraps shadcn `alert-dialog` |
| `TimeBlockChip` | Project page | Small removable pill showing "HH:mm–HH:mm" |
| `DateNavigator` | Project page | `< [date] >` + calendar popover |
| `MonthTabs` | Worker page | List of available months, generated from `getWorkerAvailableMonths` |

---

## 7. Responsive Behavior Summary

- **Mobile (< 640px):** single column everywhere, worker cards full width, date navigator and export controls collapse into a single row with icons-only buttons where needed, Worker page table scrolls horizontally inside a bordered card.
- **Tablet (640–1024px):** 2-column card grids on Home and Project pages.
- **Desktop (> 1024px):** 3-column card grid on Home, 2-column on Project page (cards are denser with more controls), full-width table on Worker page.

Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) consistently — no custom breakpoints needed for this app's complexity.

---

## 8. Interaction Notes for OpenCode Agent

- Every mutation (toggle present/absent, add time block, add worker, add project) should give immediate optimistic UI feedback — don't make the supervisor wait on a spinner for simple toggles. Use React state + server action revalidation (`revalidatePath`) rather than full page reloads.
- Time inputs: use native `<input type="time">` wrapped in shadcn `input` styling, since it gives a built-in 24hr-capable picker on mobile devices (which matches "24hrs clock" requirement) without extra libraries.
- Keep dialogs (Add Project, Add Worker, Add Time Block) short — 2-4 fields max, no multi-step forms.