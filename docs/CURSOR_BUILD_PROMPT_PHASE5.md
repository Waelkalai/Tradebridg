# Cursor Build Prompt — Phase 5: Moderated Chat & Wholesale

> Run this **after** Phase 4 (`docs/CURSOR_BUILD_PROMPT_PHASE4.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1-4 work that already
exists in this project (foundation/auth, products/depots, orders +
confirmation calls, and the full wallet/ledger module from Phase 4). Re-read
these two docs before writing any code — they are still the single source
of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 7 "نظام المحادثات المراقبة" for the moderated chat system, and
  Section 8 "طلبات الجملة وآلية الضمان" — including its mermaid diagram —
  for the wholesale/escrow flow this phase implements)
- docs/FRONTEND_SITEMAP.md   (Section B rows 22-23, Section C rows 33-35
  (plus wiring the existing "chat with supplier" button on row 27 from
  Phase 2), Section D rows 54-55, Section E rows 65-66 are what you're
  building now)

Do not rebuild or restyle anything from Phase 1-4 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), the OTP mechanism from Phase 1, and lib/wallet.ts from
Phase 4. Every new page must look and feel like it was built by the same
team in the same sitting — same blue palette, same spacing, same component
patterns, full RTL support, correct in dark mode, fully responsive, every
string translated into all three locales.

## Scope of THIS prompt (Phase 5 only)

### 1. Moderated messaging data layer — lib/messages.ts

Mock/localStorage-backed, same pattern as previous phases (real backend is
Phase 9). Model:

- `Conversation`: id, type (`product` | `account` | `wholesale`),
  participant_a_id, participant_b_id (for `account`-type conversations,
  participant_b is "the support agent team", not a specific masked user),
  related_product_id (for `product`) or related_wholesale_id (for
  `wholesale`), created_at. Identity stays masked everywhere — only ever
  show the public username (`S4821`, `P1190`), never a real name.
- `Message`: id, conversation_id, sender_id, body (text) and/or a mock
  attachment reference, status (`pending_review` | `approved` | `redacted`
  | `rejected`), moderation_reason (when rejected), the ORIGINAL body is
  preserved separately from the redacted/delivered body when an agent
  edits it, reviewed_by / reviewed_at, created_at.
- A rule-based (NOT AI) risk-flag function per PLATFORM_SPEC.md §7: regex
  detection of 8-digit Tunisian phone numbers, URLs, and common platform
  names (Facebook, WhatsApp, Instagram, TikTok, Messenger) — flag matching
  messages as `high_risk` so they sort to the top of the agent's queue.
- Track a per-user "chat warning count" (increments on each rejected
  message for contact-info sharing); after 3, show a "flagged for repeated
  contact-info attempts — consider escalating to the manager" banner on
  that user's messages in the agent review screen (per spec §7's
  suspension-after-3-warnings rule — implement the visible flag; the actual
  suspension enforcement can just disable that user's message COMPOSER
  client-side with an explanatory notice, no backend enforcement needed
  yet).
- Seed a handful of realistic conversations across all 3 types with a mix
  of message statuses (some already-approved history so threads don't look
  empty, one or two genuinely pending_review, and at least one message that
  was redacted so you can see that state rendered) for demo realism.

### 2. Shared messaging UI (all roles)

- `/messages` — inbox: tabs/filters by conversation type (product/account/
  wholesale), list sorted by most recent activity, unread badges.
- `/messages/:id` — thread view:
  - Message bubbles for approved/redacted messages from both sides.
  - The sender's OWN pending_review messages show to them with a distinct
    "under review" pending state (e.g. a small clock icon + muted styling)
    — the recipient never sees pending messages at all.
  - Rejected messages show only to their sender, with the rejection reason,
    never delivered to the other side.
  - Composer with text + a mock attachment/image upload button; disabled
    with an explanatory notice if this user has been flagged per the
    warning-count rule above.
  - Header shows only the other participant's masked ID + a small icon for
    their role (seller/supplier/agent-support), plus a link back to the
    related product or wholesale request when applicable.
- Wire up the "Chat with Supplier" button on `/seller/products/:id` (from
  Phase 2) to create-or-open a `product`-type conversation with that
  product's supplier. Add an equivalent entry point on the supplier side if
  one doesn't already exist (e.g. on their product detail/status page).
- Wire the account-type conversation entry point from the Help
  Center/Tickets area if one already exists as a placeholder from Phase 1;
  otherwise add a simple "Contact Support" action that opens/creates an
  `account`-type conversation.

### 3. Agent message moderation (role A)

- `/agent/messages/pending` — queue of pending_review messages, high_risk
  ones sorted first, then oldest-first; each row shows a preview, sender
  masked ID, conversation type, and a red/amber risk badge when flagged.
- `/agent/messages/:id` — review screen:
  - Full message content/attachment preview, the auto-flag reason
    highlighted inline if risk-flagged (e.g. the detected phone number
    visually underlined).
  - Three actions matching the spec exactly: "Approve as-is", "Redact &
    Approve" (inline-editable text area pre-filled with the original,
    typically with the risky substring already removed/blanked for the
    agent to confirm), "Reject" (reason required, a few preset reasons
    plus free text).
  - Submitting updates the message status, logs reviewed_by/reviewed_at,
    shows a success toast, and returns to the queue.
  - Show the sender's warning-count banner (from step 1) when relevant.

### 4. Wholesale requests — lib/wholesale.ts data layer

Mock/localStorage-backed `WholesaleRequest`: id, seller_id, supplier_id
(masked), product_id, quantity, target_price, notes, agency_id (shipping
destination), status, escrow_amount, status_history (same
timestamped-history pattern as orders in Phase 3), created_at,
responded_at, a 48-hour mock response deadline (reuse the "simulate time
passing" dev-clock control pattern you built for the Phase 4 cash-pickup
expiry, so testers don't have to wait real hours).

Status set (mirror the spec's mermaid diagram in §8 exactly, using more
granular internal states than the sitemap's simplified list so every step
is representable):
`pending` → `accepted` | `rejected` | `expired` (auto, after 48h with no
supplier response) → (if accepted) `pending_escrow_payment` →
`escrow_paid` → `shipped_to_agency` → then one of: `received_full_match`
(→ `fulfilled`), `received_partial_mismatch` (→ `partially_fulfilled`, and
flags a dispute — see below), `received_rejected` (→ `disputed`).

IMPORTANT scope note: the actual agent-side receiving/quantity-matching via
barcode scan (PLATFORM_SPEC.md §11) is real warehouse-scanning
functionality that belongs to Phase 6, not this one. For this phase,
simulate that step with a small, clearly-labeled DEV-ONLY control visible
only to the Agent role on the wholesale detail page ("Simulate agency
receiving: Full match / Partial mismatch / Full rejection") that drives the
status transitions and wallet settlement below. Comment this clearly as a
stand-in that Phase 6 will replace with real scan-driven logic.

Wallet settlement (extend lib/wallet.ts with the two reserved-but-unused
ledger types from Phase 4 — implement them for real now):
- On `escrow_paid`: `debit_escrow_hold` on the SELLER's wallet for the full
  escrow_amount (moves out of `available`; the platform, not the seller,
  now holds it — it should NOT show as the seller's `reserved` balance,
  model a conceptually separate "platform escrow" ledger if that's cleaner
  than overloading the wallet's `reserved` bucket, and document whichever
  choice you make).
- On `received_full_match`: `credit_escrow_release` credits the SUPPLIER's
  wallet with escrow_amount minus the platform commission (reuse the §10
  commission logic from Phase 3/4), plus the matching `debit_commission`
  entry on the supplier's ledger.
- On `received_partial_mismatch`: split the release proportionally to the
  quantity actually received — the matched portion releases to the
  supplier (minus commission) via `credit_escrow_release`, the remaining
  unmatched portion releases BACK to the seller via another
  `credit_escrow_release` entry on the seller's ledger, and the request is
  flagged for a dispute (link to the existing Phase 3 "coming soon" dispute
  placeholder — do not build real dispute resolution here, that's Phase 8).
- On `received_rejected`: the full escrow_amount releases back to the
  seller via `credit_escrow_release`, and the request is flagged for a
  dispute the same way.
- On `rejected` (by supplier, before any payment) or `expired`: just close
  the request, no wallet movement needed since no escrow was ever paid.

### 5. Seller pages (role S)

- `/seller/wholesale/new` — pick a product (must have wholesale price
  tiers from Phase 2), quantity input validated live against the lowest
  tier's MOQ, target price pre-filled from the matching tier for the
  entered quantity (editable), notes textarea, destination agency selector
  (reuse the mock agencies list). On submit: creates the request
  (status=pending) AND automatically creates/opens the linked
  `wholesale`-type conversation from step 1 so negotiation can start right
  away.
- `/seller/wholesale` — list with status filter chips (use the sitemap's
  simplified grouping for the chips — pending / accepted / rejected /
  escrow-paid / fulfilled — even though the underlying data has more
  granular states).
- `/seller/wholesale/:id` — detail: request info, a status timeline
  (adapt the reusable stepper component from Phase 3), the linked
  conversation thread embedded or linked prominently, and — once status is
  `pending_escrow_payment` — a "Pay into Escrow" button that: checks the
  seller's `available` balance covers escrow_amount (block with a clear
  message + link to the wallet if not), requires OTP confirmation (reuse
  Phase 1's OTP flow, since this touches money per the sitemap's own
  completeness notes), then executes `debit_escrow_hold` and advances the
  status to `escrow_paid`.

### 6. Supplier pages (role P)

- `/supplier/wholesale` — incoming requests list (seller identity always
  masked) with quick Accept/Reject actions and a status filter.
- `/supplier/wholesale/:id` — detail: requested qty/price/notes, the linked
  conversation, Accept/Reject buttons (reject requires a reason, closes the
  request and notifies the seller); once accepted, show clear shipping
  instructions (destination agency name/address, the 48h-equivalent
  shipping expectation) and the same status timeline as the seller sees.

## Explicitly deferred (do not build in this phase)

- Real warehouse-scan-driven receiving/matching for wholesale goods —
  Phase 6 (this phase uses the dev-only simulation control described
  above).
- The real dispute resolution flow for partial-mismatch/rejected wholesale
  outcomes — Phase 8 (link to the existing coming-soon placeholder).
- Ticket system pages (`/tickets*`, `/agent/tickets*`) — not part of this
  phase; they get their own slot later (see the updated phase list in
  docs/CURSOR_BUILD_PROMPT.md).

## Consistency requirements

- Reuse the existing Badge/StatusPill palette conventions for message
  status and wholesale status (extend, don't fork).
- All new forms use the same Zod + react-hook-form pattern as previous
  phases.
- All new routes sit inside the existing role-aware authenticated shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components.

## Deliverables checklist for this prompt

- [ ] lib/messages.ts with conversations/messages, the regex risk-flag
      function, the per-user warning counter, and realistic seed data
      covering all three conversation types and every message status.
- [ ] Shared `/messages` inbox and `/messages/:id` thread UI with correct
      identity masking and the sender-only "pending review" state, wired
      up from the seller product detail page's "Chat with Supplier" button
      and a support "Contact Support" entry point.
- [ ] Agent: message moderation queue (risk-sorted) and review screen with
      the exact 3 actions (approve / redact & approve / reject).
- [ ] lib/wholesale.ts with the full granular status model, the 48h mock
      expiry, and the dev-only agent receiving-simulation control.
- [ ] lib/wallet.ts extended with real `debit_escrow_hold` /
      `credit_escrow_release` implementations covering full-match,
      partial-mismatch (split release), and full-rejection outcomes.
- [ ] Seller: create wholesale request, list with filters, detail with
      timeline + embedded conversation + OTP-gated escrow payment.
- [ ] Supplier: incoming requests list, detail with accept/reject +
      shipping instructions once accepted.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-4.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 6 — Warehouse scanning**, which replaces this phase's dev-only wholesale-receiving simulation with real scan-driven logic, and also drives the Phase 3 order-status transitions (preparing → ready for pickup → handed to courier) from real scans. Ask for "next prompt" again when you're ready for it.
