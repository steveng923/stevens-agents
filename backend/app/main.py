from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("STEVENS_AGENTS_DB", BASE_DIR / "data" / "stevens_agents.db"))

AGENTS = [
    {"id": "alfred", "name": "Alfred", "department": "Personal management", "purpose": "Central assistant and chief of staff"},
    {"id": "atlas", "name": "Atlas", "department": "Personal management", "purpose": "Calendar and scheduling"},
    {"id": "echo", "name": "Echo", "department": "Personal management", "purpose": "Tasks and projects"},
    {"id": "scholar", "name": "Scholar", "department": "Education and career", "purpose": "College, assignments, exams, and studying"},
    {"id": "forge", "name": "Forge", "department": "Sports and fitness", "purpose": "Gym and strength training"},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def initialize_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                purpose TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
                completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
                created_at TEXT NOT NULL
            );
        """)
        connection.executemany(
            "INSERT OR IGNORE INTO agents (id, name, department, purpose) VALUES (?, ?, ?, ?)",
            [(agent["id"], agent["name"], agent["department"], agent["purpose"]) for agent in AGENTS],
        )


@contextmanager
def database() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskUpdate(BaseModel):
    completed: bool


def task_dict(row: sqlite3.Row) -> dict:
    return {"id": row["id"], "title": row["title"], "completed": bool(row["completed"]), "created_at": row["created_at"]}


app = FastAPI(title="Steven's Agents API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "stevens-agents-api"}


@app.get("/api/agents")
def list_agents() -> list[dict]:
    with database() as connection:
        rows = connection.execute("SELECT id, name, department, purpose FROM agents ORDER BY rowid").fetchall()
    return [dict(row) for row in rows]


@app.get("/api/tasks")
def list_tasks() -> list[dict]:
    with database() as connection:
        rows = connection.execute("SELECT id, title, completed, created_at FROM tasks ORDER BY completed ASC, id DESC").fetchall()
    return [task_dict(row) for row in rows]


@app.post("/api/tasks", status_code=201)
def create_task(payload: TaskCreate) -> dict:
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Task title cannot be blank.")
    with database() as connection:
        cursor = connection.execute("INSERT INTO tasks (title, created_at) VALUES (?, ?)", (title, utc_now()))
        row = connection.execute("SELECT id, title, completed, created_at FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return task_dict(row)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, response: Response) -> dict:
    with database() as connection:
        cursor = connection.execute("UPDATE tasks SET completed = ? WHERE id = ?", (int(payload.completed), task_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found.")
        row = connection.execute("SELECT id, title, completed, created_at FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return task_dict(row)
