import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest


RUNTIME_DIR = Path(__file__).resolve().parents[1]
ROOT = RUNTIME_DIR.parent
sys.path.insert(0, str(RUNTIME_DIR))

DEPENDENCIES_AVAILABLE = all(
    importlib.util.find_spec(package) is not None
    for package in ("duckdb", "sqlframe", "sqlglot", "pytz")
)


def load_lessons():
    script = r"""
const fs = require('fs');
const vm = require('vm');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8'), context);
process.stdout.write(JSON.stringify(context.window.SPARK_MENTOR_DATA.lessons));
"""
    output = subprocess.check_output(
        ["node", "-e", script, str(ROOT / "curriculum.js")],
        text=True,
        encoding="utf-8",
    )
    return json.loads(output)


def infer_type(values):
    non_null = [value for value in values if value is not None]
    if not non_null:
        return "VARCHAR"
    if all(isinstance(value, bool) for value in non_null):
        return "BOOLEAN"
    if all(isinstance(value, int) and not isinstance(value, bool) for value in non_null):
        return "BIGINT"
    if all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in non_null):
        return "DOUBLE"
    return "VARCHAR"


def lesson_fixtures(lesson):
    tables = {}
    for table in lesson.get("tables", []):
        rows = table.get("rows", [])
        schema = {
            column: infer_type([row[index] for row in rows])
            for index, column in enumerate(table.get("columns", []))
        }
        tables[table["name"]] = {"schema": schema, "rows": rows}
    virtual_files = {}
    if "pedidos_arquivo" in tables:
        virtual_files.update({
            "/dados/pedidos.csv": "pedidos_arquivo",
            "pedidos.csv": "pedidos_arquivo",
        })
    return {
        "version": f"lesson-{lesson['id']}-golden",
        "tables": tables,
        "virtualFiles": virtual_files,
    }


@unittest.skipUnless(DEPENDENCIES_AVAILABLE, "instale runtime/requirements-dev.txt")
class CurriculumGoldenSolutionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        global semantic_engine
        import semantic_engine
        cls.lessons = load_lessons()

    def test_all_executable_sql_and_pyspark_solutions(self):
        executed = 0
        for lesson in self.lessons:
            if lesson.get("practiceMode") == "reflection":
                continue
            for mode, field in (("sql", "sqlSolution"), ("pyspark", "solution")):
                expected = (
                    lesson.get("sqlExpected", lesson.get("expected", {}))
                    if mode == "sql"
                    else lesson.get("expected", {})
                )
                payload = {
                    "op": "run",
                    "lessonId": lesson["id"],
                    "mode": mode,
                    "code": lesson[field],
                    "fixtures": lesson_fixtures(lesson),
                    "expected": expected,
                    "resultVariable": lesson.get("assessment", {}).get("entrypoint", "resultado"),
                    "allowDDL": lesson["id"] == 18,
                    "maxRows": 100,
                }
                with self.subTest(lesson=lesson["id"], mode=mode):
                    response = json.loads(
                        semantic_engine.mentor_handle_json(json.dumps(payload))
                    )
                    self.assertEqual(
                        response.get("status"),
                        "ok",
                        response.get("diagnostics"),
                    )
                    self.assertTrue(response.get("grade", {}).get("passed"), response)
                executed += 1
        self.assertEqual(executed, 38)


if __name__ == "__main__":
    unittest.main()
