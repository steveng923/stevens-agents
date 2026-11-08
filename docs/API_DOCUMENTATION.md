# API documentation — Stage 1

Base URL in local development: `http://localhost:8000`. Vite forwards browser `/api/*` requests to this service.

## `GET /api/health`
Returns `{ "status": "ok", "service": "stevens-agents-api" }`.

## `GET /api/agents`
Returns seeded profile objects: `id`, `name`, `department`, `purpose`. Profiles are starter data, not autonomous AI agents.

## `GET /api/tasks`
Returns local tasks ordered with open tasks first. Each object contains `id`, `title`, `completed`, and `created_at`.

## `POST /api/tasks`
Creates a task. JSON body: `{ "title": "Review syllabus" }`. Title must contain 1–200 characters after trimming. Returns the created task with HTTP 201.

## `PATCH /api/tasks/{task_id}`
Changes completion status. JSON body: `{ "completed": true }`. Returns updated task or HTTP 404 if missing.

FastAPI validates request bodies and publishes the local OpenAPI UI at `/docs`. There is currently no authentication, authorization, rate limiting, per-user access control, or production API hardening.
