# Cursor Build Prompt — Phase 8: Disputes & Post-Delivery Returns

> Run this **after** Phase 7 (`docs/CURSOR_BUILD_PROMPT_PHASE7.md`) has been built and reviewed. Paste the block below as your next message to the Cursor Agent, in the same repo/project.

---

## The Prompt

```
Continue building "TradeBridge" on top of the Phase 1-7 work that already
exists in this project (foundation/auth, products/depots, orders, wallet,
chat/wholesale, warehouse scanning, white-label store & admin portal).
Re-read these two docs before writing any code — they are still the single
source of truth:

- docs/PLATFORM_SPEC.md      (full business/product spec, in Arabic —
  Section 21 "الإرجاع والنزاعات بعد التسليم" is what this phase implements
  in full, and Section 19's mermaid diagram shows exactly where a
  post-delivery dispute fits in the order lifecycle)
- docs/FRONTEND_SITEMAP.md   (Section C rows 32a/32b, Section E rows
  74a/74b, Section G row 101d are what you're building now)

Do not rebuild or restyle anything from Phase 1-7 — reuse the existing UI
kit, color tokens, layout shell, i18n setup (ar/fr/en), theme setup
(light/dark/auto), and every existing lib/*.ts data module (orders, wallet,
wholesale, scanning). Every new page must look and feel like it was built
by the same team in the same sitting — same blue palette, same spacing,
same component patterns, full RTL support, correct in dark mode, fully
responsive, every string translated into all three locales.

## Scope of THIS prompt (Phase 8 only)

### 1. Disputes data layer — lib/disputes.ts

Mock/localStorage-backed (real backend is Phase 9). Model `Dispute`:
source_type (`order` | `wholesale`), related_order_id or
related_wholesale_id, raised_by (the seller — per the spec, the customer
never has a platform account, so it's always "the seller, on the
customer's behalf"), reason (preset: damaged / wrong item / missing item /
other + free text), description, evidence (mock photo upload references),
status (`open` | `under_review` | `accepted` | `rejected`), assigned to
whichever agent has `DISPUTE_RESOLUTION`, decision + decision_reason,
refund_amount (full or partial, only set when accepted), a
`responsibility` field (`courier` | `supplier` | `unclear`, set only on
acceptance — per the spec: damage discovered in transit points to the
courier, damage that was already there when it left the agency points to
the supplier), created_at, resolved_at.

Two distinct origins for this same Dispute model, per the spec:
- **Order disputes**: raised manually by the seller from a `delivered`
  order (this is what the Phase 3 "Open Dispute" button — currently a
  coming-soon placeholder — should now create for real).
- **Wholesale disputes**: auto-created (not manually raised) the moment a
  WholesaleRequest from Phase 5 hits `received_partial_mismatch` or
  `received_rejected`. Backfill this for any such requests already in the
  Phase 5 mock seed data, and wire the auto-creation going forward from
  wherever Phase 6 now drives those wholesale outcomes via real scanning.
  IMPORTANT: for wholesale disputes, Phase 5's escrow was already
  split/released at the moment of the mismatch — this Dispute record here
  is the INVESTIGATION/PAPER TRAIL of why it happened, not a second
  financial settlement. Model its resolution as a status/notes-only
  outcome (no additional wallet movement) unless you find a compelling
  reason to allow an adjustment — if so, document that decision clearly.

### 2. Escalation flagging (rule-based, no AI, per the platform's own rule)

Add a small computed helper: for each seller/supplier, `disputeRate =
disputes raised against their orders / their total delivered orders` (and
similarly for wholesale). If it crosses a documented mock threshold (e.g.
15%), surface a "high dispute rate — recommend account review" flag. Since
the sitemap has no dedicated Manager disputes page, surface this flag in
two existing places instead of inventing a new route: a small "Flagged
Accounts" card on `/manager/dashboard` (Phase 1) and a banner on
`/admin/users/:id` (Phase 7) when viewing a flagged user. This is
informational only — never an automatic suspension, consistent with the
platform's no-AI, human-decides rule.

### 3. Order-detail wiring (replace the Phase 3 placeholder)

On `/seller/orders/:id`, the "Open Dispute" button is enabled only once the
order's status is `delivered`. Clicking it opens a create-dispute form
(reason, description, evidence upload) that creates an `open` Dispute
linked to that order. Once a dispute exists for an order, the button
becomes "View Dispute" and links to the detail page below instead.

### 4. Seller pages (role S)

- `/seller/disputes` — table of this seller's disputes (both order- and
  wholesale-sourced), with the related order/wholesale reference, reason,
  status, and refund outcome once resolved.
- `/seller/disputes/:id` — detail: full dispute info, evidence, current
  status, and — once resolved — the decision, reasoning, and refund amount
  if accepted. Wholesale-sourced disputes link back to their
  `/seller/wholesale/:id` for context.

### 5. Agent pages (role A)

- `/agent/disputes/pending` — queue of `open`/`under_review` disputes,
  oldest-first, filterable by source_type, showing order/wholesale
  reference, masked seller ID, reason, and days-open.
- `/agent/disputes/:id` — the investigation screen:
  - Full dispute details and evidence photos.
  - An embedded, read-only pull of the relevant scan history from
    lib/scanning.ts for the product/box in question (e.g. did it leave the
    agency as `boxed` with no `damaged` flag right before shipping? — this
    is the concrete evidence that tells the agent whether the issue likely
    happened before or during transit, per the spec).
  - The escalation flag banner from step 2 when the seller/supplier
    involved is already flagged.
  - Decision panel for ORDER disputes only: "Accept" (choose full or
    partial refund amount, then choose responsibility: courier or
    supplier) or "Reject" (reason required). On Accept:
    - `debit_dispute_refund` on the SELLER's wallet for the refund amount
      (reversing the profit they were credited via `credit_sale` when the
      order was delivered in Phase 4).
    - If responsibility = `supplier`, ALSO `debit_dispute_refund` on the
      SUPPLIER's wallet for their corresponding share of that item's sale
      (clawing back their `credit_sale` from the original order
      settlement too).
    - If responsibility = `courier`, no further wallet clawback — document
      that the platform absorbs it for now, since the courier isn't a
      wallet-holding entity in this system.
    - On Reject: order stays `delivered`/effectively closed, seller is
      notified with the reason.
  - For WHOLESALE disputes: a simpler "Mark Resolved" action with a notes
    field only (per the no-double-settlement note in step 1) — no
    accept/reject financial decision here.

### 6. Admin pages (role D)

- `/admin/disputes` — platform-wide oversight of every dispute (both
  source types), with the ability to override any agent's decision, plus a
  view of every currently-flagged high-dispute-rate account from step 2
  with a direct link into `/admin/users/:id` for further review.

## Explicitly deferred (do not build in this phase)

- Any real backend persistence for disputes — Phase 9.
- Automated/AI-based dispute triage or fraud scoring — never in scope for
  this platform, per its own explicit no-AI rule.

## Consistency requirements

- Reuse the existing Badge/StatusPill palette conventions for dispute
  status (extend, don't fork).
- The create-dispute form uses the same Zod + react-hook-form pattern as
  previous phases.
- All new routes sit inside the existing role-aware authenticated shell,
  respect RTL for Arabic, render correctly in light/dark/auto, and are
  fully translated into ar/fr/en.
- Loading/empty states reuse the existing Skeleton/EmptyState components.

## Deliverables checklist for this prompt

- [ ] lib/disputes.ts with both dispute origins (manual order disputes,
      auto-created wholesale disputes), the escalation-rate helper, and
      realistic seed data covering open/accepted/rejected outcomes.
- [ ] Order detail's "Open Dispute" button wired to a real create flow,
      gated on `delivered` status, becoming "View Dispute" once one
      exists.
- [ ] Seller: disputes list + detail.
- [ ] Agent: disputes queue + investigation/decision screen with the
      scan-history evidence pull, the accept (refund + responsibility) /
      reject decision for order disputes, and the simpler resolve flow for
      wholesale disputes.
- [ ] lib/wallet.ts extended with real `debit_dispute_refund` handling,
      including the responsibility-based supplier clawback.
- [ ] Admin: platform-wide disputes oversight with decision-override and
      the flagged-accounts view; Manager dashboard gets the "Flagged
      Accounts" card.
- [ ] Everything responsive, RTL-correct, correct in light/dark/auto theme,
      translated into ar/fr/en, and visually consistent with Phases 1-7.
- [ ] No console errors; `npm run dev` runs clean.

Work through this systematically, committing logically as you go. Ask me
nothing unless truly blocked — prefer a documented assumption consistent
with docs/PLATFORM_SPEC.md and keep moving.
```

---

## What's next

After this phase is merged and reviewed, move on to **Phase 9 — Backend hardening**, which promotes every mock `lib/*.ts` data layer built across Phases 1-8 into real FastAPI + PostgreSQL modules, one at a time. Ask for "next prompt" again when you're ready for it.
