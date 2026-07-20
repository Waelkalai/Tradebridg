# Complete Frontend Sitemap — COD Marketplace Platform (TradeBridge)

> This sitemap is the frontend companion to [`PLATFORM_SPEC.md`](./PLATFORM_SPEC.md). Role letters are unified across both documents.

Legend for roles: **Guest** (not logged in) · **S** = Seller · **P** = Supplier/Shipper · **A** = Agent · **M** = Manager · **D** = Admin/Director · **Store** = White-label customer-facing storefront

> **Additions vs. the original draft:** a handful of pages were added at the end of the relevant sections (marked with a "🆕 Added for completeness" note directly below the affected table) to cover flows that exist in the platform spec but weren't yet represented in the sitemap: post-delivery disputes, reverse-logistics (returns-to-agency) scanning, inter-agency stock transfer, incident reporting, wishlist, new-depot creation, guest order tracking on the storefront, email verification, and a couple of admin CMS/settings screens (notification templates, legal content, ticket reason taxonomy). Everything else below is the original sitemap, unchanged.

---

## A. Public / Guest Pages (before login)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 1 | Landing Page | `/` | Main entry point, explains the platform to sellers & suppliers, drives sign-ups | Hero section, value props for sellers vs suppliers, stats (products, agencies, orders shipped), CTA buttons "Register as Seller" / "Register as Supplier" |
| 2 | About Us | `/about` | Company/platform credibility | Mission, coverage map of agencies in Tunisia |
| 3 | How It Works | `/how-it-works` | Explains COD flow, roles, escrow, commission model | Step diagram: Supplier adds product → Agent reviews → Seller sells → Order confirmed → Shipped → Delivered |
| 4 | White-Label Store Pricing | `/pricing` | Shows the store subscription pricing | 100dt/year, 10dt/month, 0.255dt/product table, FAQ |
| 5 | Contact / Support | `/contact` | Pre-signup inquiries | Contact form, phone/email, agency locations map |
| 6 | Terms & Conditions | `/terms` | Legal | Full T&Cs text |
| 7 | Privacy Policy | `/privacy` | Legal | Data handling, CIN photo storage disclosure |
| 8 | Login | `/login` | Auth entry for all roles | Username/email + password, "forgot password" link, role auto-detected from username prefix |
| 9 | Register – Choose Role | `/register` | First step of signup | Two big cards: "I'm a Seller" / "I'm a Supplier" (agents/managers/admin can't self-register) |
| 10 | Register – Seller Form | `/register/seller` | Seller signup | CIN number, email, CIN photo upload (front+back), company name, fiscal/"battened" number (optional), password |
| 11 | Register – Supplier Form | `/register/supplier` | Supplier signup | Same fields as seller + primary depot/agency selection |
| 12 | Registration Pending | `/register/pending` | Shown after signup submission | "Your account is under review by our team" status message, estimated review time |
| 13 | Forgot Password | `/forgot-password` | Password recovery start | Email/phone input |
| 14 | Reset Password | `/reset-password` | Set new password | New password + confirm fields |
| 15 | OTP Verification | `/verify-otp` | Used for signup, login 2FA, and withdrawals | 6-digit code input, resend timer |
| 15a 🆕 | Verify Email | `/verify-email` | Confirms the email address entered at signup (separate from phone OTP) | Confirmation state from emailed link/token, resend-link option |

---

## B. Shared Pages (any logged-in role)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 16 | Notifications | `/notifications` | Central alert feed | New order, product approved/rejected, message pending, withdrawal status, ticket reply |
| 17 | Profile Settings | `/settings/profile` | Edit personal/company info | Name, company, fiscal number, avatar, CIN documents (view only after verified) |
| 18 | Security Settings | `/settings/security` | Password & login security | Change password, active sessions, 2FA toggle |
| 18a 🆕 | Notification Preferences | `/settings/notifications` | Choose which channel is used per event type | Toggles per event (SMS / email / in-app), mandatory channels (e.g. withdrawal OTP) shown as locked-on |
| 19 | Tickets List | `/tickets` | Support ticket history | Table: reason, status, date, last update |
| 20 | New Ticket | `/tickets/new` | Open a support request | Reason dropdown, description textarea, attachment upload |
| 21 | Ticket Detail | `/tickets/:id` | Conversation with agent about the issue | Thread view, status badge (open/in-progress/closed) |
| 22 | Messages Inbox | `/messages` | List of moderated conversations | Conversation list grouped by type: product chat / account chat / wholesale chat, unread badges |
| 23 | Conversation Thread | `/messages/:id` | Chat UI (identity hidden) | Message bubbles, "message under review" pending state, attachments |
| 24 | Help Center | `/help` | Self-serve FAQ | Searchable FAQ, links to relevant tickets |

---

## C. Seller Portal (prefix `S`)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 25 | Seller Dashboard | `/seller/dashboard` | Home base after login | KPI cards: orders today, pending confirmation, wallet balance, retour balance, low-stock alerts on favorited products |
| 26 | Browse Products | `/seller/products` | Product discovery/catalog | Grid/list view, filters: price, category, agency/depot, in-stock, supplier count badge, sort by best-selling |
| 26a 🆕 | Wishlist / Favorites | `/seller/products/favorites` | Saved products for later | Grid of favorited products, stock/price-change alerts, quick "Create Order" from card |
| 27 | Product Detail | `/seller/products/:id` | Full product info before selling | Image gallery + main picture, video player, retail price, wholesale tiers table (MOQ + price), stock indicator, "Create Order" & "Request Wholesale" buttons, chat-with-supplier button |
| 28 | Deals & Promotions | `/seller/deals` | Time-limited offers | Countdown timers, discounted price vs original |
| 29 | Suppliers Directory | `/seller/suppliers` | Browse anonymized supplier profiles | Supplier ID (not name), product count, category, rating |
| 30 | Create Order | `/seller/orders/new` | Build a COD order for a real customer | Product picker (same-depot enforced), quantity, customer form (name, phone, address, governorate/delegation), sale price input, self-confirm checkbox |
| 31 | Orders List | `/seller/orders` | All orders placed by this seller | Table with status filter chips (pending confirmation, confirmed, preparing, shipped, delivered, returned) |
| 32 | Order Detail | `/seller/orders/:id` | Track one order | Status timeline, product(s), customer info, courier tracking number once shipped, "Open Dispute" action once delivered |
| 32a 🆕 | Disputes List | `/seller/disputes` | Post-delivery issues (damaged/wrong item) raised on this seller's orders | Table: order, reason, status (open/under review/resolved/rejected), refund outcome |
| 32b 🆕 | Dispute Detail | `/seller/disputes/:id` | Submit evidence and track resolution | Photos/description upload, agent decision + reasoning, refund status |
| 33 | Wholesale Requests List | `/seller/wholesale` | All wholesale orders sent to suppliers | Status: pending / accepted / rejected / escrow-paid / fulfilled |
| 34 | Create Wholesale Request | `/seller/wholesale/new` | Request bulk purchase | Product, quantity ≥ MOQ, target price, notes |
| 35 | Wholesale Request Detail | `/seller/wholesale/:id` | Track escrow & fulfillment | Escrow payment status, supplier acceptance, shipment-to-agency status |
| 36 | Wallet & Transactions | `/seller/wallet` | Financial overview | Balance, transaction history (sales, commissions deducted, withdrawals) |
| 37 | Withdrawal Request | `/seller/wallet/withdraw` | Cash out earnings | Type toggle (bank/cash), amount (min/max validated live), IBAN form or cash-pickup agency selector, OTP step |
| 38 | Retour Balance | `/seller/wallet/retour` | Manage the 5dt-per-order prepaid buffer | Current reserved balance, top-up button, history of retour deductions/releases |
| 39 | My Store Setup | `/seller/store/setup` | Onboarding for white-label store | Choose domain name, plan (monthly/yearly), payment |
| 40 | My Store Dashboard | `/seller/store` | Store performance | Visits, orders from store, revenue chart |
| 41 | My Store Products | `/seller/store/products` | Manage which products appear in the store | Only products approved "whole stores"; add/remove, edit displayed price/description per item, 0.255dt-per-product counter |
| 42 | My Store Settings | `/seller/store/settings` | Branding & domain | Logo, colors, domain, "request luxury design" button → opens ticket |
| 43 | My Store Billing | `/seller/store/billing` | Subscription management | Current plan, next invoice, payment history, per-product fee breakdown |
| 44 | API Key Management | `/seller/api-keys` | Manage store API integration | Generate/revoke key, usage docs link |
| 45 | Reports & Analytics | `/seller/reports` | Sales performance | Charts: revenue over time, best sellers, return rate |

---

## D. Supplier / Shipper Portal (prefix `P`)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 46 | Supplier Dashboard | `/supplier/dashboard` | Home base | KPIs: pending product reviews, incoming wholesale requests, stock alerts, wallet balance |
| 47 | My Products | `/supplier/products` | Manage product catalog | Table with approval status badges (pending/store-only/whole-stores/rejected) |
| 48 | Add New Product | `/supplier/products/new` | Full product creation form | Name, category, description, multi-image upload + main picture selector, video upload, retail price, wholesale price tiers + MOQ per tier, variants (color/size, if any), weight/dimensions, depot assignment, initial quantity |
| 49 | Edit Product | `/supplier/products/:id/edit` | Update existing listing | Same fields as creation, triggers re-review if key fields changed |
| 50 | Product Review Status | `/supplier/products/:id/status` | See agent decision | Decision (accept-one-store / accept-all / reject), reason text, resubmit button if rejected |
| 51 | Depots / Warehouses | `/supplier/depots` | Manage multiple physical depots | List of depots with location, linked agency, stock summary |
| 51a 🆕 | Add New Depot | `/supplier/depots/new` | Register a new physical/virtual depot | Name, address, linked agency (optional), contact info |
| 52 | Depot Detail | `/supplier/depots/:id` | Per-depot stock | Products physically present there, quantities |
| 53 | Stock Overview | `/supplier/stock` | Virtual vs physical stock | Total declared quantity vs sum across agencies, mismatch warnings |
| 54 | Incoming Wholesale Requests | `/supplier/wholesale` | Requests from sellers | Table with accept/reject actions |
| 55 | Wholesale Request Detail | `/supplier/wholesale/:id` | Review & respond | Seller's requested qty/price (seller identity hidden), accept/reject buttons, once accepted: shipping instructions to agency |
| 56 | Orders Fulfillment Queue | `/supplier/orders` | Orders needing product prep | List of orders requiring stock confirmation/dispatch to agency |
| 57 | Wallet & Transactions | `/supplier/wallet` | Financial overview | Balance, commission deductions, escrow releases |
| 58 | Withdrawal Request | `/supplier/wallet/withdraw` | Cash out | Same bank/cash flow as seller |
| 59 | Fiscal / Battened Number Settings | `/supplier/settings/fiscal` | Manage tax registration | Add/edit fiscal number, effect on commission explained |

---

## E. Agent Portal (prefix `A`)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 60 | Agent Dashboard | `/agent/dashboard` | Task queues based on assigned permissions | Cards: pending account approvals, pending product reviews, pending messages, orders to confirm, tickets open, disputes open |
| 61 | Account Approvals Queue | `/agent/accounts/pending` | New seller/supplier signups | List with CIN photos preview, quick approve/reject |
| 62 | Account Review Detail | `/agent/accounts/:id` | Full applicant review | CIN front/back images, company info, fiscal number, approve/reject with reason |
| 63 | Product Review Queue | `/agent/products/pending` | New/edited products awaiting decision | List sortable by supplier, category, submission date |
| 64 | Product Review Detail | `/agent/products/:id` | Decide on a product | Full product view (images, video, prices, MOQ), decision buttons: accept this agency only / accept whole stores / reject + reason field |
| 65 | Message Moderation Queue | `/agent/messages/pending` | Messages waiting for review | List with auto-flagged risk indicator (phone number/link detected) |
| 66 | Message Review Detail | `/agent/messages/:id` | Approve/redact/reject a message | Original message, edit-before-send option, approve/reject buttons |
| 67 | Orders To-Confirm Queue | `/agent/orders/to-confirm` | Orders needing the confirmation call | List sorted by order age/priority |
| 68 | Order Confirmation Detail | `/agent/orders/:id/confirm` | Call script & outcome logging | Customer info, product/qty/price, call outcome (confirmed / no answer / cancelled), notes |
| 69 | Warehouse — Stock-In Scan | `/agent/warehouse/scan-in` | Register incoming goods from supplier | Scanner input field, quantity counter, auto-generate & print sticker button if no code exists |
| 70 | Warehouse — Boxing Scan | `/agent/warehouse/box` | Pack an order | Scan each product code into a box, system generates new box code, print box label |
| 71 | Warehouse — Handover Scan | `/agent/warehouse/handover` | Hand parcel to courier | Scan box code, select courier company, log driver name, timestamp |
| 71a 🆕 | Warehouse — Returns Scan | `/agent/warehouse/scan-return` | Reverse logistics: register a parcel/product coming back from a failed delivery or customer return | Scan box/product code, mark condition (resellable / damaged), auto-restock resellable items, quarantine damaged ones |
| 71b 🆕 | Warehouse — Stock Transfer | `/agent/warehouse/transfer` | Move stock from this agency to another agency | Scan product out (transfer_out), select destination agency, destination agent confirms with scan-in (transfer_in) |
| 71c 🆕 | Incident Report | `/agent/warehouse/incidents` | Log lost/stolen/mis-scanned inventory | Product code, last known scan event, description, escalates to manager |
| 72 | Agency Stock View | `/agent/warehouse/stock` | Live inventory for this agency | Table: product, code, quantity, zone/shelf location |
| 73 | Tickets Queue | `/agent/tickets` | Tickets assigned to this agent | List filterable by status/reason |
| 74 | Ticket Response | `/agent/tickets/:id` | Respond to a ticket | Thread, resolve/close button |
| 74a 🆕 | Disputes Queue | `/agent/disputes/pending` | Post-delivery disputes awaiting a decision | List: order, seller, reason, days open |
| 74b 🆕 | Dispute Review Detail | `/agent/disputes/:id` | Investigate and decide | Customer/seller evidence, last scan history for the product, accept/reject + refund amount, reasoning |

---

## F. Manager Portal (prefix `M`)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 75 | Manager Dashboard | `/manager/dashboard` | Agency-level overview | Orders processed, stock value, active agents, pending withdrawal approvals |
| 76 | Agents List | `/manager/agents` | All agents under this manager | Table with role/permission summary, active/inactive toggle |
| 77 | Create Agent Account | `/manager/agents/new` | Only managers can create agent accounts | Name, CIN, email, initial permission set |
| 78 | Agent Permissions Editor | `/manager/agents/:id/permissions` | Assign granular permissions | Checkboxes: order tracking, finance view, product review, message moderation, account approval, warehouse ops, ticket handling, dispute resolution |
| 79 | Agency Settings | `/manager/agency/settings` | Agency profile | Location, working hours, linked courier accounts |
| 80 | Financial Overview | `/manager/finance` | Money flow for this agency | Escrow held, commissions collected, payouts pending |
| 81 | Withdrawal Requests Queue | `/manager/finance/withdrawals` | Requests needing manager approval | List with user, amount, type (bank/cash), OTP-verified flag |
| 82 | Withdrawal Approval Detail | `/manager/finance/withdrawals/:id` | Approve/reject a withdrawal | User history, retour count, approve/reject buttons |
| 83 | Cash Disbursement Log | `/manager/finance/cash-log` | Record of physical cash handed out | Date, user, amount, receipt reference |
| 84 | Agency Stock (Full) | `/manager/warehouse` | Full warehouse view across all agents | Same as agent stock view but agency-wide with historical scan logs, includes pending transfers in/out |
| 85 | Reports & Analytics | `/manager/reports` | Agency performance | Orders volume, revenue, return rate, agent productivity |
| 86 | Audit Log | `/manager/audit-log` | Accountability trail | Every approve/reject/scan action with actor, timestamp |

---

## G. Admin / Director Portal (prefix `D`)

| # | Page | URL | Purpose | Key Content |
|---|---|---|---|---|
| 87 | Admin Dashboard | `/admin/dashboard` | Platform-wide KPIs | Total users, agencies, orders, GMV, active issues |
| 88 | All Users | `/admin/users` | Manage every account | Search/filter by role/status, suspend/reactivate |
| 89 | User Detail | `/admin/users/:id` | Full profile, edit anything | Documents, wallet, order history, role change |
| 90 | All Agencies | `/admin/agencies` | Manage agencies | List with manager assigned, location, stock value |
| 91 | Agency Detail | `/admin/agencies/:id` | Single agency deep-dive | Same as manager view plus edit/delete |
| 92 | Create New Agency | `/admin/agencies/new` | Add a new physical location | Name, address, assign manager |
| 93 | All Managers | `/admin/managers` | Manage manager accounts | Create/edit/deactivate |
| 94 | Commission & Fee Settings | `/admin/settings/commissions` | Platform-wide financial rules | Seller %, supplier %, retour fee, store subscription pricing — all editable |
| 95 | Courier Integrations | `/admin/settings/couriers` | Manage 3rd-party delivery partners | Aramex/First Delivery API credentials, active status |
| 96 | Platform-wide Product Catalog | `/admin/products` | Oversight of all products | Search/filter, override any approval decision |
| 97 | Platform-wide Orders | `/admin/orders` | Oversight of all orders | Global search, status override capability |
| 98 | Platform-wide Finance | `/admin/finance` | Full financial control | Escrow balances, total commissions, all withdrawal history |
| 99 | White-Label Stores Management | `/admin/stores` | Oversight of all seller stores | List, subscription status, suspend/reinstate |
| 100 | System Audit Logs | `/admin/audit-log` | Platform-wide accountability | Every sensitive action across all agencies/roles |
| 101 | Roles & Permissions Matrix | `/admin/roles` | Define what each role/permission can do | Master permission table editor |
| 101a 🆕 | Notification Templates | `/admin/settings/notifications` | Manage SMS/email copy per event | Template editor per event type/language, test-send |
| 101b 🆕 | Legal Content (CMS) | `/admin/settings/content` | Edit Terms, Privacy Policy, How-It-Works copy | Versioned rich-text editor, publish/rollback |
| 101c 🆕 | Ticket Reasons & Categories | `/admin/settings/tickets` | Manage the taxonomy used on `/tickets/new` | Add/edit/deactivate reason categories, default routing to agent permission group |
| 101d 🆕 | Platform-wide Disputes | `/admin/disputes` | Oversight of all disputes across agencies | Search/filter, override any agent decision |

---

## H. White-Label Seller Store (customer-facing, one instance per seller)

| # | Page | URL Pattern | Purpose | Key Content |
|---|---|---|---|---|
| 102 | Store Home | `/{store-domain}/` | Storefront landing | Seller's branding, featured products |
| 103 | Store Product Listing | `/{store-domain}/products` | Browse this seller's catalog | Grid of products seller chose to display |
| 104 | Store Product Detail | `/{store-domain}/products/:id` | Product page for the end customer | Images, seller's custom price/description, "Order Now" (COD) button |
| 105 | Checkout (COD) | `/{store-domain}/checkout` | End customer places order | Name, phone, address, quantity — no online payment, COD only |
| 106 | Order Confirmation | `/{store-domain}/order-confirmation` | Post-checkout thank-you page | Order summary, expected confirmation call notice |
| 106a 🆕 | Track My Order | `/{store-domain}/track-order` | Guest end-customer order status lookup, no account needed | Lookup by phone number + order reference, shows status timeline (confirmed/preparing/shipped/delivered/returned) |

---

## Notes on completeness

- Every role-specific page above enforces access control by the permission set assigned to that account (especially for Agents, whose dashboard cards only show queues they're authorized for).
- All pages that touch money (withdrawals, wholesale escrow, store billing) route through OTP/SMS verification where specified in [`PLATFORM_SPEC.md`](./PLATFORM_SPEC.md#13-المحفظة-الرقمية-والسحب-المالي).
- All warehouse scan pages are designed to work both with a dedicated barcode scanner (HID/keyboard-emulation input) and a camera-based scan via the browser (PWA), since agents may use tablets in the field — see the hardware recommendations in [`PLATFORM_SPEC.md` §27](./PLATFORM_SPEC.md#27-التوصيات-التقنية-لأدوات-المسح-والطباعة).
- The chat/messaging UI (`/messages/:id`) is shared code between Seller and Supplier portals, differing only in which "side" is masked.
- The **Dispute** pages (`/seller/disputes*`, `/agent/disputes*`, `/admin/disputes`) implement the post-delivery return/dispute process described in [`PLATFORM_SPEC.md` §21](./PLATFORM_SPEC.md#21-الإرجاع-والنزاعات-بعد-التسليم).
- The **Returns Scan** and **Stock Transfer** pages implement the exception flows described in [`PLATFORM_SPEC.md` §11](./PLATFORM_SPEC.md#11-نظام-المسح-بالباركودqr-داخل-الوكالة) (`returned_to_agency`, `transfer_out`/`transfer_in` scan actions) and §12 (multi-agency stock).
- Role letter scheme is unified with the platform spec: `S` seller, `P` supplier/shipper, `A` agent, `M` manager, `D` admin/director. The platform spec additionally defines `L` (internal agency delivery liaison) and `C` (customer record, no login) — these don't need dedicated portal pages since `L` mainly interacts via `/agent/warehouse/handover` on their assigned agent account, and `C` never logs in (their only touchpoint is the storefront checkout/track-order pages above).
