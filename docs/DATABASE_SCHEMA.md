# Database schema — Stage 1

SQLite schema is initialized by `backend/app/main.py` on service startup. The database file is local and Git-ignored.

## `agents`
| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | Primary key, stable agent slug |
| `name` | TEXT | Required |
| `department` | TEXT | Required |
| `purpose` | TEXT | Required |

## `tasks`
| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | Autoincrement primary key |
| `title` | TEXT | Required, 1–200 characters |
| `completed` | INTEGER | Required boolean check, defaults to 0 |
| `created_at` | TEXT | Required UTC ISO-8601 timestamp |

## Migration plan / not yet present
The initial database bootstrap uses idempotent `CREATE TABLE IF NOT EXISTS`; this is not a versioned migration system. Before deploying or storing private data, add a migration framework and authenticated users, ownership foreign keys, indexes, backups, and access policies. Planned future entities include projects, goals, calendar events, conversations, messages, memories, documents, notifications, automations, agent executions, sports preferences/data, workouts, contacts, financial records, and integrations. These are not created yet.
