# Security

## Current status

This repository contains no committed secrets and needs no credentials to run Stage 1. The API is unauthenticated and stores tasks in a local SQLite database. It is strictly for local development; do not make it internet-accessible or use it for sensitive personal information. CORS settings only limit browser origins and do not provide access control.

## Required before real personal data or deployment

- Implement authentication, secure session/cookie handling, account recovery, and authorization checks.
- Scope every personal record to the authenticated user; apply PostgreSQL row-level policies if Supabase is selected.
- Store provider secrets only in backend environment variables or a managed secret store. Never put keys in `VITE_*` variables or client bundles.
- Add CSRF protection as appropriate, input/rate limiting, security headers, audit logs, backups, retention/deletion, and dependency/security scanning.
- Require user confirmation for external communications, deletions, and sensitive calendar changes. Do not implement financial transaction execution.
- Test READ, SUGGEST, and EXECUTE permissions; default to least privilege.

No Google, email, AI, or sports provider integration is connected at this stage.
