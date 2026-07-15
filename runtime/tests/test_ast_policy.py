import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mentor_ast_policy import PolicyViolation, validate_python_source


class AstPolicyTests(unittest.TestCase):
    def test_accepts_curriculum_subset(self):
        source = '''
from pyspark.sql import functions as F
from pyspark.sql.window import Window

resultado = (
    clientes
    .filter(F.col("id_cliente").isNotNull())
    .withColumnRenamed("nome", "nome_original")
    .select(F.upper(F.trim("nome_original")).alias("nome"))
)
'''
        metadata = validate_python_source(source)
        self.assertIn("resultado", metadata["assignedNames"])
        self.assertIn("withColumnRenamed", metadata["calledMethods"])
        self.assertIn("upper", metadata["calledMethods"])

    def test_accepts_virtual_reader_schema(self):
        metadata = validate_python_source(
            'resultado = spark.read.schema(schema).option("header", True).csv(caminho)'
        )
        self.assertIn("schema", metadata["calledMethods"])

    def test_rejects_loop(self):
        with self.assertRaisesRegex(PolicyViolation, "For"):
            validate_python_source("for item in itens:\n    print(item)")

    def test_rejects_network_import(self):
        with self.assertRaises(PolicyViolation) as raised:
            validate_python_source("import requests")
        self.assertEqual(raised.exception.code, "E-POLICY-001")

    def test_rejects_dunder_escape(self):
        with self.assertRaises(PolicyViolation) as raised:
            validate_python_source("resultado = pedidos.__class__")
        self.assertEqual(raised.exception.code, "E-POLICY-007")

    def test_rejects_placeholder(self):
        with self.assertRaises(PolicyViolation) as raised:
            validate_python_source("resultado = pedidos.select(...)")
        self.assertEqual(raised.exception.code, "E-PLACEHOLDER-001")

    def test_rejects_literal_memory_amplification(self):
        with self.assertRaises(PolicyViolation) as raised:
            validate_python_source('resultado = "x" * 1000000')
        self.assertEqual(raised.exception.code, "E-POLICY-011")

    def test_rejects_memory_amplification_through_variables(self):
        attempts = [
            'n = 1000000000\ns = "x"\nresultado = s * n',
            'n = 1000000000\ns = [1]\nresultado = s * n',
            'n = 1000000000\ns = str(1)\nresultado = s * n',
            'n = 1000000000\ns = "x" + "y"\nresultado = s * n',
        ]
        for source in attempts:
            with self.subTest(source=source):
                with self.assertRaises(PolicyViolation) as raised:
                    validate_python_source(source)
                self.assertEqual(raised.exception.code, "E-POLICY-011")


if __name__ == "__main__":
    unittest.main()
