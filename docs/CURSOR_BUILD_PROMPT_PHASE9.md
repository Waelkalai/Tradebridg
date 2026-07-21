# Cursor Build Prompt — Phase 9: Backend Hardening

> Run this **after** Phase 8 (`docs/CURSOR_BUILD_PROMPT_PHASE8.md`) has been built and reviewed. Unlike every previous phase, Phase 9 is **not new UI** — it promotes every mock `lib/*.ts` data layer built across Phases 2-8 into real FastAPI + PostgreSQL modules, matching the auth backend's pattern from Phase 1, WITHOUT changing how the UI components consume that data (they should already talk to `lib/*.ts` through a clean interface — this phase swaps what's behind that interface from localStorage to real HTTP calls).
>
> Because this is ~10 modules of genuinely repetitive infrastructure work with real dependency ordering between them, it's split into **six sequential sub-prompts (9a-9f)** instead of one giant prompt. Run them **in order**, one at a time, each after the previous one is merged and reviewed. Every sub-prompt follows the exact same methodology described once below.

---

## Shared methodology for every sub-prompt (9a-9f)

Each sub-prompt below tells you which mock module(s) to harden. For each one:

1. **SQLAlchemy models** (`apps/api/app/models/`) mirroring the mock TypeScript interface field-for-field — don't redesign the shape, just give it a real, normalized relational form (proper foreign keys instead of loose string IDs, proper enums instead of TS union types).
2. **Alembic migration** committed and runnable against the Phase 1 Compose Postgres instance.
3. **Pydantic v2 schemas** (`apps/api/app/schemas/`) for every request/response shape the frontend needs.
4. **FastAPI router** (`apps/api/app/api/`) exposing every operation the mock lib currently performs. Critically: **move all business-rule and financial logic that currently lives client-side into the backend** (single-depot enforcement, retour-balance gating, commission math, escrow split math, RIB/OTP validation, regex risk-flagging, dispute refund clawback, etc.) — the server must re-validate everything and never trust client-computed amounts, exactly like a real production system would. Keep the equivalent client-side checks too, but only as instant-feedback UX, not as the source of truth.
5. **Swap the frontend's `lib/*.ts`** to call these endpoints via the Phase 1 typed API client (`lib/api-client.ts`), preserving the EXACT same exported function names/signatures/return shapes the mock version had, so UI components require zero changes.
6. **Seed script**: extend the Phase 1 dev seed script to create realistic demo data for this module server-side (reuse the same demo data you already designed for the mock version), so `npm run dev` + a fresh `docker compose up` + running the seed script reproduces a fully working demo.
7. **Tests**: add focused pytest tests for any money-related logic in this module (commission math, escrow splits, retour reserve/release, dispute clawback, withdrawal balance checks) — these are the highest-risk-of-bugs areas in the whole platform.
8. **Regression pass**: re-run the full user flow(s) this module supports end-to-end against the real API + Postgres (not the old mock) and fix anything that breaks.

Do not restyle or rebuild any UI in these sub-prompts — this is backend + data-layer work only.

---

## Sub-prompt 9a — Agencies, Depots & Couriers (foundational reference data)

```
Apply the Phase 9 methodology (see docs/CURSOR_BUILD_PROMPT_PHASE9.md) to
harden the foundational reference data that almost every other module
depends on:

- Agency (from lib/agencies.ts, Phase 7): id, name, address, governorate,
  manager_id (FK to the Phase 1 User table), working_hours, linked courier
  IDs, created_at.
- Depot (referenced since Phase 2): id, supplier_id (FK to User),
  agency_id (FK to Agency, nullable for a supplier's own non-agency
  warehouse), name, address, created_at.
- Courier (from lib/... in Phase 7's admin courier settings): id, name,
  active, mock api_credentials (JSON placeholder — clearly marked as not a
  real integration), created_at.

Endpoints: full CRUD for all three (Agency/Courier admin-only per
PLATFORM_SPEC.md §17; Depot scoped to the owning supplier), plus a
read-only list endpoint each frontend page across every phase can call
(supplier registration's agency picker, seller order creation's agency
selector, warehouse transfer's destination-agency picker, etc.).

Update every existing frontend reference to the old static mock
agencies/depots/couriers array (there are several, going back to Phase 1's
supplier registration form) to fetch from these new endpoints instead —
grep the codebase for the mock array and replace every usage; do not leave
any page still reading the old hardcoded list.

Seed realistic data: reuse the same Tunisian governorates/agencies list
already used as mock data since Phase 2, plus Aramex/First Delivery as the
seeded couriers from Phase 6/7.

Deliverables checklist:
- [ ] Agency/Depot/Courier models, migration, schemas, full CRUD routers.
- [ ] Every frontend consumer of the old mock lists now calls the real API.
- [ ] Seed script produces the same demo agencies/depots/couriers as before.
- [ ] `docker compose up` + migrate + seed + `npm run dev` reproduces a
      working demo with no console errors.
```

