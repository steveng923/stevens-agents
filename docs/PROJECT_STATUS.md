# Project status

## Current stage: Stage 2 foundation

This branch now contains a React/TypeScript/Vite frontend and FastAPI/SQLite backend. The UI supports local agent profiles, task creation/completion, Alfred local-rule chat with conversation persistence, and user-controlled memory create/list/delete.

### Important limitations
- The assistant is **not an AI model**. It uses simple local rules and is labeled as a local demo.
- There is no authentication or multi-user ownership. Keep the backend local and do not enter sensitive personal data or expose it to the public internet.
- No Google Calendar, email, sports, or other external integration is connected.
- This agent can edit GitHub repository contents, but cannot access your VS Code window or run commands in your computer's terminal from this chat. The changes here were not built or tested in your local VS Code environment.

### Next work
1. Open this repository/branch in VS Code and run the commands in `TESTING.md`.
2. Fix issues found by real tool output, then add a CI workflow.
3. Implement authentication and ownership boundaries before any hosted deployment or sensitive data.
4. Continue with a true provider adapter, user-approved memory retrieval, orchestration, then calendar and other stages.
