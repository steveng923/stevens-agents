# API documentation — Stage 2

Base URL in local development: `http://localhost:8000`. Vite forwards browser `/api/*` requests to this service.

## `GET /api/health`
Returns `{ "status": "ok", "service": "stevens-agents-api" }`.

## `GET /api/providers`
Returns the currently available local/stub providers.

## `GET /api/agents`
Returns seeded profile objects: `id`, `name`, `department`, `purpose`.

## `GET /api/tasks`
Returns local tasks ordered with open tasks first.

## `POST /api/tasks`
Creates a task. JSON body: `{ "title": "Review syllabus" }`. Returns the created task.

## `PATCH /api/tasks/{task_id}`
Changes completion status. JSON body: `{ "completed": true }`.

## `GET /api/conversations`
Returns prior chat sessions.

## `POST /api/conversations`
Creates a new conversation object.

## `GET /api/conversations/{conversation_id}/messages`
Returns the messages for a given conversation.

## `POST /api/chat`
Sends a user message to Alfred and returns the assistant reply. JSON body: `{ "message": "What should I focus on today?", "conversation_id": 1, "agent": "Alfred" }`.

## `GET /api/memory`
Returns saved preferences and context entries.

## `POST /api/memory`
Saves a memory entry. JSON body: `{ "key": "focus", "value": "Prioritize the highest-value task", "category": "goals", "source": "user" }`.

FastAPI validates request bodies and publishes the OpenAPI UI at `/docs`.
