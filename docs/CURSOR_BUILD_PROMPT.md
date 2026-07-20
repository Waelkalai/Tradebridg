# First Build Prompt for Cursor — TradeBridge (Phase 1: Foundation & Design System)

> Copy everything in the code block below and paste it as your first message to a Cursor Agent in this repository. It kicks off **Phase 1** only (foundation, design system, marketing site, auth flow, and the role-aware dashboard shell) — not the entire 100+ page platform at once. That scoping is intentional: it gives you a real, reviewable, "amazing-looking" app fast, and every later prompt just adds one module (products, orders, wallet, scanning, etc.) on top of this same foundation.
>
> Follow-up prompts for later phases are listed at the bottom of this file.

---

## The Prompt

```
You are building the frontend foundation for "TradeBridge" — a COD (Cash on
Delivery) e-commerce marketplace platform for Tunisia. Two documents in this
repo are the single source of truth for every business rule, role, and page:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic)
- docs/FRONTEND_SITEMAP.md   (every page for every role, with routes)

Read both files fully before writing any code. Do not invent business rules
that contradict them. If something is ambiguous, make the most reasonable
assumption consistent with the spec and keep moving — don't stop to ask.

## Scope of THIS prompt (Phase 1 only)

Do NOT build every page from the sitemap yet. Build only:

1. Project foundation (tooling, design system, reusable UI kit).
2. The public marketing site (Section A of the sitemap, pages 1-9, 12-15).
3. The full authentication flow (login, register-choose-role, register as
   seller, register as supplier, registration pending, forgot/reset password,
   OTP verification, email verification).
4. A role-aware authenticated app shell: sidebar + topbar navigation that
   changes based on role (Seller "S" / Supplier "P" / Agent "A" / Manager "M"
   / Admin "D"), using the nav structure from FRONTEND_SITEMAP.md sections
   C-G, plus a dashboard "home" page per role showing placeholder KPI cards
   (use realistic mock numbers) matching what each dashboard is supposed to
   show. Every other page can be a styled "coming soon" placeholder that
   already sits inside the correct route and layout — do not skip creating
   the route, just leave the page body minimal for now.

## Tech stack

- Next.js (latest stable, App Router) + TypeScript, strict mode.
- Tailwind CSS + shadcn/ui (Radix primitives) for the component library.
- Framer Motion for tasteful micro-interactions (hover states, page
  transitions, animated stat counters on the landing page).
- lucide-react for icons.
- Zod + react-hook-form for all form validation (auth forms especially).
- next-intl (or an equivalent) scaffolded for two locales: Arabic (RTL,
  default) and French (LTR) — every string must go through the i18n layer
  from day one, even if French translations are placeholder copies of the
  Arabic/English text for now. Make sure RTL actually flips layout correctly
  (sidebar side, icon direction, text alignment).
- No real backend/database yet — use a thin mock/local-storage-backed auth
  layer just so the flow (register → pending → login → dashboard) feels
  real and persists across refresh in dev. Structure this mock layer behind
  a clean interface (e.g. lib/auth.ts) so it's trivial to swap for a real
  API later without touching UI components.

## Design direction — "amazing style", primary color BLUE

This must look like a premium, modern SaaS/marketplace product — think
Stripe, Linear, or Vercel's dashboard polish — NOT a generic admin template.

- Primary color: blue (blue-600 #2563EB / blue-700 #1D4ED8 as the core
  brand blue). Build a full custom Tailwind color scale around it (50-950),
  plus a secondary accent (a cyan or indigo) for gradients and highlights.
- Marketing/landing pages: bold hero section with a subtle animated blue
  gradient mesh/blob background, large confident typography, glassmorphism
  cards for feature highlights, animated counters for platform stats
  (products, agencies, orders shipped), smooth scroll-reveal animations.
- Dashboards: clean light theme by default with a dark mode toggle (dark
  mode should use a deep navy/slate background, not pure black, keeping blue
  as the accent). Sidebar navigation with active-state blue highlight,
  rounded-2xl cards with soft shadows, generous whitespace, consistent
  8px-based spacing scale.
- Typography: Inter (or Geist) for Latin text, Cairo or IBM Plex Arabic for
  Arabic text — load both and switch based on locale.
- Build a small internal component library first (Button, Input, Select,
  Card, Badge/StatusPill, StatCard, Table, Modal/Dialog, Sidebar, Topbar,
  EmptyState, Skeleton loaders) styled consistently with this palette, then
  compose every page from those instead of one-off styles.
- Every page must be fully responsive (mobile-first) and look intentional
  on mobile, not just "shrunk desktop."

## User roles reminder (from the spec — keep these letters exact)

S = Seller · P = Supplier/Shipper · A = Agent · M = Manager · D = Admin/Director
(auto-generated usernames look like S4821, P1190, etc. — reflect this format
anywhere a username/ID is displayed, e.g. in the topbar user menu.)

## Deliverables checklist for this prompt

- [ ] Project scaffolded and running (`npm run dev`) with no console errors.
- [ ] Design tokens / Tailwind theme configured around the blue palette.
- [ ] Shared UI kit built and used consistently.
- [ ] Marketing pages: Landing, About, How It Works, Pricing, Contact, Terms,
      Privacy — all fully designed, not lorem-ipsum placeholders (use the
      real copy/numbers from docs/PLATFORM_SPEC.md and docs/pricing figures:
      100dt/year, 10dt/month, 0.255dt/product).
- [ ] Full auth flow working end-to-end with the mock layer, including the
      seller vs. supplier registration forms with every field listed in
      FRONTEND_SITEMAP.md rows 10-11 (CIN number, email, CIN photo front+back
      upload, company name, optional fiscal number, password, + depot
      selection for suppliers), OTP step, and the "pending review" state.
- [ ] Role-aware dashboard shell + 5 role dashboards (S/P/A/M/D) with
      placeholder KPI cards, reachable after a mock login for each role
      (add a small dev-only role switcher in the corner so I can preview
      all five without re-registering each time).
- [ ] RTL Arabic layout verified to actually mirror correctly.
- [ ] Short README section added describing how to run the project and how
      the mock auth/role-switcher works.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer making a documented assumption and
moving forward.
```

