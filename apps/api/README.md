# TradeBridge — API (FastAPI)

Backend for the TradeBridge platform. See the root [`RUNNING_LOCALLY.md`](../../RUNNING_LOCALLY.md) for full setup/run instructions and demo login credentials.

Quick start (after PostgreSQL is running — see root docs):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API docs: http://localhost:8000/docs
