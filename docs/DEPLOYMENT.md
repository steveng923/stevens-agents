# Deployment

## Current status

Stage 1 is intended for local development only. It has not been built or deployed from this environment. Do not expose the unauthenticated API to the public internet or enter sensitive information.

## Local development

Use the root `README.md` for setup. Run the Vite frontend and FastAPI backend as separate local processes. SQLite data is stored in the ignored `backend/data/` directory.

## Before any hosted deployment

1. Complete authentication, per-user authorization, migrations, data protection, and security review.
2. Select a hosted database and configure backups and recovery.
3. Configure HTTPS and a managed secrets store for server-side integrations.
4. Restrict CORS to the actual frontend origin and add rate limits/monitoring.
5. Run all checks and verify production builds in CI.
6. Configure only integrations for which the owner has supplied credentials and approved the requested scopes.

Deployment targets and providers are intentionally not selected yet; no live service or account was supplied.
