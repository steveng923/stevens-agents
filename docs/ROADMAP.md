# Roadmap

## Stage 1 — Existing project and foundation
- [x] Inspect repository (minimal README only; no existing implementation to preserve).
- [x] Establish React + TypeScript + Vite frontend and FastAPI + SQLite local backend.
- [x] Build responsive dashboard and functional task create/complete flow.
- [x] Seed initial agent profiles and expose them in the command center.
- [x] Add project architecture, schema, API, security, test, and deployment documentation.
- [ ] Install dependencies, run tests/type checks/build, and fix issues (not run in this environment).
- [ ] Add robust authentication, user scoping, and migrations before handling personal data.

## Stage 2 — Alfred
- [ ] Provider-neutral AI service with free/local provider options and server-only credentials.
- [ ] Chat conversations and messages persisted in the database.
- [ ] Explicit, user-controlled memory with source and deletion/export controls.
- [ ] Agent profiles, tool permissions, execution history, and bounded orchestration.
- [ ] Tests for provider failures, memory retrieval, and READ/SUGGEST/EXECUTE controls.

## Stage 3 — Productivity
- [ ] Authenticated Google Calendar OAuth, ICS preview/import, timezone-aware events.
- [ ] Tasks, projects, goals, recurrence, notifications, and approval checkpoints.

## Stage 4 — Education and career
- [ ] Courses, assignments, exams, study tools, document/syllabus extraction with verification.
- [ ] Resume and internship/application tracking.

## Stage 5 — The Arena
- [ ] Licensed/reliable provider adapters for soccer, MMA, and basketball, favorites, freshness/source labels.
- [ ] Never substitute generated values for unavailable live data.

## Stage 6 — Fitness
- [ ] Exercise library, routines, workout logging, history, progress, and recovery-aware suggestions.

## Stage 7 — Advanced departments
- [ ] Approval-gated email tools, document archive, manual finance, travel, contacts, meals, entertainment, and research.

## Stage 8 — Automation and advanced AI
- [ ] Trigger/condition/action workflow system, approvals, retries, audit history, and expanded memory/voice options.

## Stage 9 — Final quality
- [ ] Security and privacy review, full automated test coverage, performance, accessibility, mobile polish, and deployment verification.

Stages beyond Stage 1 are not implemented. External connections require real provider credentials and explicit authorization.
