# Steven's Agents

Steven's Agents is a personal AI headquarters and productivity command center. This repository is being built in working, documented stages; integrations are only described as connected when they are actually configured.

## Stage 1: foundation

This branch establishes a responsive React + TypeScript dashboard and a small FastAPI + SQLite service. The initial API supports agent profiles and persistent task creation/completion. It is a local-development foundation, not a production-ready personal data service: authentication, hosted database policies, and external integrations are not implemented yet.

### Run locally

Requirements: Node.js 20+ and Python 3.11+.

```bash
# Terminal 1 — backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend

# Terminal 2 — frontend
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173). The API runs at http://localhost:8000; interactive API documentation is at http://localhost:8000/docs. The local SQLite database is created at `backend/data/stevens_agents.db` on first launch.

### Checks

```bash
npm run typecheck
npm run build
python -m unittest discover -s backend/tests -v
```

## Security and integration status

- No API keys or secrets are required or stored in this repository.
- The current service is intended for local development and has no authentication. Do not expose it to the public internet or store sensitive personal information in it.
- Google Calendar, AI providers, sports feeds, email, and other external services are not connected in this stage. Configure credentials only in a future server-side integration, never in frontend code.
- See `docs/` for the project status, architecture, schema, API, security, testing, deployment notes, and roadmap.
