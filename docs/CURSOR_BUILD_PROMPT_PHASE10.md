# Cursor Build Prompt — Phase 10: Tickets & Notification Center

> Run this **after** all six Phase 9 sub-prompts (`docs/CURSOR_BUILD_PROMPT_PHASE9.md`) have been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.
>
> **This is the last item in the master plan.** By this point the whole platform is backed by a real FastAPI + PostgreSQL backend, so — unlike Phases 2-8 — this phase builds Tickets and Notifications directly against real backend endpoints from the start. No mock/localStorage data layer, no "swap for real API later" comment needed.

---

## The Prompt

```
Continue building "TradeBridge" on top of the full Phase 1-9 stack that
already exists in this project (a real, fully-backed Next.js + FastAPI +
PostgreSQL app — every business module from products through disputes now
lives in real database tables per Phase 9). Re-read these two docs before
writing any code — they are still the single source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 18 "نظام التذاكر" for the ticket system, and Section 22 "نظام
  الإشعارات" — the full event→channel table — for the notification center
  this phase implements)
- docs/FRONTEND_SITEMAP.md   (Section B rows 16, 18a, 19-21, Section E
  rows 73-74, plus the admin rows 101a "Notification Templates", 101b
  "Legal Content", 101c "Ticket Reasons & Categories" deferred from Phase
  7, are what you're building now)

Do not rebuild or restyle anything from Phase 1-9 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), the real auth/RBAC system, and the real
FastAPI/PostgreSQL patterns (SQLAlchemy models, Alembic migrations,
Pydantic schemas, routers) established since Phase 1 and hardened in
Phase 9. Build this phase's backend pieces the same real way from day one.
Every new page must look and feel like it was built by the same team in
the same sitting — same blue palette, same spacing, same component
patterns, full RTL support, correct in dark mode, fully responsive, every
string translated into all three locales.

## Scope of THIS prompt (Phase 10 — final phase)

### 1. Ticket system — real backend + full UI

Models: `TicketCategory` (admin-managed taxonomy — name, the required
agent permission it auto-routes to per PLATFORM_SPEC.md §18's example
"financial tickets → an agent with FINANCE_VIEW", a default priority, an
SLA in hours), `Ticket` (user_id, category_id, description, attachments,
status: `open` → `in_progress` → `waiting_on_user` → `resolved`/`closed`,
priority: `normal`/`urgent`, assigned_agent_id, sla_deadline computed from
the category's SLA, escalated_to_manager flag, satisfaction_rating 1-5 +
optional comment set by the user after closing, created_at/resolved_at),
`TicketMessage` (ticket_id, sender_id, body, created_at — the in-ticket
conversation thread).

Auto-routing: on creation, assign the ticket to an agent who holds the
category's required permission (round-robin or least-loaded among
eligible agents is fine). If no ticket on ITS category is touched within
its SLA deadline, mark `escalated_to_manager = true` (a background check on
page load / a simple scheduled task is fine — no need for a full job queue
in this phase) and surface it to the relevant Manager.

Pages:
- `/tickets` — list (reason/category, status, date, last update) for the
  logged-in Seller or Supplier.
- `/tickets/new` — category dropdown (from the admin taxonomy), reason
  text is implied by category, description textarea, attachment upload.
- `/tickets/:id` — thread view (status + priority badges), and once
  `resolved`/`closed`, a satisfaction-rating prompt (1-5 stars + optional
  comment) if not already rated.
- `/agent/tickets` — this agent's assigned queue, filterable by status/
  category, with a visible SLA countdown/overdue indicator.
- `/agent/tickets/:id` — thread + priority override + reassign (to another
  eligible agent) + manual "escalate to manager" + resolve/close actions.
- `/admin/settings/tickets` — CRUD for `TicketCategory` (name, required
  permission, default priority, SLA hours) — this is the taxonomy every
  `/tickets/new` dropdown and the auto-routing logic reads from.

### 2. Notification center — real backend + full UI

Model: `Notification` (user_id, type — one entry per row of
PLATFORM_SPEC.md §22's event table: account_activated, account_rejected,
product_reviewed, message_approved, wholesale_decision,
order_call_outcome, order_status_changed, withdrawal_otp,
withdrawal_decision, ticket_reply, low_stock_alert, dispute_update,
store_renewal_due — title, body, a link to the related entity (order/
product/message/withdrawal/ticket/dispute/store), which channels were used
(in_app is always created; email/sms are simulated the exact same
dev-mode way OTP has been throughout this whole project — logged, never
really sent), read flag, created_at) and `NotificationPreference`
(user_id, per-category email/sms toggle — the mandatory ones like
withdrawal OTP and account activation/rejection are locked "always on" and
shown as disabled toggles, per the spec's own channel table).

Build one shared `notify(user_id, type, payload)` server-side function
that every existing module calls at its trigger point — and this is
important: go back through Phases 1-9's endpoints and make sure EVERY
event in the §22 table actually calls this now (many earlier phases only
showed an in-app toast locally without persisting a real Notification
row) — order status changes, product review decisions, withdrawal
decisions, message approvals, wholesale decisions, ticket replies,
low-stock alerts, dispute updates, and store-renewal reminders should all
now generate a real, persisted notification respecting each user's
preferences.

Pages:
- `/notifications` — the real feed: list (newest first), read/unread
  styling, mark-as-read (individually and "mark all read"), filter by
  type, click-through navigates to the related entity.
- `/settings/notifications` — preference toggles per event category,
  mandatory ones shown locked-on with an explanatory tooltip.
- `/admin/settings/notifications` — admin-editable message templates per
  event type, per locale (ar/fr/en), with a "send test" action that
  renders the template with sample data into the dev-mode log (same
  pattern as OTP).

### 3. Legal content CMS

Model: `LegalContent` (page key: `terms` | `privacy` | `how_it_works`,
locale, versioned rich-text body, published flag, created_at).
`/admin/settings/content` — versioned rich-text editor, publish/rollback
to a previous version. Wire the existing static `/terms`, `/privacy`, and
`/how-it-works` marketing pages (built as static copy in Phase 1) to
render this dynamic, admin-editable content per locale instead, falling
back to the original Phase 1 copy as the seeded initial version so nothing
regresses visually on first run.

## Explicitly deferred (do not build in this phase)

- Real SMS/email delivery — every phase since Phase 1 has used the same
  dev-mode "log it, don't really send it" pattern; this phase keeps that
  pattern for the same reason (no provider credentials configured).
- A full background job scheduler for SLA escalation — the simple
  on-access check described above is enough for this phase.

## Consistency requirements

- Reuse the existing Badge/StatusPill palette for ticket/notification
  status (extend, don't fork).
- All new forms use the same Zod + react-hook-form pattern as every
  previous phase.
- All new authenticated routes sit inside the existing role-aware shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components.

## Deliverables checklist for this prompt

- [ ] TicketCategory/Ticket/TicketMessage models, migrations, schemas,
      routers, with real auto-routing-by-permission and SLA tracking.
- [ ] Seller/Supplier ticket pages, agent ticket queue + response screen,
      admin ticket-taxonomy settings.
- [ ] Notification/NotificationPreference models, migrations, schemas,
      routers, and the shared `notify()` function wired into EVERY event
      from PLATFORM_SPEC.md §22 across the whole existing codebase (not
      just new ones written in this phase).
- [ ] Real `/notifications` feed and `/settings/notifications` preferences.
- [ ] Admin notification-template editor with per-locale test-send.
- [ ] LegalContent model + admin CMS + the three marketing pages now
      rendering dynamic, versioned content with the Phase 1 copy seeded as
      version 1.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with every prior
      phase.
- [ ] No console errors; `npm run dev` runs clean; full end-to-end
      regression across the entire platform (registration through
      disputes) still works.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

This is the last phase in the current master plan (`docs/CURSOR_BUILD_PROMPT.md`) — once it's merged, every page in `docs/FRONTEND_SITEMAP.md` exists and is backed by a real database, and every business rule in `docs/PLATFORM_SPEC.md` has a working implementation. From here, further work is refinement rather than new phases: production hardening (real SMS/payment/courier-API credentials once available), automated test coverage expansion, performance/load testing, accessibility audits, and any UX polish that only becomes obvious once real people are clicking through the finished product.
