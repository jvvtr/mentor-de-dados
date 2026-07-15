"""Política AST restritiva para o laboratório educacional.

Este módulo usa apenas a biblioteca padrão para poder ser testado sem baixar
Pyodide, SQLFrame ou SQLGlot. A política deliberadamente aceita somente o
subconjunto de Python necessário às atividades da trilha.
"""

from __future__ import annotations

import ast
import re
from dataclasses import dataclass
from typing import Any


MAX_SOURCE_CHARS = 20_000
MAX_AST_NODES = 1_200
MAX_LITERAL_ITEMS = 600
MAX_STRING_CHARS = 12_000


@dataclass
class PolicyViolation(Exception):
    code: str
    message: str
    line: int | None = None
    column: int | None = None
    hint: str | None = None

    def __str__(self) -> str:
        return self.message


ALLOWED_IMPORTS: dict[str, set[str]] = {
    "pyspark.sql": {"Window", "functions", "SparkSession", "Row"},
    "pyspark.sql.functions": {"broadcast"},
    "pyspark.sql.window": {"Window"},
}

ALLOWED_FREE_CALLS = {
    "broadcast",
    "float",
    "int",
    "len",
    "max",
    "min",
    "print",
    "round",
    "str",
    "sum",
}

ALLOWED_METHOD_CALLS = {
    "agg",
    "alias",
    "asc",
    "asc_nulls_first",
    "asc_nulls_last",
    "avg",
    "broadcast",
    "cache",
    "cast",
    "coalesce",
    "col",
    "collect",
    "count",
    "countDistinct",
    "createDataFrame",
    "createOrReplaceTempView",
    "csv",
    "date_trunc",
    "dense_rank",
    "desc",
    "desc_nulls_first",
    "desc_nulls_last",
    "drop",
    "explain",
    "fillna",
    "filter",
    "format",
    "groupBy",
    "isNotNull",
    "isNull",
    "isin",
    "join",
    "lit",
    "mode",
    "option",
    "orderBy",
    "otherwise",
    "over",
    "parquet",
    "partitionBy",
    "persist",
    "printSchema",
    "range",
    "repartition",
    "row_number",
    "schema",
    "saveAsTable",
    "select",
    "show",
    "spark_partition_id",
    "sql",
    "sum",
    "table",
    "to_date",
    "to_timestamp",
    "trim",
    "unpersist",
    "upper",
    "when",
    "where",
    "withColumn",
    "withColumnRenamed",
}

FORBIDDEN_NAMES = {
    "__builtins__",
    "__import__",
    "breakpoint",
    "compile",
    "delattr",
    "dir",
    "eval",
    "exec",
    "getattr",
    "globals",
    "help",
    "input",
    "locals",
    "open",
    "setattr",
    "vars",
}

RESERVED_ASSIGNMENTS = {"spark", "F", "Window", "broadcast"}

ALLOWED_NODE_TYPES = (
    ast.Module,
    ast.ImportFrom,
    ast.alias,
    ast.Assign,
    ast.Expr,
    ast.Name,
    ast.Load,
    ast.Store,
    ast.Call,
    ast.Attribute,
    ast.Constant,
    ast.List,
    ast.Tuple,
    ast.Dict,
    ast.keyword,
    ast.BinOp,
    ast.UnaryOp,
    ast.Compare,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Mod,
    ast.BitAnd,
    ast.BitOr,
    ast.Invert,
    ast.USub,
    ast.UAdd,
    ast.Eq,
    ast.NotEq,
    ast.Lt,
    ast.LtE,
    ast.Gt,
    ast.GtE,
    ast.Is,
    ast.IsNot,
    ast.In,
    ast.NotIn,
)


def _location(node: ast.AST) -> tuple[int | None, int | None]:
    line = getattr(node, "lineno", None)
    offset = getattr(node, "col_offset", None)
    return line, (offset + 1) if isinstance(offset, int) else None


