# Cursor Build Prompt — Phase 2: Product Catalog & Agent Review

> Run this **after** Phase 1 (`docs/CURSOR_BUILD_PROMPT.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1 foundation (design
system, UI kit, auth flow, role-aware dashboard shell) that already exists
in this project. Re-read these two docs before writing code — they are
still the single source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 4 "دورة حياة المنتج" is the most relevant one for this phase)
- docs/FRONTEND_SITEMAP.md   (Section C rows 26-29, Section D rows 47-53,
  Section E rows 63-64 are what you're building now)

Do not rebuild or restyle anything from Phase 1 — reuse the existing UI kit
(Button, Card, Badge/StatusPill, Table, Modal, Input, Select, EmptyState,
Skeleton, etc.), color tokens, layout shell, and i18n setup exactly as they
are. Every new page must look and feel like it was built by the same team
in the same sitting as Phase 1 — same blue palette, same spacing, same
component patterns, full RTL support, fully responsive.

## Scope of THIS prompt (Phase 2 only)

### 1. Shared mock data layer for products

Build lib/products.ts (or a small products/ module) as the in-memory /
localStorage-backed data layer for products, behind a clean interface, the
same pattern as the Phase 1 mock auth layer — so it's trivial to swap for a
real API later. Seed it with ~15-20 realistic mock products across a few
categories (electronics accessories, home goods, beauty, kids' toys —
whatever reads well in Arabic/French) so every list/grid view has enough
data to look convincing, including a mix of statuses (pending, accepted
locally, accepted whole-stores, rejected).

Each product record must carry every field described in
docs/PLATFORM_SPEC.md Section 4-A:
- name, full description, category + subcategory, search tags
- multiple images + exactly one selected "main picture"
- one or more videos (a video URL/embed is fine for mock data)
- optional variants (color/size), each with its own stock + price if it
  differs
- retail price (Prix Détail)
- one or more wholesale price tiers, each with its own MOQ and price
  (e.g. 10-49 units, 50-99 units, 100+ units)
- weight (kg) and dimensions (L×W×H)
- total declared quantity + which depot(s) it's assigned to
- an internal product code/SKU (generated, not user-entered)
- status: draft / pending_review / accepted_local / accepted_global /
  rejected, plus a rejection reason string when rejected

### 2. Supplier pages (role P)

- `/supplier/products` — table/grid of this supplier's own products with a
  status badge per row (color-coded: pending=amber, accepted local=blue,
  accepted whole-stores=green, rejected=red), search + filter by status/category,
  "Add Product" button.
- `/supplier/products/new` — the full add-product form, organized into clear
  sections (Basic Info, Media, Pricing — Retail, Pricing — Wholesale Tiers,
  Variants, Shipping, Stock & Depot). Wholesale tiers should be a dynamic
  repeatable row group (add/remove tier, each with MOQ + price, live-validated
  so tiers can't overlap/decrease illogically). Main picture selection should
  be a visual click-to-select over the uploaded image thumbnails, not a
  dropdown. Multi-image upload with drag-and-drop + reorder. On submit, the
  product is created with status pending_review.
- `/supplier/products/:id/edit` — same form pre-filled; note in the UI that
  saving certain fields (price, images, description) will re-trigger review
  (per the spec) while minor text fixes won't — you can simulate this with a
  simple "changed fields" diff check against the mock data.
- `/supplier/products/:id/status` — read-only decision view: current status,
  the agent's reason if rejected, a timeline of status changes, and a
  "Resubmit" button when rejected that routes back to edit.
- `/supplier/depots` (list), `/supplier/depots/new` (add), `/supplier/depots/:id`
  (detail: which products + quantities are physically there) — simple CRUD UI
  against the same mock layer, address + name + linked agency (pick from a
  short mock list of Tunisian agencies/governorates).
- `/supplier/stock` — a comparison view: "virtual total declared" vs "sum of
  physical stock across depots/agencies" per product, with a visible warning
  badge when they mismatch, per spec Section 12.

### 3. Agent pages (role A)

- `/agent/products/pending` — queue of products awaiting a decision, sorted
  by submission date by default, with quick filters (supplier, category).
  Each row should feel scannable: thumbnail, name, price range, submitted
  date, supplier ID (never a real name — respect the identity-hiding rule
  from the spec).
- `/agent/products/:id` — the full review screen: image gallery + video
  player, all pricing tiers rendered as a clean table, variants, weight/dims,
  depot/stock info, then a decision panel with exactly 3 actions matching
  the spec: "Accept — this agency only", "Accept — whole stores", "Reject"
  (reject requires a reason, offer a few common preset reasons plus a free-
  text field). Submitting updates the mock product status and should show a
  success toast, then return to the queue.

### 4. Seller pages (role S)

- `/seller/products` — the marketplace catalog grid: filters for price range,
  category, agency/depot availability, in-stock only; sort by newest/best-
  selling (mock a "orders last 30 days" number to sort by); each card shows
  the main picture, name, retail price, "from X units: Y dt" wholesale
  teaser, and a small "N suppliers offer similar products" badge per spec
  Section 5. Only show products with status accepted_local (if the seller's
  agency matches) or accepted_global.
- `/seller/products/:id` — full detail page: image gallery with the main
  picture first, video player, retail price, a clean wholesale tiers table,
  variant selector if applicable, stock availability per depot/agency (no
  supplier identity — show "Supplier #P-XXXX" only), a "Create Order" button
  and a "Request Wholesale" button (both can link to a route that doesn't
  exist yet — wire them to `/seller/orders/new?product=:id` and
  `/seller/wholesale/new?product=:id` respectively; those pages are Phase 3+,
  so for now it's fine if navigating there shows the existing "coming soon"
  placeholder from Phase 1 — don't build those flows yet), and a
  "Message Supplier" button that opens the existing messages shell from
  Phase 1 (or a coming-soon state if that shell doesn't exist yet).
- `/seller/products/favorites` — wishlist grid, add/remove-from-favorites
  toggle on both this page and the product cards on `/seller/products`.
- `/seller/deals` — products with a mock "active deal" flag: show countdown
  timer to deal end, strikethrough original price next to the discounted
  price.
- `/seller/suppliers` — anonymized supplier directory: card per supplier
  showing only their ID (e.g. P4021), product count, primary category, and
  a mock rating — never a name/company/contact info.

## Consistency requirements

- Every status badge (product status, mismatch warnings, etc.) must reuse
  the Badge/StatusPill component and color conventions established in
  Phase 1 — don't introduce new ad hoc colors outside the existing palette.
- All new forms use the same Zod + react-hook-form pattern as the auth forms
  from Phase 1.
- All new routes must sit inside the existing role-aware authenticated shell
  (correct sidebar highlighting the active item) and respect RTL.
- Loading states use the existing Skeleton components; empty states (e.g. no
  products yet) use the existing EmptyState component with a relevant call
  to action.

## Deliverables checklist for this prompt

- [ ] lib/products.ts mock data layer with realistic seed data covering every
      field from the spec and a mix of statuses.
- [ ] Supplier: products list, add product (full multi-section form with
      dynamic wholesale tiers), edit product, product status page, depots
      list/add/detail, stock overview with mismatch warnings.
- [ ] Agent: product review queue, product review detail with the exact
      3-way decision + reason.
- [ ] Seller: browse products (filters + supplier-count badge), product
      detail (tiers table, variant selector, masked supplier ID), favorites/
      wishlist, deals with countdown, anonymized suppliers directory.
- [ ] Everything responsive, RTL-correct, and visually consistent with Phase 1.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```
