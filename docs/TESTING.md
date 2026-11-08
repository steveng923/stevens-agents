# Testing and quality

Install and run locally from the repository root:

```bash
npm install
npm run typecheck
npm run build

python -m venv .venv
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
```

The Python unit tests cover seeded agent retrieval, task validation and lifecycle, missing task responses, persisted chat, and memory creation/deletion. These tests are present but were not run by the GitHub file-editing environment.

Run backend and frontend together during manual smoke testing:

```bash
uvicorn app.main:app --reload --app-dir backend
npm run dev
```

Open the frontend URL from Vite and verify task add/complete, chat persistence after refresh, and memory save/delete. Current known gap: no browser automation suite, authentication tests, production data access policy, or integration tests.
