import os
import tempfile
import unittest
from pathlib import Path


class ApiDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["STEVENS_AGENTS_DB"] = str(Path(self.temp_dir.name) / "test.db")
        from app import main
        main.DB_PATH = Path(os.environ["STEVENS_AGENTS_DB"])
        main.initialize_database()
        self.api = main

    def tearDown(self):
        self.temp_dir.cleanup()
        os.environ.pop("STEVENS_AGENTS_DB", None)

    def test_seeded_agents_and_task_lifecycle(self):
        self.assertEqual(self.api.list_agents()[0]["id"], "alfred")
        task = self.api.create_task(self.api.TaskCreate(title="Review syllabus"))
        self.assertEqual(task["title"], "Review syllabus")
        updated = self.api.update_task(task["id"], self.api.TaskUpdate(completed=True))
        self.assertTrue(updated["completed"])

    def test_not_found_task_returns_404(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as error:
            self.api.update_task(999, self.api.TaskUpdate(completed=True))
        self.assertEqual(error.exception.status_code, 404)

    def test_blank_task_rejected(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            self.api.create_task(self.api.TaskCreate(title="  "))

    def test_chat_persists_conversation_and_messages(self):
        response = self.api.chat(self.api.ChatRequest(message="What should I focus on today?"))
        self.assertIn("no open tasks", response["reply"].lower())
        self.assertEqual(len(self.api.list_conversations()), 1)
        messages = self.api.list_messages(response["conversation_id"])
        self.assertEqual([message["role"] for message in messages], ["user", "assistant"])

    def test_memory_create_delete(self):
        entry = self.api.create_memory(self.api.MemoryCreate(key="Focus", value="Study in the morning"))
        self.assertEqual(self.api.list_memory()[0]["id"], entry["id"])
        self.api.delete_memory(entry["id"])
        self.assertEqual(self.api.list_memory(), [])


if __name__ == "__main__":
    unittest.main()
