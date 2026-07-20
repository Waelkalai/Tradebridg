# First Build Prompt for Cursor — TradeBridge (Phase 1: Foundation, Design System & Auth Backend)

> Copy everything in the code block below and paste it as your first message to a Cursor Agent, ideally in a **fresh empty repository** (or the current one before any app code exists). It kicks off **Phase 1** only (monorepo foundation, real Next.js + FastAPI + PostgreSQL stack, design system, i18n, theming, marketing site, and the full auth flow backed by a real database) — not the entire 100+ page platform at once. That scoping is intentional: it gives you a real, reviewable, working, "amazing-looking" app fast, on the real tech stack, and every later prompt just adds one business module (products, orders, wallet, scanning, etc.) on top of this same foundation.
>
> Follow-up prompts for later phases are listed at the bottom of this file.

---

## The Prompt

```
You are building the foundation for "TradeBridge" — a professional COD (Cash
on Delivery) e-commerce marketplace platform for Tunisia. Two documents in
this repo are the single source of truth for every business rule, role, and
page — read both FULLY before writing any code:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic)
- docs/FRONTEND_SITEMAP.md   (every page for every role, with routes)

Do not invent business rules that contradict them. If something is
ambiguous, make the most reasonable assumption consistent with the spec and
keep moving — don't stop to ask.

## Tech stack (final decision for the whole platform, not just this prompt)

- Frontend: Next.js (latest stable, App Router) + TypeScript (strict mode).
- Backend: FastAPI (Python 3.12+), fully async (SQLAlchemy 2.0 async ORM +
  asyncpg driver), Pydantic v2 schemas, Alembic for migrations.
- Database: PostgreSQL 16.
- Everything must run locally via Docker Compose (Postgres + FastAPI, with
  hot reload/volume mounts for dev). The Next.js app runs separately via
  `npm run dev` (or `pnpm dev`) for fast HMR, talking to the API over HTTP
  using a `NEXT_PUBLIC_API_URL` env var.
- Repo layout:
  ```
  /apps/web/            Next.js app
  /apps/api/             FastAPI app
    /apps/api/app/core/  config, security, db session
    /apps/api/app/models/
    /apps/api/app/schemas/
    /apps/api/app/api/   routers
    /apps/api/alembic/
  /docker-compose.yml
  /.env.example
  /docs/ (already exists — do not move it)
  ```

## Scope of THIS prompt (Phase 1 only)

Do NOT build every page from the sitemap yet, and do NOT build any business
module beyond auth (no products, orders, wallet, chat, scanning yet — those
are later phases). Build only:

1. Monorepo + Docker Compose foundation for the full stack above, running
   cleanly with one command each (`docker compose up` for db+api,
   `npm run dev` for web).
2. A real FastAPI + PostgreSQL backend for authentication and account
   creation:
   - `User` table covering every KYC field from PLATFORM_SPEC.md §3: role
     (seller/supplier/agent/manager/admin), auto-generated username in the
     exact `<letter><4 digits>` format from the spec (S=Seller, P=Supplier/
     Shipper, A=Agent, M=Manager, D=Admin — generate uniquely server-side,
     never client-side), full name, CIN number, CIN photo front/back (store
     uploaded files on local disk under a gitignored `/uploads` volume for
     now — structure the storage code behind an interface so it's trivial to
     swap for S3-compatible storage later), email, phone, company name
     (optional), fiscal/"matricule fiscal" number (optional), hashed
     password, account status enum (pending_review / active / rejected /
     suspended / banned) with a reason field, created_at/updated_at.
   - Endpoints: `POST /auth/register/seller`, `POST /auth/register/supplier`
     (supplier also takes a primary depot/agency reference — just accept a
     free-text depot name + address for now, no Agency table yet), `POST
     /auth/login` (returns JWT access token), `GET /auth/me`, `POST
     /auth/otp/request`, `POST /auth/otp/verify`, `POST
     /auth/forgot-password`, `POST /auth/reset-password`, `GET /health`.
   - OTP: no SMS provider is configured yet. Implement OTP generation/
     storage/expiry for real (6-digit code, 5-minute expiry, hashed at rest,
     rate-limited), but instead of sending a real SMS, log the code clearly
     to the FastAPI console AND return it in the API response ONLY when
     `ENV=development` (guard this behind a settings flag, never in prod).
     Leave a clearly marked `# TODO: swap for real SMS gateway (e.g. Twilio/
     local Tunisian SMS provider) once credentials are available as a
     secret` comment at the exact call site.
   - Password hashing via passlib (bcrypt), JWT via python-jose, proper
     Pydantic v2 request/response schemas, and sensible input validation
     (Tunisian phone number format, CIN format, etc.).
   - CORS configured for the Next.js dev origin.
   - Alembic migration(s) committed and runnable (`alembic upgrade head`)
     against the Compose Postgres instance.
3. A typed API client in the Next.js app (thin fetch wrapper, e.g.
   `lib/api-client.ts` + a small `lib/auth.ts` that calls the real endpoints
   above and stores the JWT — httpOnly cookie preferred over localStorage if
   you can wire that cleanly with the FastAPI CORS/cookie settings; otherwise
   a documented fallback to a secure client-side store is acceptable for
   this phase). Wire the entire auth UI flow to these REAL endpoints — no
   mock/local data for auth in this phase, since the backend is real from
   day one.
4. The public marketing site (sitemap Section A, pages 1-9, 12-15).
5. The full authentication flow UI (login, register-choose-role, register as
   seller, register as supplier, registration pending, forgot/reset
   password, OTP verification, email verification) — all calling the real
   API from step 3.
6. A role-aware authenticated app shell: sidebar + topbar navigation that
   changes based on role (Seller "S" / Supplier "P" / Agent "A" / Manager
   "M" / Admin "D"), using the nav structure from FRONTEND_SITEMAP.md
   sections C-G, plus a dashboard "home" page per role. Since no business
   modules exist yet, dashboard KPI cards use realistic MOCK numbers on the
   frontend only (clearly commented as placeholder data to be wired to real
   endpoints in later phases) — but the logged-in user info shown in the
   topbar (username, role, avatar) must come from the real `/auth/me` call.
   Every other page from the sitemap can be a styled "coming soon"
   placeholder that already sits inside the correct route and layout — do
   not skip creating the route, just leave the page body minimal for now.

## Internationalization — ar / fr / en, three full locales

- Use next-intl (or an equally solid App Router i18n solution) with THREE
  locales from day one: Arabic (`ar`, RTL, default locale for Tunisia),
  French (`fr`, LTR), English (`en`, LTR). Every single string in every
  component built in this phase must go through the i18n layer — no
  hardcoded UI text, even placeholder text.
- Route structure: `/[locale]/...` with a locale switcher in the topbar/
  footer (flag or language-name dropdown) that preserves the current route
  when switching.
- RTL must actually flip the whole layout correctly for `ar`: sidebar side,
  icon directions (chevrons, arrows), text alignment, form field order,
  margin/padding logical properties (use CSS logical properties or Tailwind
  RTL-aware utilities, not hardcoded left/right). French and English both
  render LTR.
- Typography: Inter (or Geist) for Latin (fr/en) text, Cairo or IBM Plex
  Sans Arabic for Arabic text — load both and switch the active font based
  on the active locale via the root layout.
- Seed all three locale files with real, correctly translated copy for the
  marketing pages and auth flow (not lorem ipsum) — Arabic and French are
  the primary business languages per the spec, English is the third
  supported language for broader reach; keep tone and terminology
  consistent across all three (e.g. "Wholesale"/"Gros"/"الجملة",
  "Retour"/"الرتور" stays as "Retour" in French and English too since it's
  the platform's own term, but is explained in context).

## Theming — light / dark / AUTO, not just light/dark

- Use next-themes (or equivalent) configured with THREE modes: `light`,
  `dark`, and `auto` (system preference), not a simple binary toggle.
  `auto` is the default on first visit and must actually track OS-level
  `prefers-color-scheme` changes live without a page reload.
- Build a theme switcher control (in the topbar) that cycles/selects between
  the three modes with a clear icon per state (sun / moon / monitor-auto)
  and persists the user's explicit choice (localStorage/cookie) once they
  pick light or dark manually.
- Dark mode uses a deep navy/slate background (never pure black), keeping
  the brand blue as the accent so contrast and brand identity stay strong in
  both modes. Every component in the shared UI kit must be designed and
  tested in both light and dark from the start — no "dark mode looks broken"
  components.

## Design direction — "amazing style", primary color BLUE, animated & professional

This must look like a premium, modern SaaS/marketplace product — think
Stripe, Linear, or Vercel's dashboard polish — NOT a generic admin template.
Every interaction should feel intentional and smooth.

- Primary color: blue (blue-600 `#2563EB` / blue-700 `#1D4ED8` as the core
  brand blue). Build a full custom Tailwind color scale around it (50-950),
  plus a secondary accent (a cyan or indigo) for gradients and highlights,
  and full semantic color tokens (success/warning/danger/info) that also
  have correct dark-mode variants.
