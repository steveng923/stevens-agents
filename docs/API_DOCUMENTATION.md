# Architecture

## Current Stage 2 structure

- `src/`: React + TypeScript single-page application built with Vite.
- `src/App.tsx`: responsive command-center dashboard, task management, and Alfred chat view.
- `src/styles.css`: dark navy, charcoal, gold-accent visual system.
- `backend/app/main.py`: FastAPI service with local SQLite persistence, seeded agent profiles, provider abstraction, chat, and memory endpoints.
- `backend/tests/`: API tests for the Stage 2 foundation.

The UI is intentionally server-backed. The local FastAPI service exposes `GET /api/agents`, `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/{id}`, `POST /api/chat`, and `GET /api/memory` so that the app remains structured around real data. The app is not yet authenticated and should only be used in a local development environment.

## Provider strategy

Providers are intentionally abstracted behind the backend. The current default is a safe `mock-local` provider, which generates deterministic guidance without external calls. This keeps the system free and local while preserving a clean place to add Ollama or an API-backed provider later.

## Trust boundaries and current limitations

The current app is a local, single-user prototype. SQLite rows do not yet have user ownership or permissions, and no real external integrations are connected. The system must remain local-only until proper authentication, access controls, and provider credential management are implemented.