---

## Suggested follow-up prompts (later phases)

Use these one at a time, after each phase is merged and reviewed, so every phase stays reviewable:

1. **Phase 2 — Product catalog & agent review**: supplier "Add Product" full form (variants, price tiers/MOQ, media, main picture, depot), supplier product list with status badges, agent product review queue + detail with the 3-way decision, seller product browsing/detail pages. ✅ Full prompt ready: [`docs/CURSOR_BUILD_PROMPT_PHASE2.md`](./CURSOR_BUILD_PROMPT_PHASE2.md).
2. **Phase 3 — Orders & the confirmation-call flow**: seller "Create Order" with the single-depot rule, orders list/detail with the full status timeline, agent "orders to confirm" queue and call-outcome logging.
3. **Phase 4 — Wallet, retour balance & withdrawals**: wallet dashboard, withdrawal request flow (bank/cash) with OTP, retour balance page, manager withdrawal-approval queue.
4. **Phase 5 — Moderated chat & wholesale**: conversation inbox/thread UI with the "pending review" state, agent message-moderation queue, wholesale request flow with escrow status.
5. **Phase 6 — Warehouse scanning**: stock-in/boxing/handover/returns/transfer scan screens designed for both a hardware barcode scanner (keyboard-emulation input) and a camera-based PWA scan.
6. **Phase 7 — White-label store & admin settings**: seller store setup/billing/API keys, the public storefront (Section H), and the remaining admin settings screens (commissions, couriers, roles matrix, audit logs).

Each of these follow-up prompts should also start with "Read docs/PLATFORM_SPEC.md and docs/FRONTEND_SITEMAP.md" and explicitly say which sitemap rows it covers, exactly like this one did.