class _PolicyVisitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.node_count = 0
        self.literal_items = 0
        self.assigned_names: list[str] = []
        self.assigned_values: dict[str, ast.AST] = {}
        self.called_methods: list[str] = []

    def generic_visit(self, node: ast.AST) -> Any:
        self.node_count += 1
        if self.node_count > MAX_AST_NODES:
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-002",
                "O código ultrapassa o limite de complexidade deste laboratório.",
                line,
                column,
                "Divida a solução em menos transformações ou execute-a em um ambiente Spark real.",
            )
        if not isinstance(node, ALLOWED_NODE_TYPES):
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-001",
                f"A construção Python '{type(node).__name__}' não é permitida no laboratório.",
                line,
                column,
                "Use atribuições e chamadas da API de DataFrames; loops, funções e classes ficam para o ambiente Spark real.",
            )
        return super().generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> Any:
        allowed = ALLOWED_IMPORTS.get(node.module or "")
        if allowed is None or any(item.name not in allowed for item in node.names):
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-003",
                "Somente imports educacionais de pyspark.sql são permitidos.",
                line,
                column,
                "Use 'from pyspark.sql import functions as F, Window'.",
            )
        return self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> Any:
        for target in node.targets:
            if not isinstance(target, ast.Name):
                line, column = _location(target)
                raise PolicyViolation(
                    "E-POLICY-004",
                    "Atribua o resultado a um nome simples.",
                    line,
                    column,
                    "Exemplo: resultado = pedidos.filter(...)",
                )
            if target.id in RESERVED_ASSIGNMENTS or target.id.startswith("_"):
                line, column = _location(target)
                raise PolicyViolation(
                    "E-POLICY-005",
                    f"O nome '{target.id}' é reservado pelo laboratório.",
                    line,
                    column,
                )
            self.assigned_names.append(target.id)
            self.assigned_values[target.id] = node.value
        return self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> Any:
        if node.id in FORBIDDEN_NAMES or node.id.startswith("__"):
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-006",
                f"O nome '{node.id}' não pode ser usado no laboratório.",
                line,
                column,
            )
        if re.fullmatch(r"_{3,}", node.id):
            line, column = _location(node)
            raise PolicyViolation(
                "E-PLACEHOLDER-001",
                "Ainda há um espaço em branco do exercício para preencher.",
                line,
                column,
                "Substitua os sublinhados por colunas, valores ou métodos válidos.",
            )
        return self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute) -> Any:
        if node.attr.startswith("_"):
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-007",
                "Atributos internos não podem ser acessados.",
                line,
                column,
            )
        return self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> Any:
        if isinstance(node.func, ast.Name):
            if node.func.id not in ALLOWED_FREE_CALLS:
                line, column = _location(node)
                raise PolicyViolation(
                    "E-API-001",
                    f"A função '{node.func.id}' não faz parte do subconjunto educacional.",
                    line,
                    column,
                )
        elif isinstance(node.func, ast.Attribute):
            if node.func.attr not in ALLOWED_METHOD_CALLS:
                line, column = _location(node)
                raise PolicyViolation(
                    "E-API-001",
                    f"O método '{node.func.attr}' ainda não é suportado pelo laboratório.",
                    line,
                    column,
                    "Consulte a matriz de compatibilidade ou execute este trecho no PySpark real.",
                )
            self.called_methods.append(node.func.attr)
        else:
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-008",
                "Esta forma de chamada dinâmica não é permitida.",
                line,
                column,
            )
        return self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> Any:
        if isinstance(node.op, ast.Mult):
            if self._resolves_to_sequence(node.left) or self._resolves_to_sequence(node.right):
                line, column = _location(node)
                raise PolicyViolation(
                    "E-POLICY-011",
                    "A repetição de strings ou listas foi bloqueada para proteger a memória do navegador.",
                    line,
                    column,
                )
        return self.generic_visit(node)

    def _resolves_to_sequence(self, node: ast.AST, seen: set[str] | None = None) -> bool:
        """Reconhece sequências mesmo quando passam por variáveis simples.

        A política é deliberadamente conservadora: repetição de strings/listas
        não é necessária em nenhum exercício e pode alocar muita memória antes
        que o timeout do Worker consiga reiniciar o runtime.
        """
        if isinstance(node, (ast.List, ast.Tuple)):
            return True
        if isinstance(node, ast.Constant) and isinstance(node.value, (str, bytes)):
            return True
        if isinstance(node, ast.Name):
            visited = set() if seen is None else set(seen)
            if node.id in visited:
                return False
            visited.add(node.id)
            assigned = self.assigned_values.get(node.id)
            return assigned is not None and self._resolves_to_sequence(assigned, visited)
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            return self._resolves_to_sequence(node.left, seen) or self._resolves_to_sequence(node.right, seen)
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "str":
                return True
            if isinstance(node.func, ast.Attribute):
                return self._resolves_to_sequence(node.func.value, seen)
        return False

    def visit_Constant(self, node: ast.Constant) -> Any:
        if node.value is Ellipsis:
            line, column = _location(node)
            raise PolicyViolation(
                "E-PLACEHOLDER-001",
                "Substitua '...' pela solução antes de analisar.",
                line,
                column,
            )
        if isinstance(node.value, str) and len(node.value) > MAX_STRING_CHARS:
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-009",
                "Uma string ultrapassa o limite aceito pelo laboratório.",
                line,
                column,
            )
        if isinstance(node.value, int) and not isinstance(node.value, bool) and abs(node.value) > 1_000_000_000:
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-012",
                "Um número literal ultrapassa o limite do laboratório.",
                line,
                column,
            )
        return self.generic_visit(node)

    def visit_List(self, node: ast.List) -> Any:
        self._count_literal_items(len(node.elts), node)
        return self.generic_visit(node)

    def visit_Tuple(self, node: ast.Tuple) -> Any:
        self._count_literal_items(len(node.elts), node)
        return self.generic_visit(node)

    def visit_Dict(self, node: ast.Dict) -> Any:
        self._count_literal_items(len(node.keys), node)
        return self.generic_visit(node)

    def _count_literal_items(self, amount: int, node: ast.AST) -> None:
        self.literal_items += amount
        if self.literal_items > MAX_LITERAL_ITEMS:
            line, column = _location(node)
            raise PolicyViolation(
                "E-POLICY-010",
                "Há dados literais demais para o laboratório no navegador.",
                line,
                column,
                "Use as tabelas de exemplo ou um arquivo pequeno.",
            )


