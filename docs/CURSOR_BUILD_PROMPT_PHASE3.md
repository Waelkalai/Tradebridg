# Cursor Build Prompt — Phase 3: Orders & the Confirmation-Call Flow

> Run this **after** Phase 2 (`docs/CURSOR_BUILD_PROMPT_PHASE2.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1 (foundation, design
system, auth) and Phase 2 (products, depots, agent product review) work
that already exists in this project. Re-read these two docs before writing
any code — they are still the single source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 6 "إنشاء الطلبات" for order creation and the single-depot rule,
  Section 15 "تأكيد الطلب هاتفيا" for the confirmation-call flow, Section 16
  "رصيد ضمان الرتور" for the retour-balance gate on order creation, and
  Section 19 "دورة حياة الطلب الكاملة" for the full order status flow —
  including the mermaid diagram — are what this phase implements)
- docs/FRONTEND_SITEMAP.md   (Section C rows 30-32, Section E rows 67-68 are
  what you're building now; row 32's "Open Dispute" action and rows 32a/32b
  are OUT of scope for this phase — see "Explicitly deferred" below)

Do not rebuild or restyle anything from Phase 1/2 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), and the lib/products.ts + lib/depots data from Phase 2.
Every new page must look and feel like it was built by the same team in the
same sitting — same blue palette, same spacing, same component patterns,
full RTL support, correct in dark mode, fully responsive, every string
translated into all three locales.

## Scope of THIS prompt (Phase 3 only)

### 1. Mock orders data layer + a minimal wallet stub

Build lib/orders.ts as the in-memory/localStorage-backed data layer for
orders, behind a clean interface (same "mock now, real FastAPI endpoint
later" pattern as products — see Phase 9 in docs/CURSOR_BUILD_PROMPT.md).
Each order record needs:

- id, seller_id, list of items: { product_id, quantity, sale_price } (sale
  price is set by the seller per PLATFORM_SPEC.md §6 — it determines their
  profit = sale price − supplier price − commissions)
- resolved depot_id for the whole order (see the single-depot rule below)
- customer: full name, phone, optional secondary phone, full address,
  governorate, delegation — seed a real list of Tunisia's 24 governorates
  (with a few delegations each) for the selects
- confirmation_method: "self" | "agent_call" (from the checkbox at
  creation — self-confirm still gets flagged in the record as
  "confirmed_by: seller" for the legal-responsibility note in the spec)
- status: created | pending_confirmation | unreachable | confirmed |
  preparing | stock_shortage | ready_for_pickup | handed_to_courier |
  in_transit | delivered | returned | rescheduled | cancelled (mirror
  PLATFORM_SPEC.md §19 exactly, including the exception states, even though
  the transitions between preparing → ready_for_pickup → handed_to_courier
  are just mocked status changes here — real warehouse scanning that
  actually drives those transitions is Phase 6)
- status_history: [{ status, timestamp, note? }] — used to render the
  timeline
- call_log: [{ outcome: confirmed | no_answer | customer_changed |
  customer_rejected, timestamp, notes, agent_id }] for orders confirmed by
  an agent call
- mock courier_tracking_number, generated only once status reaches
  handed_to_courier
- created_at / updated_at

Also add a very small lib/wallet.ts STUB (not the real wallet UI — that's
Phase 4) that exposes just enough to gate order creation per
PLATFORM_SPEC.md §16: a per-seller mock `{ available_balance,
retour_reserved_balance }`, a `canReserveRetour(sellerId)` check (is
available_balance >= 5dt), and `reserveRetour(sellerId, orderId)` /
`releaseRetour(sellerId, orderId)` mutators that move 5dt between
available/reserved when an order is created and when it's delivered/
cancelled-before-shipping. Seed 2-3 mock sellers with different balances (one
comfortably funded, one with exactly enough for ~1 more order, one at zero)
so the gating behavior is actually visible in the demo. Mark this file
clearly as a stub that Phase 4 will replace with the real wallet module.

### 2. Seller pages (role S)

- `/seller/orders/new` — the order builder:
  - Product picker (search/select from Phase 2's accepted products) with
    quantity per line item.
  - Enforce the single-depot rule from PLATFORM_SPEC.md §6: once the first
    product is added, only allow adding further products available in the
    SAME depot; if a product exists in multiple depots for the same
    supplier, auto-suggest the depot nearest the customer's governorate
    (a simple static governorate→depot proximity lookup table is fine —
    no real geo distance calculation needed) but let the seller override
    the choice explicitly. Show a clear inline message when a product the
    seller tries to add isn't available in the currently selected depot,
    with a one-click "start a new, separate order for this product
    instead" shortcut.
  - Customer form: name, phone, optional secondary phone, address,
    governorate (select) → delegation (dependent select).
  - Per-line sale-price input with a live "estimated profit" preview
    (sale price − mock supplier price; note in the UI that platform
    commissions will be deducted too, exact commission math lands with the
    wallet module in Phase 4 — this is an illustrative estimate only).
  - "I confirmed this order myself by calling the customer" checkbox
    (confirmation_method = self) — otherwise it defaults to "agent_call"
    and the order needs to go through the agent confirmation queue.
  - Before allowing submit, check `canReserveRetour(sellerId)` from the
    wallet stub; if the seller can't cover another 5dt retour reservation,
    block submission with a clear, friendly message linking to a
    "top up your retour balance" coming-soon placeholder (the real
    retour-balance page is Phase 4).
  - On submit: create the order (status = confirmed if self-confirm, else
    pending_confirmation), reserve 5dt via the wallet stub, show a success
    toast, redirect to the order detail page.
- `/seller/orders` — table of this seller's orders with status filter chips
  covering every status above, search by customer name/phone, sortable by
  date, empty state when no orders yet.
- `/seller/orders/:id` — order detail:
  - A visual status stepper/timeline component (build it as a shared,
    reusable component — you'll reuse it on the agent side too) that
    renders status_history and clearly branches for exception states
    (unreachable, stock_shortage, rescheduled, returned, cancelled) instead
    of pretending the flow is always linear.
  - Customer info, line items with product thumbnail/name/qty/sale price,
    a badge showing "Confirmed by you" vs "Confirmed by agent call",
    the mock courier tracking number once available.
  - "Edit" action, enabled only while status is created/pending_confirmation
    (per the spec's edit/cancel rules) — reuses the same order-builder form
    pre-filled.
  - "Cancel" action with messaging that differs by stage: free cancellation
    before handed_to_courier (releases the reserved 5dt back via the wallet
    stub), vs. a warning that cancelling after handed_to_courier is treated
    as a retour (keeps the 5dt reserved/consumed) — per PLATFORM_SPEC.md §6.
  - An "Open Dispute" button that is visually present (per the sitemap) but
    routes to the existing Phase 1 "coming soon" placeholder for now —
    do NOT build the dispute flow itself in this phase.

### 3. Agent pages (role A)

- `/agent/orders/to-confirm` — queue of orders with status =
  pending_confirmation only (self-confirmed orders never appear here),
  sorted oldest-first by default, with an age indicator (highlight orders
  waiting unusually long).
- `/agent/orders/:id/confirm` — the call screen:
  - Customer info, product/qty/sale-price recap, and a short suggested
    "call script" text block (per PLATFORM_SPEC.md §15) the agent can read
    from.
  - Outcome buttons: "Confirmed" (→ status becomes confirmed), "No Answer"
    (→ status becomes unreachable, increments a retry counter — after 3
    logged attempts show a "mark as permanently unreachable" option that
    cancels the order and releases the retour reservation), "Customer Wants
    Changes" (→ inline-editable qty/address/etc. fields, saving updates the
    order and still requires re-confirming), "Customer Rejects" (→ cancels
    the order immediately with no retour fee, since it never shipped).
  - A notes textarea logged into call_log regardless of outcome.
  - Submitting shows a success toast and returns to the queue.
- Reuse the same status-timeline component from the seller order detail
  page on the agent side wherever it's useful (e.g. a compact version in
  the confirm screen showing where this order already is in its lifecycle).

## Explicitly deferred (do not build in this phase)

- The full dispute/return flow (sitemap rows 32a/32b, 74a/74b, 101d) — the
  "Open Dispute" button just links to the existing placeholder.
- The real wallet dashboard, withdrawal flow, and retour-balance page —
  Phase 4. Only the minimal lib/wallet.ts stub described above exists now.
- Real warehouse scanning driving preparing/ready_for_pickup/
  handed_to_courier transitions — Phase 6. For now these are just status
  values an agent or a small dev-only "advance status" control on the order
  detail page can set manually, clearly marked as a temporary stand-in.
- Real commission math — the "estimated profit" preview is illustrative
  only, per the note above.

## Consistency requirements

- Every status badge/chip reuses the existing Badge/StatusPill component
  and an extended-but-consistent color mapping (pick sensible, distinct
  colors per status family: neutral/blue for in-progress states, amber for
  attention-needed states like unreachable/stock_shortage/rescheduled,
  green for delivered, red for cancelled/returned) — document the mapping
  once in a shared constants file so Phase 4+ reuses it too.
- All new forms use the same Zod + react-hook-form pattern as previous
  phases; the dependent governorate→delegation select should validate that
  a delegation belongs to the chosen governorate.
- All new routes sit inside the existing role-aware authenticated shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components.

## Deliverables checklist for this prompt

- [ ] lib/orders.ts mock data layer with the full status model and
      status_history/call_log structures.
- [ ] lib/wallet.ts stub with per-seller available/reserved balances and
      the retour-reservation gating functions, seeded with 2-3 sellers at
      different balance levels.
- [ ] Seller: create order (single-depot enforcement + nearest-depot
      suggestion, customer form with governorate/delegation, profit
      preview, self-confirm checkbox, retour-balance gate), orders list
      with full status filters, order detail with the timeline component,
      edit (while allowed) and cancel (stage-aware messaging) actions.
- [ ] Agent: orders-to-confirm queue, confirmation call screen with all 4
      outcomes correctly transitioning status and logging to call_log.
- [ ] A shared, reusable order-status timeline/stepper component used on
      both the seller and agent sides.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-2.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 4 — Wallet, retour balance & withdrawals**, which promotes the `lib/wallet.ts` stub from this phase into the real wallet dashboard, withdrawal flow (bank/cash with OTP), and retour-balance page described in `docs/CURSOR_BUILD_PROMPT.md`'s follow-up list. Ask for "next prompt" again when you're ready for it.
