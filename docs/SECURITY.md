# Testing and quality

## Commands

```bash
npm install
npm run typecheck
npm run build

python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
```

## Current automated tests

`backend/tests/test_api.py` covers seeded agent retrieval, task creation/update, missing-task handling, blank-title rejection, and Alfred chat/memory flow using a temporary SQLite database.

## Not yet covered

Frontend component tests, authentication, user permissions, AI provider integration, sports provider errors, document processing, workout calculations, and automation execution remain future work.

The commands above are documented but not executed in this environment because terminal access is unavailable here.
