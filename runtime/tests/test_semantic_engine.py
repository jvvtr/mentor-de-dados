import importlib.util
import json
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


DEPENDENCIES_AVAILABLE = all(
    importlib.util.find_spec(package) is not None
    for package in ("duckdb", "sqlframe", "sqlglot", "pytz")
)


@unittest.skipUnless(DEPENDENCIES_AVAILABLE, "instale runtime/requirements-dev.txt")
class SemanticEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        global semantic_engine
        import semantic_engine

    def run_payload(self, **payload):
        response = semantic_engine.mentor_handle_json(json.dumps({"op": "run", **payload}))
        return json.loads(response)

    def test_pyspark_compiles_executes_and_grades_lesson_tables(self):
        response = self.run_payload(
            lessonId=3,
            mode="pyspark",
            code='''
from pyspark.sql import functions as F
resultado = itens.select(
    "id_produto",
    (F.col("quantidade") * F.col("preco_unitario")).alias("subtotal")
)
''',
            tables=[{
                "name": "itens",
                "columns": ["id_produto", "quantidade", "preco_unitario"],
                "rows": [[10, 2, 7.5], [20, 3, 4]],
            }],
            expected={
                "columns": ["id_produto", "subtotal"],
                "rows": [[10, 15], [20, 12]],
                "ordered": False,
            },
        )
        self.assertEqual(response["status"], "ok")
        self.assertTrue(response["grade"]["passed"])
        self.assertIn("SELECT", response["compiledSql"])
        self.assertFalse(response["runtime"]["isApacheSpark"])

    def test_spark_sql_transpiles_and_executes(self):
        response = self.run_payload(
            lessonId=4,
            mode="sql",
            code="SELECT nome, estado FROM clientes WHERE estado = 'SP' ORDER BY nome",
            tables=[{
                "name": "clientes",
                "columns": ["nome", "estado"],
                "rows": [["Zeca", "SP"], ["Ana", "SP"], ["Bia", "RJ"]],
            }],
            expected={
                "columns": ["nome", "estado"],
                "rows": [["Ana", "SP"], ["Zeca", "SP"]],
                "ordered": True,
            },
        )
        self.assertTrue(response["grade"]["passed"])
        self.assertEqual(response["result"]["rowCount"], 2)

    def test_reports_unknown_column_in_portuguese_protocol(self):
        response = self.run_payload(
            mode="sql",
            code="SELECT inexistente FROM clientes",
            tables=[{"name": "clientes", "columns": ["id"], "rows": [[1]]}],
            expected={"columns": [], "rows": [], "ordered": False},
        )
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["diagnostics"][0]["code"], "E-COL-001")
        self.assertFalse(response["grade"]["passed"])

    def test_grader_normalizes_decimal_and_timezone(self):
        self.assertTrue(semantic_engine._values_equal("25.00", 25))
        self.assertTrue(
            semantic_engine._values_equal(
                "2026-01-01T00:00:00-03:00",
                "2026-01-01 00:00:00",
            )
        )

    def test_duckdb_connection_is_hardened_and_locked(self):
        context = semantic_engine._create_session({"version": "security", "tables": {}, "virtualFiles": {}})
        self.assertEqual(
            context.connection.execute("SELECT current_setting('enable_external_access')").fetchone()[0],
            False,
        )
        self.assertEqual(
            context.connection.execute("SELECT current_setting('lock_configuration')").fetchone()[0],
            True,
        )
        self.assertEqual(
            context.connection.execute("SELECT current_setting('threads')").fetchone()[0],
            1,
        )
        with self.assertRaises(Exception):
            context.connection.execute("SET threads = 2")
        with self.assertRaises(Exception):
            context.connection.execute("SELECT * FROM read_text('../README.md')")

    def test_rejects_external_and_generic_table_functions(self):
        queries = [
            "SELECT * FROM read_text('../README.md')",
            "SELECT * FROM read_blob('../README.md')",
            "SELECT * FROM parquet_scan('https://example.test/data.parquet')",
            "SELECT * FROM read_csv_auto('https://example.test/data.csv')",
            "SELECT * FROM query('SELECT 1')",
            "SELECT * FROM range(3)",
        ]
        for query in queries:
            with self.subTest(query=query):
                response = self.run_payload(mode="sql", code=query, tables=[])
                self.assertEqual(response["status"], "error")
                self.assertEqual(response["diagnostics"][0]["code"], "E-SQL-POLICY-002")

    def test_ddl_is_restricted_to_the_declared_lesson(self):
        blocked = self.run_payload(
            lessonId=1,
            mode="pyspark",
            code='resultado = spark.sql("CREATE TABLE temporaria AS SELECT 1 AS id")',
            tables=[],
        )
        self.assertEqual(blocked["status"], "error")
        self.assertEqual(blocked["diagnostics"][0]["code"], "E-SQL-POLICY-001")

        allowed = self.run_payload(
            lessonId=18,
            mode="sql",
            code="CREATE TABLE temporaria AS SELECT 1 AS id; SELECT id FROM temporaria",
            tables=[],
            expected={"columns": ["id"], "rows": [[1]], "ordered": False},
        )
        self.assertEqual(allowed["status"], "ok")
        self.assertTrue(allowed["grade"]["passed"])

    def test_rejects_oversized_spark_range(self):
        response = self.run_payload(
            lessonId=1,
            mode="pyspark",
            code="resultado = spark.range(10001)",
            tables=[],
        )
        self.assertEqual(response["status"], "error")
        self.assertEqual(response["diagnostics"][0]["code"], "E-POLICY-013")


if __name__ == "__main__":
    unittest.main()
