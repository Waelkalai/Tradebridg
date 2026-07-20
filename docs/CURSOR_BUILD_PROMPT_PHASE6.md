# Cursor Build Prompt — Phase 6: Warehouse Scanning

> Run this **after** Phase 5 (`docs/CURSOR_BUILD_PROMPT_PHASE5.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1-5 work that already
exists in this project (foundation/auth, products/depots, orders +
confirmation calls, wallet/ledger, moderated chat + wholesale/escrow).
Re-read these two docs before writing any code — they are still the single
source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 11 "نظام المسح بالباركود/QR داخل الوكالة" is what this phase
  implements in full — including the code-prefix scheme, the 3 scan stages,
  the exception flows table, and the full tracking summary table — plus
  Section 27 "التوصيات التقنية لأدوات المسح والطباعة" for the hardware/UX
  approach)
- docs/FRONTEND_SITEMAP.md   (Section E rows 69-72, Section F row 84 are
  what you're building now)

Do not rebuild or restyle anything from Phase 1-5 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), lib/orders.ts (Phase 3), lib/wallet.ts (Phase 4), and
lib/wholesale.ts (Phase 5). Every new page must look and feel like it was
built by the same team in the same sitting — same blue palette, same
spacing, same component patterns, full RTL support, correct in dark mode,
fully responsive, every string translated into all three locales.

## Scope of THIS prompt (Phase 6 only)

### 1. Scanning data layer — lib/scanning.ts

Mock/localStorage-backed (real backend is Phase 9), modeling
PLATFORM_SPEC.md §11's code scheme and events exactly:

- Code prefixes: `PRD-` (product unit/carton — generate as SKU + a unique
  serial), `BOX-` (parcel — format `BOX-YYYYMMDD-<agency-code>-<seq>`),
  `AGY-` (fixed per agency, e.g. `AGY-TUN-A03`). Each mock product from
  Phase 2 needs a `codingPolicy` field (`unit` | `carton` — small/cheap
  items get coded per carton, larger/pricier items per unit); seed this
  across the Phase 2 mock catalog if it isn't already there.
- `ScanEvent`: product_code, box_code (optional), batch_id, quantity,
  agency_id, agent_id, warehouse_zone, a mock gps_location (fixed
  lat/long per agency is fine), device_id (mock scanner id), timestamp,
  action_type — support exactly these: `stock_in`, `boxed`,
  `handed_to_courier`, `returned_to_agency`, `transfer_out`, `transfer_in`,
  `damaged`.
- `Box`: box_code, order_id (or wholesale_request_id when boxing a
  wholesale-receiving batch isn't applicable — boxes are only for outbound
  customer orders, wholesale receiving uses stock_in events directly, no
  box), product_codes[], agency_id, agent_id, status, created_at.
- `Incident`: product_code, last_scan_event_id (denormalized snapshot of
  who/where/when it was last seen), description, reported_by, status
  (`open` | `escalated` | `resolved`), created_at.
- A `generateProductCodes(productId, quantity)` helper that mints new
  `PRD-` codes (used when the stock-in screen finds unc coded stock) and a
  `printableLabelSheet(codes)` helper that renders a simple, print-ready
  label sheet (QR/barcode-looking placeholder graphics are fine — no real
  barcode rendering library is required, a monospace text representation
  of the code plus a stylized QR-like SVG placeholder reads well enough
  for this phase) opened via `window.print()`. Note clearly in comments
  that real physical label-printer integration is out of scope (no
  hardware exists in this dev environment) — the deliverable is a correct,
  print-ready HTML view.

### 2. A universal `ScanInput` component (build once, reuse everywhere)

This is the realistic core of "how scanning actually works" — implement
BOTH input modes properly:

- **Hardware scanner mode**: an auto-focused, invisible-caret-friendly text
  input that captures the rapid keystroke burst + trailing Enter that
  handheld USB/Bluetooth barcode scanners emit (they behave exactly like a
  very fast keyboard typing the code then pressing Enter) — parse on
  Enter, clear the field immediately so the next scan can happen without
  any manual re-focus or clicking.
- **Camera fallback mode**: a "Scan with Camera" button that opens a modal
  using the browser's `BarcodeDetector` Web API when available, falling
  back to a small open-source JS library (e.g. `@zxing/browser` or
  `html5-qrcode`) otherwise, for agents on a tablet without a dedicated
  scanner.
- On a valid, expected scan: a short synthesized success beep (use the Web
  Audio API to generate a simple tone — no audio asset files needed) +
  green flash/checkmark + increment a running "scanned N / expected M"
  counter.
- On an invalid/duplicate/wrong-context scan (e.g. a product not on the
  current order's pick list, or a code already scanned in this session): a
  distinct error tone + red flash + a clear inline message explaining why.
- This component must be usable both by literally typing a code (for
  developer/demo testing without real hardware) and by the two real modes
  above.

### 3. Stock-In Scan — `/agent/warehouse/scan-in`

- Agent first picks the RECEIVING CONTEXT: either "Wholesale shipment"
  (lists WholesaleRequest records from Phase 5 currently in
  `shipped_to_agency` status, showing expected product + quantity) or
  "General restock" (a simpler declared-quantity restock against a
  product+depot, for supply outside the wholesale flow).
- Scan loop using ScanInput; if a scanned product has no code yet, offer
  "Generate & Print Stickers" for the declared quantity (mints codes via
  step 1's helper, opens the printable sheet).
- Track scanned vs. expected quantity live. On "Finish Receiving":
  - Exact match → for wholesale context, call the SAME settlement logic
    Phase 5 built for `received_full_match` (replace Phase 5's dev-only
    "Simulate agency receiving" button entirely now that real scanning
    drives this — remove that dev control) — for general restock, just
    update the agency's physical stock.
  - Under-count → wholesale context calls `received_partial_mismatch`
    (proportional escrow split, from Phase 5); general-restock context
    just records the shortfall and notifies the supplier.
  - Agent can also explicitly mark "Reject shipment" → wholesale context
    calls `received_rejected`.
  - Any unit flagged damaged during counting gets its own `damaged`
    ScanEvent and is excluded from usable stock (separate "damaged stock"
    count, visible on the Agency Stock View in step 7).
- Every successful scan updates the agency's live stock immediately.

### 4. Boxing Scan — `/agent/warehouse/box`

- Agent picks an order currently in `preparing` status (from Phase 3).
  Show its pick list (product + qty per line).
- Scan loop: each scan must match a pick-list line still needing quantity;
  wrong-product scans trigger the ScanInput's error state immediately.
  If the agent can't physically find enough stock for a line despite the
  system showing it available, a "Report Stock Shortage" action sets the
  order to `stock_shortage` (per PLATFORM_SPEC.md §11 point 6) and
  notifies the seller with the wait/edit/cancel-without-fee choice from the
  spec (reuse whatever notification pattern already exists — an in-app
  toast/badge is enough for now).
- Once every line is fully scanned, "Complete Box" generates a new
  `BOX-...` code, prints a shipping-label preview (destination customer
  name/address only — NEVER supplier or seller identity, per the
  platform's core anonymity rule), and logs the confirming `boxed`
  ScanEvent. This automatically advances the order's status from
  `preparing` to `ready_for_pickup` — remove the Phase 3 dev-only
  "advance status" control for THIS specific transition now that real
  scanning drives it (keep it for any later statuses this phase doesn't
  cover).

### 5. Handover Scan — `/agent/warehouse/handover`

- Scan a `BOX-...` code, select a courier company from a small mock list
  (Aramex, First Delivery, etc. — a static list is fine here; making this
  admin-configurable is Phase 7's job), log the courier driver's
  name/id, confirm.
- Generates a mock external tracking number, logs the `handed_to_courier`
  ScanEvent (courier name, driver, timestamp, agency), and automatically
  advances the order status to `handed_to_courier` then immediately
  `in_transit` per PLATFORM_SPEC.md §19 — remove the Phase 3 dev-only
  control for these two transitions as well.

### 6. Returns Scan — `/agent/warehouse/scan-return`

- Scan an incoming box/product code (from an order that reached `returned`
  status in Phase 3, or a standalone return). For each item, the agent
  marks condition: `resellable` (logs `returned_to_agency` then an
  effective `stock_in`, restoring it to usable agency stock under its
  original product code) or `damaged` (quarantined, excluded from usable
  stock, same as step 3's damaged handling).

### 7. Stock Transfer — `/agent/warehouse/transfer`

Two tabs on one page:
- **Send** — scan product code(s) + quantity, pick a destination agency
  (mock agencies list), confirm → logs `transfer_out`, decrements THIS
  agency's stock, creates a "pending transfer" record.
- **Receive** — lists pending transfers addressed to this agent's agency;
  the destination agent scans the transfer's codes to confirm → logs
  `transfer_in`, increments THIS agency's stock, marks the transfer
  complete. (Since a dev environment usually has one logged-in agent at a
  time, make sure the existing Phase 1 dev role/agency switcher lets a
  tester act as the destination agent to complete the loop end-to-end.)

### 8. Incident Report — `/agent/warehouse/incidents`

- Form: search/select a product code (auto-fills its last known
  ScanEvent — type, zone, timestamp, agent — from lib/scanning.ts),
  description textarea, submit creates an `open` Incident (auto-visible to
  the manager, i.e. shows up in step 9's manager view too). List of past
  incidents with a status filter.

### 9. Agency Stock View (Agent) & Full Warehouse View (Manager)

- `/agent/warehouse/stock` — live table: product, code, quantity
  available, damaged-quantity, zone/shelf (a simple mock "shelf label"
  field), last-scanned date, searchable/filterable by product/category/
  code.
- `/manager/warehouse` — the same live stock table PLUS a historical
  ScanEvent log viewer (filterable by date range, action_type, agent,
  product) and a "pending transfers in/out" summary section covering all
  agents at this manager's agency.

## Explicitly deferred (do not build in this phase)

- Real physical scanner/printer driver integration and real courier API
  credentials/configuration — Phase 7 makes the courier list
  admin-configurable; this phase's mock list is a fixed placeholder.
- Real dispute resolution triggered by damaged/mismatched/shortage
  incidents — Phase 8.
- Real device geolocation capture for `gps_location` — a fixed mock
  location per agency is enough for now.

## Consistency requirements

- The `ScanInput` component and its beep/flash feedback must be visually
  and behaviorally IDENTICAL across all 5 scan screens — build it once,
  compose everywhere.
- Reuse the existing Badge/StatusPill palette for scan/incident/transfer
  statuses (extend, don't fork).
- All new routes sit inside the existing role-aware authenticated shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components.

## Deliverables checklist for this prompt

- [ ] lib/scanning.ts with the full code scheme, ScanEvent/Box/Incident
      models, code-generation and printable-label helpers.
- [ ] Shared `ScanInput` component supporting hardware-scanner (keyboard
      emulation) input, a camera-based fallback, and synthesized
      success/error audio + visual feedback.
- [ ] Stock-In scan (wholesale + general restock contexts, code
      generation/printing, mismatch handling wired to Phase 5's escrow
      settlement, damaged-item tagging).
- [ ] Boxing scan (pick-list-validated scanning, box-code generation +
      label print preview, stock-shortage escalation) — replaces the
      Phase 3 dev control for preparing → ready_for_pickup.
- [ ] Handover scan (courier selection, driver log, mock tracking number)
      — replaces the Phase 3 dev control for ready_for_pickup →
      handed_to_courier → in_transit.
- [ ] Returns scan (resellable vs. damaged sorting, auto-restock).
- [ ] Stock transfer (send/receive tabs, cross-agency loop testable via
      the existing dev role/agency switcher).
- [ ] Incident report form + list.
- [ ] Agent agency-stock view and manager full-warehouse view (with
      historical scan log + pending transfers summary).
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-5.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 7 — White-label store & admin settings**, which makes the courier list this phase hard-coded (Aramex/First Delivery) properly admin-configurable, among other things. Ask for "next prompt" again when you're ready for it.