- Marketing/landing pages: bold hero section with a subtle animated blue
  gradient mesh/blob background, large confident typography, glassmorphism
  cards for feature highlights, animated counters for platform stats
  (products, agencies, orders shipped), smooth scroll-reveal animations,
  tasteful parallax/hover-tilt on feature cards.
- Use Framer Motion throughout for tasteful micro-interactions: animated
  page/route transitions, staggered list/card entrance animations, button
  press/hover states, animated form-field focus states, toast notifications
  that slide/fade in (use `sonner` or shadcn's toast), animated modal/dialog
  open-close, skeleton-to-content crossfade on data load.
- Dashboards: clean light theme by default (before the user picks a mode, it
  follows system via `auto`), with the dark navy/slate variant described
  above. Sidebar navigation with an animated active-state blue highlight
  (sliding indicator, not just a static background), rounded-2xl cards with
  soft shadows, generous whitespace, consistent 8px-based spacing scale.
- Build a small internal component library FIRST (Button, Input, Select,
  Card, Badge/StatusPill, StatCard, Table, Modal/Dialog, Sidebar, Topbar,
  EmptyState, Skeleton loaders, Toast, Tabs, Tooltip, LanguageSwitcher,
  ThemeSwitcher) styled consistently with this palette in both themes and
  all three locales, then compose every page from those instead of one-off
  styles. Consider a lightweight `/design-system` internal-only route that
  showcases every component/state — this makes future phases much faster
  and more consistent.
- Every page must be fully responsive (mobile-first) and look intentional on
  mobile, not just "shrunk desktop." Test at minimum 375px, 768px, 1440px.

## User roles reminder (from the spec — keep these letters exact)

S = Seller · P = Supplier/Shipper · A = Agent · M = Manager · D = Admin/Director
(auto-generated usernames look like S4821, P1190, etc. — reflect this format
anywhere a username/ID is displayed, e.g. in the topbar user menu.)

## Deliverables checklist for this prompt

- [ ] `docker compose up` starts PostgreSQL + FastAPI cleanly; `alembic
      upgrade head` runs against it; `GET /health` returns 200.
- [ ] Real register → OTP verify → pending-review → (agent would activate,
      but agent tooling doesn't exist yet, so allow a dev-only "force
      activate" helper endpoint or seed script for testing) → login → JWT
      session → role-aware dashboard flow works end-to-end against real
      Postgres data, for both Seller and Supplier registration forms with
      every field listed in FRONTEND_SITEMAP.md rows 10-11.
- [ ] Next.js app scaffolded and running (`npm run dev`) with no console
      errors, calling the real FastAPI endpoints via the typed API client.
- [ ] Three full locales (ar default/RTL, fr, en) with a working language
      switcher and correctly mirrored RTL layout, verified visually.
- [ ] Three theme modes (light/dark/auto) with a working switcher, `auto`
      tracking OS changes live, verified in both light and dark for every
      component built.
- [ ] Design tokens / Tailwind theme configured around the blue palette,
      shared UI kit built and used consistently, animations wired in via
      Framer Motion as described above.
- [ ] Marketing pages: Landing, About, How It Works, Pricing, Contact,
      Terms, Privacy — all fully designed with real copy/numbers from
      docs/PLATFORM_SPEC.md (pricing: 100dt/year, 10dt/month, 0.255dt/
      product), translated into all three locales.
- [ ] Role-aware dashboard shell + 5 role dashboards (S/P/A/M/D) with
      placeholder KPI cards (clearly commented as mock), each reachable
      after a real login as a seeded user of that role (add a small seed
      script that creates one active user per role for local dev/testing).
- [ ] Root README updated with: how to run the whole stack (Compose + web),
      environment variables needed (`.env.example` committed), how to seed
      dev users, and how OTP works in development mode.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer making a documented assumption and
moving forward.
```

---

## Suggested follow-up prompts (later phases)

Use these one at a time, after each phase is merged and reviewed, so every phase stays reviewable:

1. **Phase 2 — Product catalog & agent review**: supplier "Add Product" full form (variants, price tiers/MOQ, media, main picture, depot), supplier product list with status badges, agent product review queue + detail with the 3-way decision, seller product browsing/detail pages. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE2.md`](./CURSOR_BUILD_PROMPT_PHASE2.md) (still frontend-first with a mock data layer for products — real FastAPI/Postgres models for products/agencies/depots get added as their own backend slice once the UI/UX is validated, exactly like auth was in Phase 1).
2. **Phase 3 — Orders & the confirmation-call flow**: seller "Create Order" with the single-depot rule, orders list/detail with the full status timeline, agent "orders to confirm" queue and call-outcome logging. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE3.md`](./CURSOR_BUILD_PROMPT_PHASE3.md) (introduces a minimal `lib/wallet.ts` stub just to gate order creation on the retour balance — the real wallet UI is Phase 4).
3. **Phase 4 — Wallet, retour balance & withdrawals**: wallet dashboard, withdrawal request flow (bank/cash) with OTP, retour balance page, manager withdrawal-approval queue — promotes the Phase 3 `lib/wallet.ts` stub into the real module. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE4.md`](./CURSOR_BUILD_PROMPT_PHASE4.md) (also reserves the escrow ledger-entry types for Phase 5 without implementing them yet).
4. **Phase 5 — Moderated chat & wholesale**: conversation inbox/thread UI with the "pending review" state, agent message-moderation queue, wholesale request flow with escrow status (implements the `debit_escrow_hold`/`credit_escrow_release` ledger entries reserved by Phase 4). ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE5.md`](./CURSOR_BUILD_PROMPT_PHASE5.md) (wholesale receiving/matching at the agency is simulated with a dev-only control until Phase 6 wires it to real scans; wholesale mismatch/rejection outcomes flag a dispute deferred to Phase 8).
5. **Phase 6 — Warehouse scanning**: stock-in/boxing/handover/returns/transfer scan screens designed for both a hardware barcode scanner (keyboard-emulation input) and a camera-based PWA scan; also wires the mocked preparing/ready_for_pickup/handed_to_courier order-status transitions from Phase 3, and the Phase 5 wholesale-receiving simulation, to real scan events. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE6.md`](./CURSOR_BUILD_PROMPT_PHASE6.md) (uses a fixed mock courier list until Phase 7 makes it admin-configurable).
6. **Phase 7 — White-label store & admin portal**: seller store setup/billing/API keys, the public storefront (Section H), and essentially the whole remaining Admin portal — users, agencies, managers, commissions/fee settings, couriers (making Phase 6's fixed mock courier list admin-configurable), product/order oversight, platform-wide finance (deferred from Phase 4), stores oversight, unified audit log, and the roles reference matrix. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE7.md`](./CURSOR_BUILD_PROMPT_PHASE7.md) (notification templates/legal-content CMS/ticket taxonomy admin screens are deferred to Phase 10; `/admin/disputes` is deferred to Phase 8).
7. **Phase 8 — Disputes & post-delivery returns**: seller/agent/admin dispute pages (sitemap rows 32a/32b, 74a/74b, 101d) deferred from Phase 3, plus the wholesale mismatch/rejection disputes flagged in Phase 5, wiring the "Open Dispute" entry points to a real flow with evidence upload, agent decision, and refund via the wallet module from Phase 4 (`debit_dispute_refund`). ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE8.md`](./CURSOR_BUILD_PROMPT_PHASE8.md) (also adds a rule-based, no-AI dispute-rate escalation flag surfaced on the Manager dashboard and Admin user detail pages).
8. **Phase 9 — Backend hardening**: promote the remaining mock/frontend-only data layers (agencies/depots/couriers, products, orders+wallet, chat+wholesale, scanning, store+disputes) to real FastAPI + PostgreSQL models and endpoints, reusing the auth backend's patterns (Alembic migrations, Pydantic schemas, async SQLAlchemy) from Phase 1, and moving every client-side business/financial rule server-side. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE9.md`](./CURSOR_BUILD_PROMPT_PHASE9.md) — split into 6 sequential sub-prompts (9a-9f) run one at a time given how much repetitive, dependency-ordered infrastructure work this phase covers.
9. **Phase 10 — Tickets & notification center**: the support-ticket system (list/new/detail for sellers & suppliers, the agent tickets queue and response screen) deferred from every earlier phase, the admin notification-template/legal-content/ticket-taxonomy settings deferred from Phase 7, plus fleshing out the real `/notifications` feed and `/settings/notifications` preferences beyond their Phase 1 placeholders.

Each of these follow-up prompts should also start with "Read docs/PLATFORM_SPEC.md and docs/FRONTEND_SITEMAP.md" and explicitly say which sitemap rows it covers, exactly like this one did.
