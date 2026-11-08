# Permission model

This project now includes a simple permission model to reflect how specialized agents should operate under a least-privilege policy.

## Current permission levels

- `read`: Retrieve allowed information. Examples: personal tasks, goals, or calendar data that the user has authorized.
- `suggest`: Prepare recommendations or proposed actions, but wait for explicit approval before destructive or sensitive actions.
- `execute`: Run low-risk actions in-app only, and only after the user has approved the workflow or a prior policy allows it.

## Seeded permissions

The backend seeds a small set of default permissions for the initial agents:

- Alfred: read, suggest, execute
- Atlas: read
- Echo: read
- Forge: suggest

These are intentionally minimal and local-only. They are not a substitute for real authentication, per-user access policies, or approval workflows.

## Future plan

The next stage will add:
- real user accounts and auth
- per-user permission assignments
- approval checkpoints for calendar edits, email sends, and sensitive actions
- execution history and audit logging
- explicit `READ`, `SUGGEST`, and `EXECUTE` enforcement on server-side endpoints

No external account or permission system is connected yet.
