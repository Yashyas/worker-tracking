<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# AGENT.md — Instructions for OpenCode Agent

This file tells the agent **how to work**, not what to build. The "what" lives in `architecture.md` (schema, logic, build phases) and `design.md` (layout, style, Stitch prompts). Read both fully before writing any code.

---

## 0. Required reading order

1. `architecture.md` — understand the schema, server actions, routing, and the Phase 0–7 build order. This is the source of truth for data model and logic. Never invent fields, models, or routes not listed there without flagging it to the user first.
2. `design.md` — understand the page layouts, component list, style guide, and the three Stitch AI prompts (Section 3, 4, 5 — Home, Project, Worker pages).
3. This file (`AGENT.md`) — the workflow that ties the two together using the Stitch MCP tool.

Do not start writing application code before Step 1 below is complete for the page you're currently building.

---

## 1. Discover the Stitch MCP tool

At the start of the session, list all available MCP tools/servers in the environment. Look for tools related to Stitch (Google's AI UI design tool) — names will vary by setup, but look for anything resembling:

- `stitch_create_project` / `stitch_new_project`
- `stitch_generate_screen` / `stitch_generate_ui` / `stitch_design`
- `stitch_export_code` / `stitch_get_code` / `stitch_export_html`
- `stitch_list_projects` / `stitch_get_screen`

If a Stitch MCP tool is present, use it per Section 2 below.

If no Stitch MCP tool is available (not connected, or not exposed in this environment), **do not block** — fall back to building pages directly from the written layout descriptions in `design.md` Sections 3–5 using shadcn/ui components, and tell the user once, briefly, that Stitch generation was skipped because no MCP tool was found.

---

## 2. Stitch generation workflow (per page)

Repeat this for each of the three pages — Home, Project, Worker — **before** building that page's React components:

1. **Create or open a Stitch project** (if the tool requires a project/workspace concept) named after this app, e.g. `worker-shift-tracker`.
2. **Generate the screen** using the *exact* prompt text from `design.md` for that page (Section 3 for Home, Section 4 for Project, Section 5 for Worker). Pass the prompt verbatim — it already encodes the layout, components, and style direction. Do not paraphrase it before sending.
3. **Review the result.** Check it against the layout checklist in the corresponding `design.md` section (e.g. for Project page: top bar, date navigator, worker cards with toggle + time chips, add worker dialog). If something required is missing, send a short follow-up refinement prompt to Stitch rather than abandoning the output — only regenerate from scratch if the result is structurally wrong.
4. **Export.** If the Stitch MCP tool can export code (HTML/React), pull that output and use it as a **visual reference**, not a drop-in replacement. Re-implement the markup using shadcn/ui components and Tailwind classes per `architecture.md`'s component list (Section 6 of `architecture.md` / Section 6 of `design.md`) — Stitch output is rarely shadcn-correct out of the box (wrong component primitives, no server actions wired up, etc.). Treat it as a styling/layout reference to match, not final code.
5. **Reconcile theme.** If Stitch's generated colors/spacing differ from the style guide in `design.md` Section 2, the style guide wins — adjust Tailwind config / shadcn theme tokens to stay consistent across all three pages rather than letting each page drift to whatever Stitch produced independently.
6. **Proceed to implementation** of that page's real components, wiring up the server actions from `architecture.md` Section 6, only after the visual reference is settled.

---

## 3. Build order (combine with architecture.md Section 11)

Stitch generation is a *design* step that slots into the existing phase plan — it does not replace any phase, it precedes the UI phases:

| Phase | Action |
|---|---|
| 0 | Project setup (Next.js, Tailwind, shadcn, Prisma) — per architecture.md |
| 1 | Schema & migration — per architecture.md |
| 2 | Core server actions + hour/wage logic — per architecture.md |
| **2.5** | **Stitch: generate Home + Project + Worker page designs** (Section 2 above), settle on final style tokens |
| 3 | Build Home page UI, matched to its Stitch reference |
| 4 | Build Project page UI, matched to its Stitch reference |
| 5 | Build Worker page UI, matched to its Stitch reference |
| 6 | CSV export |
| 7 | Polish & deploy |

Do not generate all three Stitch screens and then disappear into pure implementation for the rest of the build — re-check each page's Stitch reference again right before building it (Phase 3/4/5), in case the design was refined mid-project.

---

## 4. Rules

- **Architecture.md governs data and logic.** If a Stitch-generated design implies a field or interaction not in the schema (e.g. a "worker photo" field it added on its own), ignore that part of the design — do not modify the schema to match Stitch output without checking with the user first.
- **Design.md governs layout and style.** Stitch output is a visual aid for *how* to build what design.md describes, not a new spec.
- **Never skip straight to code generation without reading both documents for the page in question.**
- **Keep Stitch usage lightweight.** One generation pass per page plus at most one or two refinement prompts. Don't iterate endlessly chasing pixel-perfection — this is a functional internal tool, not a polished product.
- **If the Stitch MCP tool errors or rate-limits**, fall back per Section 1 (build directly from design.md) rather than retrying indefinitely.

---

## 5. Definition of done (per page)

A page is complete when:
1. It matches the layout/components described in `design.md` for that page.
2. It is wired to the correct server actions from `architecture.md`.
3. It is responsive per `design.md` Section 7.
4. It uses only shadcn/ui components + Tailwind (no leftover raw HTML/CSS pasted from Stitch export).