---

## Sub-prompt 9b — Product Catalog

```
Apply the Phase 9 methodology to harden lib/products.ts (Phase 2):
Product, ProductVariant, ProductPriceTier, ProductMedia, a ProductReview
history table (agent decisions: local/global/reject + reason, timestamped),
and Deal. Foreign-key Product to its supplier (User) and Depot (from 9a).

Endpoints: supplier CRUD for their own products (create/update/list/
detail — moving the "which field changes trigger re-review" diff logic
server-side), agent review endpoints (pending queue, decide with the exact
3-way decision + reason), seller/public browse endpoints (filtered to
accepted_local/accepted_global per the requesting seller's agency), deals
CRUD.

Swap lib/products.ts to call these endpoints, preserving its existing
interface. Seed the same ~15-20 mock products with mixed statuses used
since Phase 2, now created via the seed script against real Postgres.

Deliverables checklist:
- [ ] Product/Variant/PriceTier/Media/ProductReview/Deal models, migration,
      schemas, routers with the review-trigger and 3-way-decision logic
      enforced server-side.
- [ ] lib/products.ts fully backed by the real API, zero UI changes needed.
- [ ] Seed script reproduces the Phase 2 demo catalog.
- [ ] Full regression: supplier add/edit product, agent review, seller
      browse — all working end-to-end against Postgres.
```

---

## Sub-prompt 9c — Orders & Wallet/Ledger

```
Apply the Phase 9 methodology to harden lib/orders.ts (Phase 3) AND
lib/wallet.ts (Phase 4, extended in 5/8) together, since order settlement
and wallet movement are tightly coupled — do this as one sub-prompt so the
transactional boundaries (an order transitioning to `delivered` must
atomically release retour + credit sale + debit commission, all-or-nothing)
are modeled correctly with real DB transactions.

Models: Order, OrderItem, OrderStatusHistory, OrderCallLog; Wallet (three
balances: available/reserved/pending), WalletTransaction (all ledger types
from PLATFORM_SPEC.md §13 that are implemented so far), WithdrawalRequest.

Endpoints — and this is where the MOST business logic moves server-side:
- Order creation enforces the single-depot rule and nearest-depot
  suggestion (PLATFORM_SPEC.md §6) and the retour-balance gate
  (PLATFORM_SPEC.md §16) server-side — reject with a clear error if the
  client tries to violate either.
- Order status transitions are only valid along the state machine from
  PLATFORM_SPEC.md §19 — reject invalid transitions.
- `settleOrder`/`forfeitRetour` (Phase 4) becomes a real, atomic DB
  transaction triggered when an order's status changes to
  `delivered`/`returned`, using the real commission math from §10.
- Withdrawal creation validates amount/type limits server-side, reuses the
  real OTP flow from Phase 1 (don't let the frontend fake OTP success),
  and the manager approval/rejection/completion endpoints enforce that
  only a Manager role can call them.

Swap lib/orders.ts and lib/wallet.ts to the real API, preserving their
interfaces. Seed the same demo orders/wallet balances/transaction history
used since Phases 3-4.

Deliverables checklist:
- [ ] Order + Wallet + ledger models/migrations/schemas/routers with the
      state machine and all financial math enforced server-side and
      wrapped in real DB transactions where multiple balances change
      together.
- [ ] lib/orders.ts and lib/wallet.ts fully backed by the real API.
- [ ] pytest coverage for: commission calculation, retour reserve/release/
      forfeit, and the full withdrawal lifecycle (request → OTP → approve
      → complete, and reject → release).
- [ ] Full regression: create order → agent confirm call → advance through
      scanning-driven statuses (from Phase 6, now hitting real endpoints)
      → deliver → wallet reflects the correct settled amounts.
```

---

## Sub-prompt 9d — Moderated Messages & Wholesale/Escrow

