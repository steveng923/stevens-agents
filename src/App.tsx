from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

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

PROVIDER_CONFIG = {
    "mock": {"name": "Local mock provider", "status": "ready", "description": "Safe, deterministic local assistant for development."},
    "ollama": {"name": "Ollama (optional)", "status": "disabled", "description": "Connect a local Ollama model when installed on the machine."},
}


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
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                model TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS memory_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'preferences',
                source TEXT NOT NULL DEFAULT 'user',
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


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: int | None = None
    agent: str = "Alfred"


class MemoryCreate(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=500)
    category: str = "preferences"
    source: str = "user"


class MemoryEntryResponse(BaseModel):
    id: int
    key: str
    value: str
    category: str
    source: str
    created_at: str


def task_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": row["id"], "title": row["title"], "completed": bool(row["completed"]), "created_at": row["created_at"]}


def message_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "conversation_id": row["conversation_id"],
        "role": row["role"],
        "content": row["content"],
        "model": row["model"],
        "created_at": row["created_at"],
    }


def memory_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "key": row["key"],
        "value": row["value"],
        "category": row["category"],
        "source": row["source"],
        "created_at": row["created_at"],
    }


def build_agent_response(message: str, agent_name: str) -> str:
    lower_message = message.lower()
    if "focus" in lower_message or "today" in lower_message or "priority" in lower_message:
        return (
            f"{agent_name} says: start with the highest-impact task, protect your time blocks, and then review the next deadline. "
            "If you want, I can turn that into a tight action plan or organize your day around your goals."
        )
    if "goal" in lower_message or "habit" in lower_message or "progress" in lower_message:
        return (
            f"{agent_name} recommends choosing one measurable goal, checking your current momentum, and making the next action specific and realistic. "
            "Steady progress is more valuable than a perfect plan."
        )
    if "schedule" in lower_message or "calendar" in lower_message:
        return (
            f"{agent_name} can help you find space for the important work before routine tasks fill the day. "
            "Keep the must-do items visible and build in recovery time."
        )
    return (
        f"{agent_name} is ready to help. Clarify the priority, the time available, and the expected outcome, and I can turn that into a clear next step."
    )


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


@app.get("/api/providers")
def list_providers() -> list[dict[str, str]]:
    return [{"id": key, **value} for key, value in PROVIDER_CONFIG.items()]


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


@app.get("/api/conversations")
def list_conversations() -> list[dict[str, Any]]:
    with database() as connection:
        rows = connection.execute(
            "SELECT c.id, c.title, c.created_at, COUNT(m.id) AS message_count FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id GROUP BY c.id, c.title, c.created_at ORDER BY c.created_at DESC"
        ).fetchall()
    return [
        {"id": row["id"], "title": row["title"], "created_at": row["created_at"], "message_count": row["message_count"]}
        for row in rows
    ]


@app.post("/api/conversations", status_code=201)
def create_conversation(payload: dict[str, str] | None = None) -> dict[str, Any]:
    title = (payload or {}).get("title", "New conversation")
    trimmed_title = title.strip() or "New conversation"
    with database() as connection:
        cursor = connection.execute("INSERT INTO conversations (title, created_at) VALUES (?, ?)", (trimmed_title[:80], utc_now()))
        row = connection.execute("SELECT id, title, created_at FROM conversations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return {"id": row["id"], "title": row["title"], "created_at": row["created_at"]}


@app.get("/api/conversations/{conversation_id}/messages")
def list_messages(conversation_id: int) -> list[dict[str, Any]]:
    with database() as connection:
        exists = connection.execute("SELECT 1 FROM conversations WHERE id = ?", (conversation_id,)).fetchone()
        if exists is None:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        rows = connection.execute(
            "SELECT id, conversation_id, role, content, model, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            (conversation_id,),
        ).fetchall()
    return [message_dict(row) for row in rows]


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict[str, Any]:
    cleaned_message = payload.message.strip()
    if not cleaned_message:
        raise HTTPException(status_code=422, detail="Message cannot be blank.")

    conversation_id = payload.conversation_id
    if conversation_id is None:
        with database() as connection:
            cursor = connection.execute(
                "INSERT INTO conversations (title, created_at) VALUES (?, ?)",
                (cleaned_message[:80], utc_now()),
            )
            conversation_id = cursor.lastrowid

    model_name = "mock-local"
    response_text = build_agent_response(cleaned_message, payload.agent)

    with database() as connection:
        connection.execute(
            "INSERT INTO messages (conversation_id, role, content, model, created_at) VALUES (?, 'user', ?, ?, ?)",
            (conversation_id, cleaned_message, model_name, utc_now()),
        )
        connection.execute(
            "INSERT INTO messages (conversation_id, role, content, model, created_at) VALUES (?, 'assistant', ?, ?, ?)",
            (conversation_id, response_text, model_name, utc_now()),
        )

    return {
        "conversation_id": conversation_id,
        "agent": payload.agent,
        "model": model_name,
        "reply": response_text,
        "user_message": cleaned_message,
    }


@app.get("/api/memory")
def list_memory() -> list[dict[str, Any]]:
    with database() as connection:
        rows = connection.execute(
            "SELECT id, key, value, category, source, created_at FROM memory_entries ORDER BY created_at DESC"
        ).fetchall()
    return [memory_dict(row) for row in rows]


@app.post("/api/memory", status_code=201)
def create_memory(payload: MemoryCreate) -> dict[str, Any]:
    key = payload.key.strip()
    value = payload.value.strip()
    if not key or not value:
        raise HTTPException(status_code=422, detail="Key and value are required.")
    with database() as connection:
        cursor = connection.execute(
            "INSERT INTO memory_entries (key, value, category, source, created_at) VALUES (?, ?, ?, ?, ?)",
            (key, value, payload.category, payload.source, utc_now()),
        )
        row = connection.execute(
            "SELECT id, key, value, category, source, created_at FROM memory_entries WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return memory_dict(row)
