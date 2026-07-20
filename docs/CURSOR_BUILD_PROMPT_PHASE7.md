# Cursor Build Prompt — Phase 7: White-Label Store & Admin Portal

> Run this **after** Phase 6 (`docs/CURSOR_BUILD_PROMPT_PHASE6.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.
>
> **Scope note:** this phase is intentionally broader than earlier ones — it finishes BOTH the white-label store (seller + public storefront) AND essentially all remaining Admin-role pages, since no other phase in the plan covers baseline admin CRUD (users/agencies/managers/oversight). It's the last "wide" phase before things narrow back down to Disputes (8), Backend hardening (9), and Tickets (10).

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1-6 work that already
exists in this project (foundation/auth, products/depots, orders, wallet,
chat/wholesale, warehouse scanning). Re-read these two docs before writing
any code — they are still the single source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 14 "المتجر المستقل للبائع" for the white-label store, Section 10
  for the commission model this phase makes admin-editable, Section 17 for
  the account-creation chain (Admin → Manager → Agent) relevant to the
  admin Managers screen, and Section 20 for delivery-carrier integration
  relevant to the admin Couriers screen)
- docs/FRONTEND_SITEMAP.md   (Section C rows 39-45, Section H rows
  102-106a, and Section G rows 87-101 EXCEPT 101a/101b/101c — deferred to
  Phase 10 — and 101d — deferred to Phase 8 — are what you're building now)

Do not rebuild or restyle anything from Phase 1-6 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), and every existing lib/*.ts data module (products,
orders, wallet, wholesale, messages, scanning). Every new page must look
and feel like it was built by the same team in the same sitting — same blue
palette, same spacing, same component patterns, full RTL support, correct
in dark mode, fully responsive, every string translated into all three
locales.

## Part A — White-Label Store (Seller side)

### 1. lib/store.ts data layer

Mock/localStorage-backed `StoreSubscription`: seller_id, slug (unique,
validated: lowercase, alphanumeric + hyphens), plan (`monthly` | `yearly`),
status (`active` | `past_due` | `suspended` | `cancelled`), created_at,
next_billing_date, api_key (single active key), branding (logo url,
primary color, store display name), and a `published_products` list where
each entry is { product_id, custom_price, custom_description }. Extend
lib/orders.ts (Phase 3) with an optional `source: "platform" | "storefront"`
and `store_id` field on Order.

### 2. Seller store pages

- `/seller/store/setup` — onboarding: pick a slug (live availability check
  against existing mock slugs), pick a plan (10dt/month or 100dt/year, show
  the full pricing table from PLATFORM_SPEC.md §14), a note that only
  products accepted "whole stores" (Phase 2's accepted_global status) are
  eligible, submit creates the subscription (status=active) and an initial
  API key.
- `/seller/store` — dashboard: mock visits chart, real orders-from-store
  count/list (filtered by `source=storefront` for this seller), revenue
  chart, next invoice date/plan summary.
- `/seller/store/products` — toggle which accepted_global products are
  published; per-item custom price (validate it can't go below that
  product's own base retail price — documented assumption: this is the
  floor that "guarantees the platform's commission margin" per the spec)
  and custom description; a live running counter of
  "N products × 0.255dt = X dt/month" fee.
- `/seller/store/settings` — logo upload, primary brand color picker
  (defaults to the platform blue), display name, slug (read-only after
  creation, changing it requires a support ticket), a "Request luxury
  design" button that links to the existing Phase 1 ticket "coming soon"
  placeholder (the real ticket system is Phase 10 — don't build it here).
- `/seller/store/billing` — current plan, next invoice date/amount,
  mock payment history, the per-product fee line-item breakdown, a "Change
  Plan" action, and the non-renewal lifecycle from the spec: missed renewal
  → `past_due` → (after a grace period) `suspended` (storefront shows a
  "temporarily unavailable" page to visitors) → `cancelled` if never
  resolved. A dev-only "simulate time passing" control (same pattern as
  Phases 4/5) lets you walk through these transitions without waiting.
- `/seller/api-keys` — show/regenerate the store's API key (regenerating
  immediately invalidates the old one), copy-to-clipboard, and a short
  "webhook events" reference panel documenting `product.updated`,
  `order.created`, `order.status_changed`, `wallet.updated` from
  PLATFORM_SPEC.md §14 with example JSON payloads (documentation only, no
  real webhook delivery needs to be implemented).

### 3. Public storefront (customer-facing)

The sitemap's `/{store-domain}/...` pattern implies a custom domain per
seller in production; for this phase, implement it as `/store/[slug]/...`
within the same Next.js app (document this clearly as a stand-in — real
custom-domain routing via middleware/DNS is a future infra concern, not a
frontend one). This section has its OWN lightweight public layout (no
authenticated dashboard shell/sidebar), still fully i18n'd (ar/fr/en) and
themed using the seller's chosen brand color (falling back to platform
blue), but visually distinct from the internal marketplace UI — simpler,
storefront-style.

- `/store/[slug]` — home: seller's branding, featured published products.
- `/store/[slug]/products` — grid of this seller's published products.
- `/store/[slug]/products/[productId]` — detail: images, the seller's
  custom price/description, "Order Now" (COD only, no online payment UI at
  all).
- `/store/[slug]/checkout` — guest customer form (name, phone, address,
  governorate/delegation — reuse Phase 3's list, quantity). Submitting
  creates a real Order via lib/orders.ts tagged `source="storefront"` and
  the right `store_id`/seller_id — since there's no seller present to tick
  a "self-confirm" box here, storefront orders always default to
  `agent_call` confirmation and enter the normal Phase 3
  confirmation-queue/status pipeline unchanged.
- `/store/[slug]/order-confirmation` — thank-you page, order summary, "an
  agent will call to confirm" notice.
- `/store/[slug]/track-order` — guest lookup by phone + order reference,
  showing a public-safe read-only variant of Phase 3's status-timeline
  component (no internal fields like wallet/commission ever exposed here).
- If a store's subscription is `suspended`/`cancelled`, every route above
  shows a clear "this store is temporarily unavailable" page instead.

## Part B — Admin Portal

### 4. Promote agencies to a real managed module

If the mock agencies list used since Phase 2 is still a flat hardcoded
array, promote it to `lib/agencies.ts` (id, name, address, governorate,
manager_id, working_hours, linked courier IDs) so it can be properly
CRUD'd from the admin pages below without breaking every earlier phase
that already references it by ID.

### 5. Admin pages (role D)

- `/admin/dashboard` — platform-wide KPIs: user counts by role/status,
  agency count, order counts by status, GMV (sum of order sale prices),
  an "active issues" count (open incidents from Phase 6 + pending
  withdrawals from Phase 4 + open disputes once Phase 8 exists — show 0 for
  that part with a note for now).
- `/admin/users` — search/filter by role/status, suspend/reactivate.
- `/admin/users/:id` — full profile: KYC docs, wallet summary (read from
  lib/wallet.ts), order history, and a guarded "change role" action that
  requires a confirmation step (this is a sensitive, unusual operation —
  make that clear in the UI).
- `/admin/agencies`, `/admin/agencies/new`, `/admin/agencies/:id` — CRUD
  against lib/agencies.ts from step 4.
- `/admin/managers` — create/edit/deactivate manager accounts, per the
  account-creation chain in PLATFORM_SPEC.md §17 (Admin creates Managers,
  Managers create Agents — the Agent creation UI already exists from
  Phase 1's manager portal).
- `/admin/settings/commissions` — editable platform-wide rates: seller %
  and supplier % (default 3%/3%), retour fee (default 5dt), store
  subscription pricing (100dt/10dt/0.255dt), withdrawal min/max per type.
  Document clearly that edits apply to new records going forward, not
  retroactively to existing orders/wallets.
- `/admin/settings/couriers` — CRUD for courier partners (name, active
  toggle, mock "API credentials" fields clearly marked as placeholders
  since no real courier API integration exists). This list REPLACES the
  fixed mock courier list Phase 6's handover-scan screen used — wire
  `/agent/warehouse/handover`'s courier selector to read from here now.
- `/admin/products` — oversight across all suppliers' products (Phase 2),
  with an "override decision" action to change any product's status
  regardless of the original agent's decision (logs to the audit log
  below).
- `/admin/orders` — oversight across all orders (Phase 3) with global
  search and a status-override capability — clearly labeled as a
  support-intervention tool that bypasses the normal flow.
- `/admin/finance` — platform-wide read-only aggregation: total commissions
  collected (sum of `debit_commission` ledger entries), total escrow
  currently held (sum of unresolved `debit_escrow_hold` entries from Phase
  5), total pending withdrawal amount, total store-subscription revenue.
- `/admin/stores` — oversight of all seller white-label stores: list,
  subscription status, suspend/reinstate action.
- `/admin/audit-log` — a unified, filterable (by actor/action-type/date)
  read-only view aggregating history already tracked across modules:
  product review decisions (Phase 2), account approvals (Phase 1),
  withdrawal approvals (Phase 4), message moderation (Phase 5), and a
  scan-event summary (Phase 6) — don't duplicate storage, just read and
  merge from the existing lib modules into one timeline view.
- `/admin/roles` — the master reference list of every permission flag from
  PLATFORM_SPEC.md §9 (`PRODUCTS_REVIEW`, `ACCOUNTS_ACTIVATION`,
  `CHAT_MODERATION`, etc.) with descriptions, editable by the admin (can
  add new named permission flags for future extensibility) — this becomes
  the single source of truth list that the Manager's existing per-agent
  permission editor (`/manager/agents/:id/permissions`, from Phase 1)
  reads its checkbox options from.

## Explicitly deferred (do not build in this phase)

- `/admin/settings/notifications`, `/admin/settings/content`,
  `/admin/settings/tickets`, and the whole ticket system — Phase 10.
- `/admin/disputes` and any dispute resolution — Phase 8.
- Real custom-domain provisioning/DNS/hosting for storefronts, real
  payment-gateway or courier-API integration, real webhook delivery.

## Consistency requirements

- The public storefront still uses the same underlying design-token system
  (colors/spacing/typography scale) as the rest of the app, just skinned
  per-seller and without the dashboard shell — don't fork a second design
  system.
- All admin tables/forms reuse the existing Table/Badge/Modal/EmptyState/
  Skeleton components and Zod + react-hook-form pattern.
- All new authenticated routes sit inside the existing role-aware shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en; the public storefront is translated into
  all three locales too.

## Deliverables checklist for this prompt

- [ ] lib/store.ts + Order.source/store_id extension.
- [ ] Seller: store setup, dashboard, products (publish + custom
      price/description + fee counter), settings, billing (with the
      past_due→suspended→cancelled lifecycle), API key management.
- [ ] Public storefront at `/store/[slug]/...`: home, products, product
      detail, checkout (creates a real Phase-3-pipeline order), order
      confirmation, guest track-order, and the suspended/cancelled
      "unavailable" state.
- [ ] lib/agencies.ts promoted to a real CRUD-able module.
- [ ] Admin: dashboard, users list/detail, agencies CRUD, managers CRUD,
      commission/fee settings, courier settings (now driving Phase 6's
      handover-scan courier list), product oversight, order oversight,
      platform-wide finance, stores oversight, unified audit log, roles
      reference matrix.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-6.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 8 — Disputes & post-delivery returns**, which finally wires up the "Open Dispute" placeholders left in Phases 3 and 5. Ask for "next prompt" again when you're ready for it.
