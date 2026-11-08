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

    def test_seeded_agents_are_available(self):
        agents = self.api.list_agents()
        self.assertGreaterEqual(len(agents), 5)
        self.assertEqual(agents[0]["id"], "alfred")

    def test_task_creation_and_completion_persist(self):
        created = self.api.create_task(self.api.TaskCreate(title="Review syllabus"))
        self.assertEqual(created["title"], "Review syllabus")
        self.assertFalse(created["completed"])
        updated = self.api.update_task(created["id"], self.api.TaskUpdate(completed=True), self.api.Response())
        self.assertTrue(updated["completed"])
        self.assertTrue(any(task["id"] == created["id"] and task["completed"] for task in self.api.list_tasks()))

    def test_missing_task_returns_404(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as error:
            self.api.update_task(9999, self.api.TaskUpdate(completed=True), self.api.Response())
        self.assertEqual(error.exception.status_code, 404)

    def test_blank_task_is_rejected(self):
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            self.api.create_task(self.api.TaskCreate(title="   "))


if __name__ == "__main__":
    unittest.main()