def validate_python_source(source: str) -> dict[str, Any]:
    if not isinstance(source, str) or not source.strip():
        raise PolicyViolation("E-PY-000", "Digite algum código antes de analisar.", 1, 1)
    if len(source) > MAX_SOURCE_CHARS:
        raise PolicyViolation(
            "E-POLICY-002",
            f"O código excede o limite de {MAX_SOURCE_CHARS} caracteres.",
            1,
            1,
        )
    if re.search(r"#\s*(?:complete|preencha)\b", source, flags=re.IGNORECASE):
        raise PolicyViolation(
            "E-PLACEHOLDER-001",
            "O rascunho ainda contém uma instrução para completar.",
            1,
            1,
        )
    try:
        tree = ast.parse(source, filename="<estudante>", mode="exec")
    except SyntaxError as exc:
        raise PolicyViolation(
            "E-PY-001",
            exc.msg or "Sintaxe Python inválida.",
            exc.lineno,
            exc.offset,
            "Confira parênteses, aspas, vírgulas e a indentação.",
        ) from exc

    visitor = _PolicyVisitor()
    visitor.visit(tree)
    return {
        "tree": tree,
        "assignedNames": visitor.assigned_names,
        "calledMethods": visitor.called_methods,
        "nodeCount": visitor.node_count,
    }
