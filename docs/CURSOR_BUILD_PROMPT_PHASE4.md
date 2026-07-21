# Cursor Build Prompt — Phase 4: Wallet, Retour Balance & Withdrawals

> Run this **after** Phase 3 (`docs/CURSOR_BUILD_PROMPT_PHASE3.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1-3 work that already
exists in this project (foundation/auth, products/depots, orders +
confirmation-call flow + the lib/wallet.ts retour-gating STUB from Phase 3).
Re-read these two docs before writing any code — they are still the single
source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 13 "المحفظة الرقمية والسحب المالي" is the wallet/ledger/withdrawal
  model this phase implements in full, and Section 16 "رصيد ضمان الرتور" is
  the retour-balance rule you already partially stubbed in Phase 3)
- docs/FRONTEND_SITEMAP.md   (Section C rows 36-38, Section D rows 57-58,
  Section F rows 80-83 are what you're building now)

Do not rebuild or restyle anything from Phase 1-3 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), the OTP mechanism built for auth in Phase 1 (reuse it
exactly, don't build a second parallel OTP system), and the mock agencies
list already used for depots in Phase 2. Every new page must look and feel
like it was built by the same team in the same sitting — same blue palette,
same spacing, same component patterns, full RTL support, correct in dark
mode, fully responsive, every string translated into all three locales.

## Scope of THIS prompt (Phase 4 only)

### 1. Promote lib/wallet.ts from a gating stub to the real wallet module

Keep it a mock/localStorage-backed module for now (same "mock now, real
FastAPI endpoint later" pattern — real persistence is Phase 9), but expand
it into the full model from PLATFORM_SPEC.md §13:

- Each user's wallet has three balances: `available`, `reserved` (retour
  holds go here, as already wired in Phase 3), `pending` (profit from
  orders not yet delivered/confirmed — does not become available until
  delivery is confirmed).
- A full ledger of `WalletTransaction` entries, each with: type, amount,
  `related_order_id` (optional), `balance_after`, timestamp, created_by.
  Support exactly these types for now (the rest — `credit_escrow_*`,
  `debit_store_fee`, `debit_dispute_refund` — belong to Phases 5/7/8 and
  should just be documented as future enum values, not implemented yet):
  `credit_sale`, `debit_commission`, `debit_retour_reserve`,
  `credit_retour_release`, `debit_withdrawal`.
- Hook this into the Phase 3 order lifecycle: add a `settleOrder(orderId)`
  function that, when an order transitions to `delivered` (via whatever
  control currently drives that in Phase 3 — the dev-only "advance status"
  stand-in is fine), does ALL of: releases the 5dt retour reservation
  (`credit_retour_release`), credits the seller's `pending` balance with
  their profit for that order then moves it to `available`
  (`credit_sale`), and debits the platform commission
  (`debit_commission`) — use the worked example and commission logic from
  PLATFORM_SPEC.md §10 (3% from the seller's sale price). Similarly, when
  an order transitions to `returned` (post-shipping), the 5dt retour
  reservation is consumed permanently (no release) — implement this as
  `forfeitRetour(orderId)`.
- Seed realistic historical transactions for each mock seller/supplier
  (tie some to the mock orders from Phase 3, going back a few weeks) so
  the wallet transaction history actually looks like a real, lived-in
  account, not an empty table.

### 2. Withdrawal request flow — shared between Seller (S) and Supplier (P)

Build one shared withdrawal flow (component/route logic) used by both
`/seller/wallet/withdraw` and `/supplier/wallet/withdraw`, since the rules
are identical per the spec:

- Step 1 — type + amount: toggle between "Bank Transfer" (min 20dt, max
  10,000dt — form fields: RIB/IBAN using the real Tunisian RIB format of
  exactly 20 digits, bank name, account holder name which must match the
  user's registered KYC name) and "Cash Pickup" (min 200dt, max 10,000dt —
  select a pickup agency from the existing mock agencies list). Validate
  the amount range live and against the wallet's `available` balance
  (never reserved/pending).
- Step 2 — lightweight manual fraud-check indicators shown to the user is
  NOT needed (those are for the manager's review in step 4) — just proceed
  to OTP once the form is valid.
- Step 3 — OTP: reuse the exact OTP component/flow from Phase 1 (6-digit
  code, ~5 minute expiry, 3 attempt limit, dev-mode logs/returns the code
  the same way auth OTP does).
- On OTP success: create a `WithdrawalRequest` (type, amount, bank details
  or pickup agency, status = `pending_manager_approval`), immediately move
  the amount from `available` to `reserved` in the wallet (so it can't be
  double-requested), show a success state with a summary and "track your
  request" link.
- `/seller/wallet` and `/supplier/wallet` — the wallet dashboard: balance
  cards for available/reserved/pending, a transaction history table
  (filterable by type/date), and a withdrawal-requests history section
  (status, type, amount, date, approving manager once decided) with a
  prominent "New Withdrawal" button.

### 3. Retour Balance page (Seller only)

`/seller/wallet/retour` — per PLATFORM_SPEC.md §16:
- Current reserved-for-retour balance and how many more "not yet delivered"
  orders it currently covers (reserved balance ÷ 5dt, floored), a short
  explainer of the rule (translated into all three locales).
- History of retour reservations/releases/forfeitures, each linked to its
  order.
- A "Top Up" action: since the platform has no online payment gateway (COD
  only), implement this as a clearly-labeled DEV/DEMO top-up that lets the
  user add a chosen amount directly to `available` for demo purposes —
  comment clearly in the code that in production this top-up would happen
  via a manager-recorded cash/bank deposit at an agency (the mirror image
  of a cash withdrawal), which is a good candidate for its own future
  small feature but is explicitly out of scope here.

### 4. Manager pages (role M)

- `/manager/finance` — financial overview for this manager's agency:
  since escrow (wholesale, Phase 5) and store fees (Phase 7) don't exist
  yet, show those as clearly-labeled "coming in a later phase" cards for
  now, but DO show real (mock) totals for: commissions collected from
  users assigned to this agency, total pending withdrawal amount, total
  reserved retour balance across sellers at this agency.
  NOTE / assumption to document in code comments: the spec doesn't specify
  exactly how a seller/supplier gets associated with a "home agency" for
  withdrawal-routing purposes — for this mock phase, seed each mock user
  with a `home_agency_id` (suppliers already picked one at registration in
  Phase 1; assign sellers one too, e.g. round-robin across the mock
  agencies) so withdrawal requests can be routed to the right manager.
- `/manager/finance/withdrawals` — queue of `pending_manager_approval`
  requests for users at this manager's agency: table with user, amount,
  type, requested date, and manual fraud-check indicator badges per spec
  §13 point 3 (mocked but real-looking: "first withdrawal on this
  account", "amount > 50% of last 30 days' sales", "N retours in last 30
  days") — these are informational flags for the manager, not automatic
  blockers (no AI decisioning, per the platform's no-AI rule).
- `/manager/finance/withdrawals/:id` — approval detail: full user history
  (past withdrawals, retour count, dispute count placeholder at 0 since
  disputes aren't built yet), the request details, Approve / Reject
  (reason required) actions.
  - Approve + bank → status becomes `approved` then a manual "Mark as
    Transferred" action (simulating the real bank transfer) moves it to
    `completed` and finally debits `reserved` for real
    (`debit_withdrawal`).
  - Approve + cash → status becomes `approved_awaiting_pickup`, amount
    stays `reserved`; a "Record Cash Disbursement" action captures a
    receipt number + a free-text/mock signature confirmation and moves it
    to `completed` (`debit_withdrawal`). If not completed within 15 mock
    days (use a fast-forwardable mock clock or a simple "simulate 15 days
    passing" dev button — don't make me wait real days to test this), auto
    -expire it back to `available` per PLATFORM_SPEC.md §13 point 9.
  - Reject → releases the reserved amount back to `available`, requires a
    reason, notifies the user (reuse the notification patterns already
    established, even if just an in-app toast/badge for now).
- `/manager/finance/cash-log` — historical log of completed cash
  disbursements only: date, user, amount, receipt reference, approving
  manager — exportable-looking table (a "Export" button is fine as a
  visual affordance even if it doesn't produce a real file yet).

## Explicitly deferred (do not build in this phase)

- Escrow-related ledger entries and UI (wholesale) — Phase 5.
- Store-fee ledger entries — Phase 7.
- Dispute-refund ledger entries — Phase 8.
- `/admin/finance` (platform-wide finance oversight) — folds into Phase 7
  alongside the other remaining admin settings screens.
- Any real bank transfer or payment gateway integration, and the real
  "deposit at agency" flow that would back the retour-balance top-up.

## Consistency requirements

- Every status badge (withdrawal status, fraud-flag badges, etc.) reuses
  the existing Badge/StatusPill component and the status-color mapping
  convention established in Phase 3 — extend it, don't fork it.
- The withdrawal form uses the same Zod + react-hook-form pattern as
  previous phases, with real Tunisian RIB length/format validation.
- All new routes sit inside the existing role-aware authenticated shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components;
  money amounts are formatted consistently (e.g. "20.000 د.ت / 20,000 DT"
  per locale) everywhere in the app from this point forward.

## Deliverables checklist for this prompt

- [ ] lib/wallet.ts fully modeling available/reserved/pending balances and
      the 5 in-scope ledger entry types, wired into the Phase 3 order
      lifecycle (`settleOrder` / `forfeitRetour`), with realistic seeded
      transaction history.
- [ ] Shared withdrawal flow (amount/type → OTP → request created) reused
      identically by Seller and Supplier, with correct min/max validation
      per type and real RIB format validation.
- [ ] Seller & Supplier wallet dashboards (balance cards, transaction
      history, withdrawal-requests history).
- [ ] Seller retour-balance page with history and the dev/demo top-up.
- [ ] Manager: finance overview, withdrawal queue with fraud-flag badges,
      approval detail with the full bank/cash completion sub-flows
      (including the mock 15-day cash-pickup expiry), cash disbursement
      log.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-3.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 5 — Moderated chat & wholesale**, which introduces the `credit_escrow_hold` / `credit_escrow_release` ledger entries this phase's wallet module already reserved room for. Ask for "next prompt" again when you're ready for it.
