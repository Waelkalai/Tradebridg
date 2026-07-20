# Tradebridg

Multi-vendor Cash on Delivery (COD) e-commerce platform for Tunisia.

## Monorepo structure

```
/
├── backend/     # FastAPI + SQLAlchemy 2.0 (async) + Pydantic v2
├── frontend/    # Next.js (App Router) + TypeScript + Tailwind
└── shared/      # Shared types and constants
```

## Roles

| Prefix | Role     |
|--------|----------|
| S      | Seller   |
| P      | Supplier / Shipper |
| A      | Agent    |
| M      | Manager  |
| D      | Admin    |

Usernames are auto-generated as `Prefix + 4 digits` (e.g. `S8492`).

## Getting started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

API docs: http://localhost:8000/docs  
App: http://localhost:3000