```
Apply the Phase 9 methodology to harden lib/messages.ts and
lib/wholesale.ts (both Phase 5). Depends on 9c's Wallet module for escrow
settlement.

Models: Conversation, Message (with moderation status + preserved original
vs. delivered body), WholesaleRequest (the full granular status set from
Phase 5, with status_history).

Endpoints:
- Sending a message ALWAYS creates it as `pending_review` server-side —
  move the regex risk-flag detection (phone numbers/links/platform names)
  into the backend too, so it can't be bypassed by a modified frontend.
  Agent moderation endpoints (approve/redact & approve/reject) are the only
  way a message's status changes.
- Wholesale request creation validates the MOQ-tier logic against the real
  Product data (from 9b) server-side. Accept/reject by the supplier,
  escrow payment (reusing OTP from Phase 1, real wallet debit from 9c),
  and the receiving-outcome endpoints (full match/partial mismatch/
  rejection) that Phase 6's scanning screens call — implement the same
  proportional escrow-split math from Phase 5/6 as a real, atomic
  transaction.

Swap lib/messages.ts and lib/wholesale.ts to the real API. Seed the same
demo conversations/wholesale requests used since Phase 5.

Deliverables checklist:
- [ ] Conversation/Message/WholesaleRequest models, migrations, schemas,
      routers with server-side moderation gating and risk-flag detection.
- [ ] lib/messages.ts and lib/wholesale.ts fully backed by the real API.
- [ ] pytest coverage for the escrow full-match/partial-mismatch/rejection
      settlement math.
- [ ] Full regression: chat moderation queue, wholesale request → accept →
      escrow pay → (Phase 6's now-real scanning) receive → settlement.
```

---

## Sub-prompt 9e — Warehouse Scanning

```
Apply the Phase 9 methodology to harden lib/scanning.ts (Phase 6). Depends
on 9c (Orders) and 9d (Wholesale) since scan events drive their status
transitions.

Models: ScanEvent (all action_types from PLATFORM_SPEC.md §11), Box,
Incident, plus a maintained AgencyStock table (product × agency → quantity
available / damaged) kept in sync transactionally by ScanEvent creation
rather than recomputed from scratch each read.

Endpoints: one per scan screen (stock-in, boxing, handover, returns,
transfer-out/in, incident report) that creates the right ScanEvent(s),
updates AgencyStock, and — critically — drives the real Order/
WholesaleRequest status transitions that Phase 6's frontend previously
computed client-side (boxing → ready_for_pickup, handover →
handed_to_courier → in_transit, stock-in of a wholesale shipment →
received_full_match/partial_mismatch/rejected via 9d's endpoints).

Swap lib/scanning.ts to the real API, including the product-code and
box-code generation logic (move code minting server-side so codes are
guaranteed globally unique, not just unique within one browser's mock
store).

Deliverables checklist:
- [ ] ScanEvent/Box/Incident/AgencyStock models, migrations, schemas,
      routers, with server-side code generation.
- [ ] lib/scanning.ts fully backed by the real API.
- [ ] Full regression: every one of Phase 6's 5 scan screens works against
      real Postgres and correctly drives order/wholesale status changes.
```

---

## Sub-prompt 9f — White-Label Store & Disputes

```
Apply the Phase 9 methodology to harden lib/store.ts (Phase 7) and
lib/disputes.ts (Phase 8) together. Depends on 9b (Products), 9c (Orders/
Wallet), and 9d/9e for the scan-history evidence a dispute investigation
pulls from.

Models: StoreSubscription, a PublishedProduct join table (store × product
→ custom price/description), Dispute (both order- and wholesale-sourced,
per Phase 8).

Endpoints:
- Store CRUD, publish/unpublish products (validating accepted_global +
  the price-floor rule server-side), subscription lifecycle (active →
  past_due → suspended → cancelled) driven by a real billing-date check
  instead of the Phase 7 dev-only clock-simulation control.
- PUBLIC (unauthenticated) storefront endpoints: browse a store's
  published products, and checkout — which creates a real Order through
  9c's same order-creation service (tagged source=storefront), so it's
  impossible for a storefront checkout to bypass any of the validation
  9c already enforces.
- Dispute creation (gated on the related order being `delivered`, per
  Phase 8), agent decision endpoints implementing the exact wallet
  clawback logic from Phase 8 (`debit_dispute_refund`, with the
  responsibility-based supplier clawback) as a real atomic transaction.

Swap lib/store.ts and lib/disputes.ts to the real API.

Deliverables checklist:
- [ ] StoreSubscription/PublishedProduct/Dispute models, migrations,
      schemas, routers.
- [ ] lib/store.ts and lib/disputes.ts fully backed by the real API.
- [ ] Public storefront checkout goes through the exact same
      order-creation validation as internal seller-created orders.
- [ ] pytest coverage for the dispute refund/clawback math.
- [ ] Full regression across the whole platform: by the end of this
      sub-prompt, EVERY lib/*.ts module in the frontend is backed by real
      FastAPI + PostgreSQL, and the "mock now, real API later" comment left
      in every earlier phase's code can finally be deleted.
```

---

## What's next

After all six sub-prompts are merged and reviewed, the platform has no remaining mock data layers. Move on to **Phase 10 — Tickets & notification center**, the last item in the master plan in `docs/CURSOR_BUILD_PROMPT.md`. Ask for "next prompt" again when you're ready for it (or to continue with the next 9x sub-prompt).
