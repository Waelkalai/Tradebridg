# Running & Testing TradeBridge Locally

This describes how to run what's actually built so far: **Phase 1** — the foundation (Next.js frontend + FastAPI backend + PostgreSQL), real authentication (register/login/OTP/JWT), the marketing site, and a role-aware dashboard shell for all 5 roles (Seller, Supplier, Agent, Manager, Admin).

> Phases 2-10 (products, orders, wallet, chat, scanning, etc.) are documented as ready-to-paste Cursor build prompts in `docs/CURSOR_BUILD_PROMPT_PHASE*.md` but are **not implemented yet** — those pages currently don't exist beyond the dashboard shell described here.

This exact setup was built and verified end-to-end in the cloud sandbox that produced this branch (backend running, migrations applied, demo users seeded, all 5 roles successfully logging in and reaching their dashboard, frontend serving all 3 locales with correct RTL for Arabic). Follow the same steps below to run it on your own machine.

---

## 1. Prerequisites

- **Node.js 20+** and npm
- **Python 3.12+**
- **PostgreSQL 16** — either via Docker, or installed natively. Pick ONE of the two options below.

### Option A — PostgreSQL via Docker (recommended if you have Docker)

```bash
docker compose up -d db
```

This starts Postgres on `localhost:5432` with the database/user already created (`tradebridge` / `tradebridge_dev_pw` / db `tradebridge`), matching `apps/api/.env.example`.

### Option B — Native PostgreSQL (what was used to verify this build, since Docker wasn't available in that sandbox)

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER tradebridge WITH PASSWORD 'tradebridge_dev_pw' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE tradebridge OWNER tradebridge;"
```

---

## 2. Backend (FastAPI)

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # defaults already match the DB created above

alembic upgrade head       # create tables
python -m app.seed         # create one demo user per role (see credentials below)

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's up: `curl http://localhost:8000/health` → `{"status":"ok"}`.
Interactive API docs: http://localhost:8000/docs

## 3. Frontend (Next.js)

In a second terminal:

```bash
cd apps/web
npm install
cp .env.example .env.local   # points NEXT_PUBLIC_API_URL at http://localhost:8000
npm run dev
```

Open **http://localhost:3000** — it redirects to `/ar` (Arabic, RTL) by default. Switch language with the globe icon in the top bar (Arabic / Français / English), and cycle the theme (light → dark → auto) with the sun/moon icon next to it.

---

## 4. Demo login credentials (one per role)

The seed script (`python -m app.seed`) creates these 5 **already-active** accounts — no activation step needed, log in immediately at http://localhost:3000/ar/login (or `/fr/login`, `/en/login`):

| Role | Username | Email | Password |
|---|---|---|---|
| Seller (S) | *(generated, e.g.* `S3865`*)* | `seller@demo.tradebridge.tn` | `Demo@12345` |
| Supplier (P) | *(generated, e.g.* `P9224`*)* | `supplier@demo.tradebridge.tn` | `Demo@12345` |
| Agent (A) | *(generated, e.g.* `A8675`*)* | `agent@demo.tradebridge.tn` | `Demo@12345` |
| Manager (M) | *(generated, e.g.* `M5257`*)* | `manager@demo.tradebridge.tn` | `Demo@12345` |
| Admin (D) | *(generated, e.g.* `D9258`*)* | `admin@demo.tradebridge.tn` | `Demo@12345` |

> Usernames are auto-generated server-side (`<role letter><4 random digits>`, e.g. `S4821`) and will be **different every time you run the seed script fresh** — that's intentional, per the platform spec. You can log in with either the **email** or the **generated username** shown in your terminal output after seeding; both work. The login form's placeholder shows the exact format (`S4821 / seller@example.com`).
>
> To see the exact usernames generated on your machine, just read the seed script's console output — it prints a full credentials table at the end, e.g.:
> ```
> role=admin     username=D9258  email=admin@demo.tradebridge.tn        password=Demo@12345
> role=manager   username=M5257  email=manager@demo.tradebridge.tn      password=Demo@12345
> role=agent     username=A8675  email=agent@demo.tradebridge.tn        password=Demo@12345
> role=seller    username=S3865  email=seller@demo.tradebridge.tn       password=Demo@12345
> role=supplier  username=P9224  email=supplier@demo.tradebridge.tn     password=Demo@12345
> ```

After logging in as any role, you land on `/dashboard`, which shows a role-specific sidebar (items beyond "Dashboard" are labeled "soon" — those are the Phase 2+ pages not built yet) and mock KPI cards appropriate to that role, with your real username/role shown in the top bar.

---

## 5. Testing the full registration flow (not just the seeded demo users)

1. Go to `/register` → choose **Seller** or **Supplier**.
2. Fill the form (CIN number, email, phone, password, etc. — company/fiscal number are optional; suppliers additionally need a depot name/address).
3. Submit → you land on a "pending review" page showing your new auto-generated username.
4. Since the agent-side "approve this account" screen is Phase 2+ (not built yet), activate it yourself via the dev-only helper endpoint:
   ```bash
   curl -X POST http://localhost:8000/auth/dev/force-activate \
     -H "Content-Type: application/json" \
     -d '{"username_or_email":"YOUR_NEW_USERNAME_OR_EMAIL"}'
   ```
5. Now log in with that account at `/login`.

## 6. Testing OTP (dev mode — no real SMS provider configured yet)

Every phase's build prompt uses the same rule: OTP codes are logged to the **backend terminal** and also returned in the API response when `ENV=development` (see `apps/api/.env`), since no SMS provider credentials exist yet. Example:

```bash
curl -X POST "http://localhost:8000/auth/otp/request/S3865" \
  -H "Content-Type: application/json" -d '{"purpose":"withdrawal"}'
# → {"message":"OTP sent (dev mode: logged to server console).","expires_in_seconds":300,"dev_code":"980803"}
```

---

## 7. What you can and can't click through right now

| Works today | Not built yet (Phase 2+) |
|---|---|
| Landing page, About/Pricing copy on the home page | Product catalog, orders, wallet, chat, wholesale, scanning, tickets, white-label store, all admin CRUD screens |
| Register (Seller/Supplier), pending-review page | Agent-side account approval UI (use the `dev/force-activate` curl command above instead) |
| Login (username or email), JWT session persisted in the browser | — |
| 3 languages (Arabic RTL / French / English) with a working switcher | — |
| Light / Dark / Auto theme, auto tracks OS preference | — |
| Role-aware dashboard shell + mock KPI cards for all 5 roles | Real KPI data (depends on modules not built yet) |

If you want the rest built, the next step is to paste `docs/CURSOR_BUILD_PROMPT_PHASE2.md` into a Cursor agent working on this branch/codebase, then continue through Phases 3-10 in order.
