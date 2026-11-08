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

`backend/tests/test_api.py` covers seeded agent retrieval, persistent task create/update, missing-task handling, and blank-title rejection. Tests use an isolated temporary SQLite file.

## Not yet covered

Frontend/component tests, authentication, user permissions, AI conversations, memory, calendar/timezones/ICS, sports provider errors, document processing, workout calculations, and automation execution are not implemented because those features do not exist yet.

The commands above are documented but have not been executed in this environment; check `PROJECT_STATUS.md` for the verification status.
