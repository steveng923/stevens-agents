from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from fastapi import FastAPI, HTTPException
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
                id TEXT PRIMARY KEY, name TEXT NOT NULL, department TEXT NOT NULL, purpose TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 200),
                completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS memory_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL, value TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'preferences', source TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            );
        """)
        connection.executemany(
            "INSERT OR IGNORE INTO agents (id, name, department, purpose) VALUES (:id, :name, :department, :purpose)",
            AGENTS,
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


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: int | None = None


class MemoryCreate(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=500)
    category: str = Field(default="preferences", max_length=50)
    source: str = Field(default="user", max_length=100)


def task_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": row["id"], "title": row["title"], "completed": bool(row["completed"]), "created_at": row["created_at"]}


def assistant_reply(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ("today", "focus", "priority", "priorities")):
        with database() as connection:
            tasks = connection.execute("SELECT title FROM tasks WHERE completed = 0 ORDER BY id DESC LIMIT 5").fetchall()
        if tasks:
            items = "; ".join(row["title"] for row in tasks)
            return f"Here are your open tasks to consider: {items}. Choose the most time-sensitive one first. This local assistant does not have your calendar connected."
        return "You have no open tasks saved yet. Add your next responsibility, then I can help you choose a first step. I don’t have calendar access in this local build."
    if "memory" in text or "remember" in text:
        return "You control what this workspace remembers. Add preferences in the Memory panel; nothing is inferred or saved automatically."
    return "I’m Alfred, running in local demo mode. I can review your saved tasks and offer simple planning guidance. AI-provider integrations are not connected yet."


app = FastAPI(title="Steven's Agents API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "stevens-agents-api"}


@app.get("/api/agents")
def list_agents() -> list[dict[str, str]]:
    with database() as connection:
        rows = connection.execute("SELECT id, name, department, purpose FROM agents ORDER BY rowid").fetchall()
    return [dict(row) for row in rows]


@app.get("/api/tasks")
def list_tasks() -> list[dict[str, Any]]:
    with database() as connection:
        rows = connection.execute("SELECT id, title, completed, created_at FROM tasks ORDER BY completed, id DESC").fetchall()
    return [task_dict(row) for row in rows]


@app.post("/api/tasks", status_code=201)
def create_task(payload: TaskCreate) -> dict[str, Any]:
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Task title cannot be blank.")
    with database() as connection:
        cursor = connection.execute("INSERT INTO tasks (title, created_at) VALUES (?, ?)", (title, utc_now()))
        row = connection.execute("SELECT id, title, completed, created_at FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return task_dict(row)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate) -> dict[str, Any]:
    with database() as connection:
        cursor = connection.execute("UPDATE tasks SET completed = ? WHERE id = ?", (int(payload.completed), task_id))
        if not cursor.rowcount:
            raise HTTPException(status_code=404, detail="Task not found.")
        row = connection.execute("SELECT id, title, completed, created_at FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return task_dict(row)


@app.get("/api/conversations")
def list_conversations() -> list[dict[str, Any]]:
    with database() as connection:
        rows = connection.execute(
            "SELECT c.id, c.title, c.created_at, COUNT(m.id) AS message_count FROM conversations c "
            "LEFT JOIN messages m ON m.conversation_id = c.id GROUP BY c.id ORDER BY c.id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/conversations/{conversation_id}/messages")
def list_messages(conversation_id: int) -> list[dict[str, Any]]:
    with database() as connection:
        if connection.execute("SELECT 1 FROM conversations WHERE id = ?", (conversation_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        rows = connection.execute(
            "SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id",
            (conversation_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be blank.")
    with database() as connection:
        conversation_id = payload.conversation_id
        if conversation_id is None:
            cursor = connection.execute("INSERT INTO conversations (title, created_at) VALUES (?, ?)", (message[:80], utc_now()))
            conversation_id = cursor.lastrowid
        elif connection.execute("SELECT 1 FROM conversations WHERE id = ?", (conversation_id,)).fetchone() is None:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        reply = assistant_reply(message)
        connection.executemany(
            "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            [(conversation_id, "user", message, utc_now()), (conversation_id, "assistant", reply, utc_now())],
        )
    return {"conversation_id": conversation_id, "reply": reply, "model": "local-rules"}


@app.get("/api/memory")
def list_memory() -> list[dict[str, Any]]:
    with database() as connection:
        rows = connection.execute(
            "SELECT id, key, value, category, source, created_at FROM memory_entries ORDER BY id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/memory", status_code=201)
def create_memory(payload: MemoryCreate) -> dict[str, Any]:
    key, value = payload.key.strip(), payload.value.strip()
    if not key or not value:
        raise HTTPException(status_code=422, detail="Memory key and value cannot be blank.")
    with database() as connection:
        cursor = connection.execute(
            "INSERT INTO memory_entries (key, value, category, source, created_at) VALUES (?, ?, ?, ?, ?)",
            (key, value, payload.category, payload.source, utc_now()),
        )
        row = connection.execute(
            "SELECT id, key, value, category, source, created_at FROM memory_entries WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return dict(row)


@app.delete("/api/memory/{memory_id}", status_code=204)
def delete_memory(memory_id: int) -> None:
    with database() as connection:
        cursor = connection.execute("DELETE FROM memory_entries WHERE id = ?", (memory_id,))
        if not cursor.rowcount:
            raise HTTPException(status_code=404, detail="Memory entry not found.")
