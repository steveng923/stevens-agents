# Architecture

## Current Stage 1 structure

- `src/`: React + TypeScript single-page application, built with Vite.
- `src/App.tsx`: responsive navigation/dashboard and API-backed task/agent views.
- `src/styles.css`: dark navy, charcoal, gold-accent responsive design system.
- `backend/app/main.py`: FastAPI endpoints and local SQLite persistence using Python's standard `sqlite3` module.
- `backend/data/`: local database location, ignored by Git.
- `backend/tests/`: Python `unittest` coverage for database-backed API functions.

The Vite development server proxies `/api` requests to the local FastAPI service on port 8000. FastAPI serves interactive OpenAPI docs at `/docs`.

## Intended growth path

Keep integrations and AI providers behind server-side service interfaces. Add user authentication and ownership boundaries before personal records, then use migrations and PostgreSQL for multi-user or hosted deployments. Keep externally sourced sports information separate from a user's preferences and notes. Make external or destructive actions approval-gated and auditable.

## Trust boundaries and current limitations

The current API is an unauthenticated, single-user local prototype. SQLite rows do not have user ownership. CORS is restricted to local Vite development origins, but CORS is not authentication. Do not deploy this API publicly or store sensitive data. No AI or third-party integration is connected.
