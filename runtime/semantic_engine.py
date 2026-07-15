"""Núcleo semântico do Mentor de Dados.

Executa dentro do Pyodide. SQLFrame compila o subconjunto educacional da API
PySpark, SQLGlot traduz Spark SQL e DuckDB materializa resultados pequenos.
O módulo não é, nem tenta se apresentar como, Apache Spark.
"""

from __future__ import annotations

import ast
import builtins
import contextlib
import datetime as dt
import importlib.metadata
import io
import json
import math
import re
import traceback
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

import duckdb
import sqlglot
from sqlglot import exp
from sqlglot.errors import ErrorLevel, ParseError, UnsupportedError
from sqlframe import activate
from sqlframe.base.session import _BaseSession
from sqlframe.standalone import StandaloneDataFrame, StandaloneSession, Window
from sqlframe.standalone import functions as F

from mentor_ast_policy import PolicyViolation, validate_python_source


ENGINE_NAME = "Laboratório de Semântica Spark"
ENGINE_VERSION = "0.1.0"
MAX_OUTPUT_ROWS = 200
MAX_OUTPUT_COLUMNS = 80
MAX_RANGE_ROWS = 10_000
DUCKDB_SAFE_CONFIG = {
    "enable_external_access": "false",
    "allow_community_extensions": "false",
    "autoinstall_known_extensions": "false",
    "autoload_known_extensions": "false",
    "memory_limit": "256MB",
    "threads": "1",
}


activate(
    "standalone",
    config={
        "sqlframe.input.dialect": "spark",
        "sqlframe.output.dialect": "duckdb",
        "sqlframe.execution.dialect": "duckdb",
    },
)


@dataclass
class RunContext:
    connection: Any
    session: Any
    fixtures: dict[str, Any]
    allow_ddl: bool = False
    actions: list[dict[str, Any]] = field(default_factory=list)
    warnings: list[dict[str, Any]] = field(default_factory=list)
    alias_counter: int = 0

    def warn(self, code: str, message: str, feature: str | None = None) -> None:
        if any(item.get("code") == code and item.get("feature") == feature for item in self.warnings):
            return
        warning: dict[str, Any] = {"code": code, "message": message}
        if feature:
            warning["feature"] = feature
        self.warnings.append(warning)

    def action(self, name: str, **details: Any) -> None:
        self.actions.append({"name": name, **details})

    def next_alias(self, prefix: str) -> str:
        self.alias_counter += 1
        return f"mentor_{prefix}_{self.alias_counter}"


_FIXTURES: dict[str, Any] = {"version": "empty", "tables": {}, "virtualFiles": {}}
_CTX: RunContext | None = None
_PATCHED = False


def _current_context() -> RunContext:
    if _CTX is None:
        raise RuntimeError("O contexto de execução ainda não foi iniciado.")
    return _CTX


def _safe_identifier_parts(name: str) -> list[str]:
    if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?", name):
        raise ValueError(f"Identificador inválido: {name!r}")
    return name.split(".")


def _quote_identifier(name: str) -> str:
    return ".".join(f'"{part}"' for part in _safe_identifier_parts(name))


def _duck_to_sqlframe_type(value: Any) -> str:
    text = str(value).upper()
    if "BIGINT" in text or text in {"INTEGER", "INT", "SMALLINT", "TINYINT", "HUGEINT"}:
        return "bigint"
    if any(item in text for item in ("DOUBLE", "FLOAT", "REAL")):
        return "double"
    if "DECIMAL" in text or "NUMERIC" in text:
        return text.lower()
    if "TIMESTAMP" in text:
        return "timestamp"
    if text == "DATE":
        return "date"
    if "BOOL" in text:
        return "boolean"
    return "string"


def _describe_query(connection: Any, sql: str) -> list[dict[str, Any]]:
    rows = connection.execute(f"DESCRIBE ({sql})").fetchall()
    return [
        {
            "name": row[0],
            "type": str(row[1]),
            "nullable": str(row[2]).upper() != "NO" if len(row) > 2 else True,
        }
        for row in rows
    ]


def _register_catalog_table(session: Any, connection: Any, table_name: str) -> None:
    quoted = _quote_identifier(table_name)
    rows = connection.execute(f"DESCRIBE SELECT * FROM {quoted}").fetchall()
    mapping = {row[0]: _duck_to_sqlframe_type(row[1]) for row in rows}
    session.catalog.add_table(table_name, column_mapping=mapping)


def _seed_fixture_table(connection: Any, name: str, definition: dict[str, Any]) -> None:
    quoted = _quote_identifier(name)
    schema = definition.get("schema") or {}
    if not schema:
        raise ValueError(f"A tabela de exemplo '{name}' não possui schema.")
    columns = []
    for column, data_type in schema.items():
        _safe_identifier_parts(column)
        if not re.fullmatch(r"[A-Za-z]+(?:\s*\(\s*\d+\s*(?:,\s*\d+\s*)?\))?", str(data_type)):
            raise ValueError(f"Tipo inválido em {name}.{column}: {data_type}")
        columns.append(f'"{column}" {data_type}')
    connection.execute(f"CREATE TABLE {quoted} ({', '.join(columns)})")
    rows = definition.get("rows") or []
    if rows:
        width = len(schema)
        if any(not isinstance(row, list) or len(row) != width for row in rows):
            raise ValueError(f"Uma linha de '{name}' não corresponde ao schema.")
        placeholders = ", ".join("?" for _ in range(width))
        connection.executemany(f"INSERT INTO {quoted} VALUES ({placeholders})", rows)


def _create_session(fixtures: dict[str, Any], allow_ddl: bool = False) -> RunContext:
    global _CTX
    if _CTX is not None:
        try:
            _CTX.connection.close()
        except Exception:
            pass

    _BaseSession._instance = None
    builder = StandaloneSession.builder
    builder.input_dialect = "spark"
    builder.output_dialect = "duckdb"
    builder.execution_dialect = "duckdb"
    builder._conn = None
    builder._session_kwargs = {}
    session = builder.getOrCreate()
    # Falha fechada: a conexão já nasce sem arquivos, rede ou extensões
    # automáticas. Depois que o SQLFrame recebe a conexão, a configuração é
    # travada antes de qualquer fixture ou código do estudante.
    connection = duckdb.connect(":memory:", config=DUCKDB_SAFE_CONFIG)
    session = StandaloneSession(conn=connection)
    connection.execute("SET lock_configuration = true")
    context = RunContext(connection=connection, session=session, fixtures=fixtures, allow_ddl=allow_ddl)
    _CTX = context

    for table_name, definition in (fixtures.get("tables") or {}).items():
        _safe_identifier_parts(table_name)
        _seed_fixture_table(connection, table_name, definition)
        _register_catalog_table(session, connection, table_name)
    return context


class MentorDataFrameWriter:
    def __init__(self, dataframe: Any):
        self.dataframe = dataframe
        self._format = "parquet"
        self._mode = "error"
        self._partitions: list[str] = []

    def format(self, source: str) -> "MentorDataFrameWriter":
        self._format = str(source).lower()
        return self

    def mode(self, save_mode: str) -> "MentorDataFrameWriter":
        self._mode = str(save_mode).lower()
        return self

    def partitionBy(self, *columns: str) -> "MentorDataFrameWriter":
        self._partitions = [str(column) for column in columns]
        return self

    def saveAsTable(self, table_name: str) -> None:
        context = _current_context()
        parts = _safe_identifier_parts(table_name)
        if len(parts) == 2:
            context.connection.execute(f'CREATE SCHEMA IF NOT EXISTS "{parts[0]}"')
        quoted = _quote_identifier(table_name)
        sql = self.dataframe.sql(dialect="duckdb", pretty=False, optimize=True)
        exists = bool(
            context.connection.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
                [parts[0] if len(parts) == 2 else "main", parts[-1]],
            ).fetchone()[0]
        )
        if self._mode == "append" and exists:
            context.connection.execute(f"INSERT INTO {quoted} {sql}")
        elif self._mode == "ignore" and exists:
            pass
        elif self._mode in {"overwrite", "error", "errorifexists", "default"}:
            if exists and self._mode in {"error", "errorifexists", "default"}:
                raise RuntimeError(f"A tabela '{table_name}' já existe.")
            context.connection.execute(f"CREATE OR REPLACE TABLE {quoted} AS {sql}")
        else:
            raise ValueError(f"Modo de escrita não suportado: {self._mode}")
        _register_catalog_table(context.session, context.connection, table_name)
        context.action(
            "saveAsTable",
            table=table_name,
            format=self._format,
            mode=self._mode,
            partitionBy=self._partitions,
        )
        if self._format == "delta":
            context.warn(
                "W-SIM-DELTA",
                "A gravação foi materializada como tabela DuckDB em memória; não há log Delta, ACID ou time travel.",
                "delta",
            )
        if self._partitions:
            context.warn(
                "W-SIM-PARTITION-WRITE",
                "partitionBy foi validado, mas não cria partições físicas no laboratório do navegador.",
                "partitionBy",
            )


class MentorReader:
    def __init__(self, session: Any):
        self.session = session
        self.options: dict[str, Any] = {}

    def option(self, key: str, value: Any) -> "MentorReader":
        self.options[str(key)] = value
        return self

    def schema(self, value: Any) -> "MentorReader":
        # O schema real das fixtures é registrado no catálogo. Guardamos apenas
        # a intenção para que o encadeamento PySpark continue válido.
        self.options["schema"] = value
        return self

    def table(self, table_name: str) -> Any:
        return self.session.read.table(table_name)

    def csv(self, path: str, **kwargs: Any) -> Any:
        return self._virtual_file(path, "csv", kwargs)

    def parquet(self, *paths: str, **kwargs: Any) -> Any:
        if not paths:
            raise ValueError("Informe o caminho do arquivo Parquet.")
        return self._virtual_file(paths[0], "parquet", kwargs)

    def _virtual_file(self, path: str, file_format: str, kwargs: dict[str, Any]) -> Any:
        context = _current_context()
        mapping = context.fixtures.get("virtualFiles") or {}
        table_name = mapping.get(str(path))
        if not table_name:
            raise FileNotFoundError(
                f"O arquivo '{path}' não existe no conjunto de exemplos. Use /dados/pedidos.csv ou envie uma fixture explícita."
            )
        context.action("read", format=file_format, path=str(path), options={**self.options, **kwargs})
        context.warn(
            "W-VIRTUAL-FILE",
            "A leitura usa um arquivo virtual pequeno fornecido pelo curso, não o filesystem distribuído do Spark.",
            file_format,
        )
        return self.session.read.table(table_name)


class MentorCommandResult:
    def __init__(self, sql: str):
        self.sql_text = sql


class MentorSparkSession:
    def __init__(self, session: Any):
        self._session = session

    @property
    def read(self) -> MentorReader:
        return MentorReader(self._session)

    def range(self, *args: Any, **kwargs: Any) -> Any:
        if not args and "start" not in kwargs:
            raise TypeError("spark.range exige pelo menos o limite final.")
        if len(args) > 4:
            raise TypeError("spark.range aceita no máximo start, end, step e numPartitions.")
        start_value = args[0] if args else kwargs.get("start")
        end_value = args[1] if len(args) > 1 else kwargs.get("end")
        step_value = args[2] if len(args) > 2 else kwargs.get("step", 1)
        partitions = args[3] if len(args) > 3 else kwargs.get("numPartitions")
        numeric_values = [value for value in (start_value, end_value, step_value, partitions) if value is not None]
        if any(isinstance(value, bool) or not isinstance(value, int) for value in numeric_values):
            raise TypeError("spark.range aceita somente argumentos inteiros neste laboratório.")
        actual_start = 0 if end_value is None else start_value
        actual_end = start_value if end_value is None else end_value
        if step_value == 0:
            raise ValueError("O passo de spark.range não pode ser zero.")
        if len(range(actual_start, actual_end, step_value)) > MAX_RANGE_ROWS:
            raise PolicyViolation(
                "E-POLICY-013",
                f"spark.range foi limitado a {MAX_RANGE_ROWS} linhas no laboratório do navegador.",
                1,
                1,
                "Use uma faixa menor ou execute o volume desejado no PySpark real.",
            )
        if partitions is not None and not 1 <= partitions <= 128:
            raise PolicyViolation(
                "E-POLICY-013",
                "numPartitions deve ficar entre 1 e 128 no laboratório.",
                1,
                1,
            )
        return self._session.range(*args, **kwargs)

    def createDataFrame(self, *args: Any, **kwargs: Any) -> Any:
        return self._session.createDataFrame(*args, **kwargs)

    def table(self, table_name: str) -> Any:
        return self._session.read.table(table_name)

    def sql(self, query: str) -> Any:
        context = _current_context()
        expressions, duck_statements = _compile_spark_sql(query, allow_ddl=context.allow_ddl)
        if all(_is_query_expression(expression) for expression in expressions):
            return self._session.sql(query)

        last_result: Any = MentorCommandResult(";\n".join(duck_statements))
        for expression, duck_sql in zip(expressions, duck_statements):
            if _is_query_expression(expression):
                last_result = self._session.sql(expression.sql(dialect="spark"))
                continue
            context.connection.execute(duck_sql)
            context.action("sqlCommand", sql=duck_sql)
            if isinstance(expression, exp.Create) and str(expression.args.get("kind", "")).upper() == "VIEW":
                name = expression.this.sql(dialect="spark", identify=False)
                try:
                    _register_catalog_table(context.session, context.connection, name)
                    last_result = context.session.read.table(name)
                except Exception:
                    pass
        return last_result


def _patch_sqlframe() -> None:
    global _PATCHED
    if _PATCHED:
        return
    _PATCHED = True

    original_fillna = StandaloneDataFrame.fillna
    original_count = StandaloneDataFrame.count
    original_temp_view = StandaloneDataFrame.createOrReplaceTempView

    def fillna(dataframe: Any, value: Any, subset: Any = None) -> Any:
        result = original_fillna(dataframe, value, subset)
        # SQLFrame 4.3 pode eliminar o CASE de fillna quando outra projeção é
        # encadeada imediatamente. Um alias força a fronteira semântica correta.
        return result.alias(_current_context().next_alias("fillna"))

    def count(dataframe: Any) -> int:
        context = _current_context()
        context.action("count")
        return original_count(dataframe)

    def show(dataframe: Any, n: int = 20, truncate: Any = None, vertical: bool = False) -> None:
        _current_context().action("show", rows=int(n), truncate=truncate, vertical=bool(vertical))
        return None

    def print_schema(dataframe: Any, level: Any = None) -> None:
        _current_context().action("printSchema", level=level)
        return None

    def explain(dataframe: Any, extended: Any = None, mode: Any = None) -> None:
        value = mode if mode is not None else extended
        context = _current_context()
        context.action("explain", mode=value)
        context.warn(
            "W-SIM-EXPLAIN",
            "O plano mostrado é relacional e educacional; não é o plano físico produzido pelo Catalyst.",
            "explain",
        )
        return None

    def cache(dataframe: Any) -> Any:
        context = _current_context()
        context.action("cache")
        context.warn(
            "W-SIM-CACHE",
            "cache/persist é registrado para avaliação, mas não representa persistência distribuída.",
            "cache",
        )
        return dataframe

    def persist(dataframe: Any, storageLevel: Any = "MEMORY_AND_DISK") -> Any:
        context = _current_context()
        context.action("persist", storageLevel=str(storageLevel))
        context.warn(
            "W-SIM-CACHE",
            "cache/persist é registrado para avaliação, mas não representa persistência distribuída.",
            "cache",
        )
        return dataframe

    def unpersist(dataframe: Any, blocking: bool = False) -> Any:
        _current_context().action("unpersist", blocking=bool(blocking))
        return dataframe

    def repartition(dataframe: Any, numPartitions: Any, *columns: Any) -> Any:
        context = _current_context()
        context.action("repartition", partitions=numPartitions, columns=[str(item) for item in columns])
        context.warn(
            "W-SIM-REPARTITION",
            "repartition foi validado como intenção; DuckDB local não cria partições Spark nem executors.",
            "repartition",
        )
        return dataframe

    def create_temp_view(dataframe: Any, name: str) -> None:
        original_temp_view(dataframe, name)
        _current_context().action("createOrReplaceTempView", view=name)
        return None

    StandaloneDataFrame.fillna = fillna
    StandaloneDataFrame.count = count
    StandaloneDataFrame.show = show
    StandaloneDataFrame.printSchema = print_schema
    StandaloneDataFrame.explain = explain
    StandaloneDataFrame.cache = cache
    StandaloneDataFrame.persist = persist
    StandaloneDataFrame.unpersist = unpersist
    StandaloneDataFrame.repartition = repartition
    StandaloneDataFrame.createOrReplaceTempView = create_temp_view
    StandaloneDataFrame.write = property(lambda dataframe: MentorDataFrameWriter(dataframe))
    StandaloneDataFrame.sparkSession = property(
        lambda dataframe: MentorSparkSession(_current_context().session)
    )

    def pedagogical_partition_id() -> Any:
        context = _current_context()
        context.warn(
            "W-SIM-PARTITION-ID",
            "spark_partition_id retorna a partição didática 0; não existem partições Spark no navegador.",
            "spark_partition_id",
        )
        return F.lit(0)

    F.spark_partition_id = pedagogical_partition_id


def _safe_import(name: str, globals_: Any = None, locals_: Any = None, fromlist: Any = (), level: int = 0) -> Any:
    if name not in {"pyspark.sql", "pyspark.sql.functions", "pyspark.sql.window"}:
        raise ImportError("Somente imports de pyspark.sql são permitidos no laboratório.")
    return builtins.__import__(name, globals_, locals_, fromlist, level)


SAFE_BUILTINS = {
    "__import__": _safe_import,
    "float": float,
    "int": int,
    "len": len,
    "max": max,
    "min": min,
    "print": print,
    "round": round,
    "str": str,
    "sum": sum,
}


def _student_globals(context: RunContext) -> dict[str, Any]:
    from sqlframe.standalone.functions import broadcast

    namespace: dict[str, Any] = {
        "__builtins__": SAFE_BUILTINS,
        "spark": MentorSparkSession(context.session),
        "F": F,
        "Window": Window,
        "broadcast": broadcast,
        "caminho": "/dados/pedidos.csv",
        "schema": {},
        "tabela": "pedidos_saida",
    }
    for table_name in (context.fixtures.get("tables") or {}):
        if "." not in table_name:
            namespace[table_name] = context.session.read.table(table_name)
    if "silver" in namespace:
        namespace["silver_vendas"] = namespace["silver"]
    if "pedidos_validos" in namespace:
        namespace["vendas_limpas"] = namespace["pedidos_validos"]
    return namespace


def _is_query_expression(expression: Any) -> bool:
    return isinstance(expression, exp.Query)


def _compile_spark_sql(source: str, allow_ddl: bool = False) -> tuple[list[Any], list[str]]:
    if not isinstance(source, str) or not source.strip():
        raise PolicyViolation("E-SQL-000", "Digite uma consulta antes de analisar.", 1, 1)
    if len(source) > 20_000:
        raise PolicyViolation("E-POLICY-002", "A consulta excede o limite de 20.000 caracteres.", 1, 1)
    expressions = sqlglot.parse(source, read="spark", error_level=ErrorLevel.RAISE)
    if not expressions:
        raise PolicyViolation("E-SQL-000", "Nenhuma instrução SQL foi encontrada.", 1, 1)

    blocked_keys = {
        "alter",
        "attach",
        "cache",
        "copy",
        "delete",
        "drop",
        "grant",
        "insert",
        "install",
        "load_data",
        "merge",
        "pragma",
        "revoke",
        "set",
        "uncache",
        "update",
        "use",
    }
    blocked_functions = {
        "glob",
        "httpfs",
        "json_execute_serialized_sql",
        "query",
        "query_table",
        "sniff_csv",
    }
    for expression in expressions:
        if not _is_query_expression(expression):
            if not allow_ddl or not isinstance(expression, exp.Create):
                raise PolicyViolation(
                    "E-SQL-POLICY-001",
                    f"A instrução SQL '{expression.key.upper()}' não é permitida neste modo.",
                    1,
                    1,
                )
            kind = str(expression.args.get("kind", "")).upper()
            is_safe_ctas = kind == "TABLE" and expression.args.get("expression") is not None
            if kind not in {"SCHEMA", "VIEW"} and not is_safe_ctas:
                raise PolicyViolation(
                    "E-SQL-POLICY-001",
                    "Somente CREATE SCHEMA, CREATE VIEW e CREATE TABLE AS SELECT são aceitos pelo catálogo educacional.",
                    1,
                    1,
                )
        for table in expression.find_all(exp.Table):
            if isinstance(table.this, exp.Func):
                function_name = (
                    table.this.name.lower()
                    if isinstance(table.this, exp.Anonymous)
                    else table.this.sql_name().lower()
                )
                raise PolicyViolation(
                    "E-SQL-POLICY-002",
                    f"A função de tabela '{function_name}' não é permitida; use somente as tabelas do exercício.",
                    1,
                    1,
                )
        for node in expression.walk():
            if node.key in blocked_keys:
                raise PolicyViolation(
                    "E-SQL-POLICY-001",
                    f"A operação SQL '{node.key.upper()}' foi bloqueada pelo laboratório.",
                    1,
                    1,
                )
            if isinstance(node, exp.Func):
                function_name = (
                    node.name.lower()
                    if isinstance(node, exp.Anonymous)
                    else node.sql_name().lower()
                )
                external_function = (
                    function_name in blocked_functions
                    or function_name.startswith("read_")
                    or function_name.startswith("parquet_")
                    or function_name.startswith("iceberg_")
                    or function_name.startswith("delta_")
                    or function_name.endswith("_scan")
                )
                if external_function:
                    raise PolicyViolation(
                        "E-SQL-POLICY-002",
                        f"A função SQL '{function_name}' foi bloqueada porque pode acessar dados externos.",
                        1,
                        1,
                    )

    duck_statements = []
    for expression in expressions:
        duck_expression = expression.copy()
        if isinstance(duck_expression, exp.Create):
            properties = duck_expression.args.get("properties")
            if properties is not None:
                filtered = [
                    item
                    for item in properties.expressions
                    if not isinstance(item, getattr(exp, "FileFormatProperty", tuple()))
                ]
                properties.set("expressions", filtered)
        duck_statements.append(
            duck_expression.sql(dialect="duckdb", pretty=True, unsupported_level=ErrorLevel.RAISE)
        )
    return expressions, duck_statements


def _warning_for_source(context: RunContext, source: str, methods: list[str]) -> None:
    context.warn(
        "W-ENGINE-001",
        "Resultado produzido por SQLFrame e DuckDB no navegador; não é uma execução Apache Spark.",
        "runtime",
    )
    source_lower = source.lower()
    if "broadcast" in source_lower:
        context.warn(
            "W-SIM-BROADCAST",
            "O join é executado localmente; broadcast é apenas uma marca sem distribuição para executors.",
            "broadcast",
        )
    if "spark_partition_id" in source_lower:
        context.warn(
            "W-SIM-PARTITION-ID",
            "spark_partition_id não representa partições reais no motor local e pode não ser executável.",
            "spark_partition_id",
        )
    if "collect" in methods:
        context.warn(
            "W-COLLECT",
            "collect é seguro apenas porque as fixtures são pequenas; no Spark ele traz dados ao driver.",
            "collect",
        )


def _normalize_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        if math.isnan(value):
            return {"special": "NaN"}
        if math.isinf(value):
            return {"special": "Infinity" if value > 0 else "-Infinity"}
        return value
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (dt.date, dt.datetime, dt.time)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.hex()
    if isinstance(value, (list, tuple)):
        return [_normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _normalize_value(item) for key, item in value.items()}
    if hasattr(value, "asDict"):
        return _normalize_value(value.asDict(recursive=True))
    return str(value)


def _execute_query(connection: Any, sql: str, max_rows: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    cursor = connection.execute(sql)
    description = cursor.description or []
    schema = [
        {"name": item[0], "type": str(item[1]), "nullable": True}
        for item in description[:MAX_OUTPUT_COLUMNS]
    ]
    rows = cursor.fetchmany(max_rows + 1) if description else []
    truncated = len(rows) > max_rows
    rows = rows[:max_rows]
    normalized_rows = [
        [_normalize_value(value) for value in row[:MAX_OUTPUT_COLUMNS]]
        for row in rows
    ]
    result = {
        "kind": "table" if description else "none",
        "columns": schema,
        "rows": normalized_rows,
        "rowCount": len(rows),
        "truncated": truncated,
        "columnsTruncated": len(description) > MAX_OUTPUT_COLUMNS,
    }
    return result, schema


def _build_plan(sql: str, context: RunContext) -> dict[str, Any]:
    try:
        expression = sqlglot.parse_one(sql, read="duckdb")
    except Exception:
        return {"kind": "relational", "operations": [], "tables": [], "actions": context.actions}
    operation_map = {
        "select": "Project",
        "where": "Filter",
        "join": "Join",
        "group": "Aggregate",
        "order": "Sort",
        "window": "Window",
        "limit": "Limit",
        "values": "LocalRelation",
    }
    operations: list[str] = []
    tables: list[str] = []
    for node in expression.walk():
        operation = operation_map.get(node.key)
        if operation and operation not in operations:
            operations.append(operation)
        if isinstance(node, exp.Table):
            name = node.sql(dialect="duckdb", identify=False)
            if name not in tables:
                tables.append(name)
    return {
        "kind": "relational-educational",
        "dialect": "duckdb",
        "operations": operations,
        "tables": tables,
        "actions": context.actions,
    }


def _compile_dataframe(dataframe: Any) -> str:
    sql = dataframe.sql(dialect="duckdb", pretty=True, optimize=True)
    if isinstance(sql, list):
        sql = ";\n".join(sql)
    return str(sql)


def _last_student_expression(tree: ast.Module) -> ast.Module:
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        node = tree.body[-1]
        replacement = ast.Assign(
            targets=[ast.Name(id="mentor_last_expression", ctx=ast.Store())],
            value=node.value,
        )
        ast.copy_location(replacement, node)
        tree.body[-1] = replacement
        ast.fix_missing_locations(tree)
    return tree


def _run_pyspark(payload: dict[str, Any]) -> dict[str, Any]:
    source = payload.get("code", "")
    metadata = validate_python_source(source)
    allow_ddl = bool(payload.get("allowDDL", False)) or int(payload.get("lessonId", 0) or 0) == 18
    context = _create_session(_fixtures_for_payload(payload), allow_ddl=allow_ddl)
    _warning_for_source(context, source, metadata["calledMethods"])
    namespace = _student_globals(context)
    initial_names = set(namespace)
    stdout = io.StringIO()
    tree = _last_student_expression(metadata["tree"])
    code_object = compile(tree, "<estudante>", "exec")
    with contextlib.redirect_stdout(stdout):
        exec(code_object, namespace, namespace)

    assigned_names = list(metadata["assignedNames"])
    if "mentor_last_expression" in namespace:
        assigned_names.append("mentor_last_expression")
    requested_name = payload.get("resultVariable")
    if requested_name:
        if requested_name not in namespace:
            raise NameError(f"A variável de resultado '{requested_name}' não foi criada.")
        primary_name = requested_name
    else:
        primary_name = next(
            (name for name in reversed(assigned_names) if name in namespace and name not in initial_names),
            None,
        )

    dataframe_name = None
    dataframe = None
    if primary_name and isinstance(namespace.get(primary_name), StandaloneDataFrame):
        dataframe_name = primary_name
        dataframe = namespace[primary_name]
    else:
        for name in reversed(assigned_names):
            value = namespace.get(name)
            if isinstance(value, StandaloneDataFrame):
                dataframe_name = name
                dataframe = value
                break

    sql = _compile_dataframe(dataframe) if dataframe is not None else None
    max_rows = max(1, min(int(payload.get("maxRows", 50)), MAX_OUTPUT_ROWS))
    if dataframe is not None and sql:
        result, schema = _execute_query(context.connection, sql, max_rows)
        result["variable"] = dataframe_name
    elif primary_name is not None:
        value = namespace.get(primary_name)
        result = {"kind": "scalar", "value": _normalize_value(value), "variable": primary_name}
        schema = []
    else:
        result = {"kind": "none"}
        schema = []

    return {
        "status": "ok",
        "mode": "pyspark",
        "sql": sql,
        "result": result,
        "schema": schema,
        "stdout": stdout.getvalue().strip(),
        "plan": _build_plan(sql, context) if sql else {"kind": "none", "actions": context.actions},
        "warnings": context.warnings,
        "diagnostics": [],
        "source": {
            "assignedNames": metadata["assignedNames"],
            "calledMethods": metadata["calledMethods"],
            "nodeCount": metadata["nodeCount"],
        },
    }


def _run_sql(payload: dict[str, Any]) -> dict[str, Any]:
    source = payload.get("code", "")
    allow_ddl = bool(payload.get("allowDDL", False)) or int(payload.get("lessonId", 0) or 0) == 18
    context = _create_session(_fixtures_for_payload(payload), allow_ddl=allow_ddl)
    context.warn(
        "W-ENGINE-001",
        "Consulta traduzida do dialeto Spark SQL e executada pelo DuckDB no navegador; não é Apache Spark.",
        "runtime",
    )
    expressions, statements = _compile_spark_sql(source, allow_ddl=allow_ddl)
    max_rows = max(1, min(int(payload.get("maxRows", 50)), MAX_OUTPUT_ROWS))
    final_result: dict[str, Any] = {"kind": "none"}
    final_schema: list[dict[str, Any]] = []
    final_query_sql: str | None = None
    for expression, statement in zip(expressions, statements):
        if _is_query_expression(expression):
            final_result, final_schema = _execute_query(context.connection, statement, max_rows)
            final_query_sql = statement
        else:
            context.connection.execute(statement)
            context.action("sqlCommand", sql=statement)
    compiled = ";\n".join(statements)
    return {
        "status": "ok",
        "mode": "sql",
        "sql": compiled,
        "result": final_result,
        "schema": final_schema,
        "stdout": "",
        "plan": _build_plan(final_query_sql or compiled, context),
        "warnings": context.warnings,
        "diagnostics": [],
    }


def _fixtures_for_payload(payload: dict[str, Any]) -> dict[str, Any]:
    override = payload.get("fixtures")
    if override is None and isinstance(payload.get("tables"), list):
        tables: dict[str, Any] = {}
        for table in payload["tables"]:
            if not isinstance(table, dict):
                raise PolicyViolation("E-FIXTURE-001", "Uma tabela da aula é inválida.", 1, 1)
            name = table.get("name")
            columns = table.get("columns")
            rows = table.get("rows")
            if not isinstance(name, str) or not isinstance(columns, list) or not isinstance(rows, list):
                raise PolicyViolation(
                    "E-FIXTURE-001",
                    "Cada tabela precisa de name, columns e rows.",
                    1,
                    1,
                )
            if any(not isinstance(column, str) for column in columns):
                raise PolicyViolation("E-FIXTURE-001", f"As colunas de '{name}' são inválidas.", 1, 1)
            schema: dict[str, str] = {}
            for index, column in enumerate(columns):
                values = [row[index] for row in rows if isinstance(row, list) and len(row) > index and row[index] is not None]
                if values and all(isinstance(value, bool) for value in values):
                    data_type = "BOOLEAN"
                elif values and all(isinstance(value, int) and not isinstance(value, bool) for value in values):
                    data_type = "BIGINT"
                elif values and all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in values):
                    data_type = "DOUBLE"
                else:
                    # Strings de data permanecem VARCHAR para que as aulas
                    # pratiquem explicitamente to_date/to_timestamp.
                    data_type = "VARCHAR"
                schema[column] = data_type
            tables[name] = {"schema": schema, "rows": rows}
        virtual_files: dict[str, str] = {}
        if "pedidos_arquivo" in tables:
            virtual_files.update(
                {
                    "/dados/pedidos.csv": "pedidos_arquivo",
                    "/dados/pedidos.parquet": "pedidos_arquivo",
                    "/dados/pedidos": "pedidos_arquivo",
                }
            )
        override = {
            "version": f"lesson-{payload.get('lessonId', 'custom')}",
            "tables": tables,
            "virtualFiles": virtual_files,
        }
    if override is None:
        return _FIXTURES
    if not isinstance(override, dict) or not isinstance(override.get("tables"), dict):
        raise PolicyViolation(
            "E-FIXTURE-001",
            "A fixture personalizada precisa conter um objeto 'tables'.",
            1,
            1,
        )
    return override


def _values_equal(actual: Any, expected: Any) -> bool:
    if actual is None or expected is None:
        return actual is expected
    if isinstance(actual, bool) or isinstance(expected, bool):
        return actual is expected
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return math.isclose(float(actual), float(expected), rel_tol=1e-9, abs_tol=1e-9)
    numeric_pattern = r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)"
    if isinstance(actual, str) and isinstance(expected, (int, float, Decimal)):
        if re.fullmatch(numeric_pattern, actual.strip()):
            return Decimal(actual.strip()) == Decimal(str(expected))
    if isinstance(expected, str) and isinstance(actual, (int, float, Decimal)):
        if re.fullmatch(numeric_pattern, expected.strip()):
            return Decimal(str(actual)) == Decimal(expected.strip())
    if isinstance(actual, str) and isinstance(expected, str):
        def normalize_datetime(value: str) -> str:
            normalized = value.replace("T", " ")
            normalized = re.sub(r"(?:Z|[+-]\d{2}:\d{2})$", "", normalized)
            return re.sub(r"\.0+$", "", normalized)
        return normalize_datetime(actual) == normalize_datetime(expected)
    return actual == expected


def _rows_equal(actual: Any, expected: Any) -> bool:
    return (
        isinstance(actual, list)
        and isinstance(expected, list)
        and len(actual) == len(expected)
        and all(_values_equal(left, right) for left, right in zip(actual, expected))
    )


def _unordered_rows_equal(actual_rows: list[Any], expected_rows: list[Any]) -> bool:
    if len(actual_rows) != len(expected_rows):
        return False
    remaining = list(actual_rows)
    for expected in expected_rows:
        match_index = next(
            (index for index, actual in enumerate(remaining) if _rows_equal(actual, expected)),
            None,
        )
        if match_index is None:
            return False
        remaining.pop(match_index)
    return not remaining


def _grade_result(expected: Any, result: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(expected, dict):
        return {
            "passed": result.get("kind") != "none",
            "score": 100 if result.get("kind") != "none" else 0,
            "checks": [
                {
                    "id": "execution",
                    "label": "O código produziu um resultado",
                    "passed": result.get("kind") != "none",
                }
            ],
        }
    expected_columns = expected.get("columns") if isinstance(expected.get("columns"), list) else []
    expected_rows = expected.get("rows") if isinstance(expected.get("rows"), list) else []
    ordered = bool(expected.get("ordered", False))
    actual_columns = [
        column.get("name") if isinstance(column, dict) else str(column)
        for column in (result.get("columns") or [])
    ]
    actual_rows = result.get("rows") if isinstance(result.get("rows"), list) else []
    columns_passed = actual_columns == expected_columns
    count_passed = len(actual_rows) == len(expected_rows)
    rows_passed = (
        len(actual_rows) == len(expected_rows)
        and (
            all(_rows_equal(actual, wanted) for actual, wanted in zip(actual_rows, expected_rows))
            if ordered
            else _unordered_rows_equal(actual_rows, expected_rows)
        )
    )
    checks = [
        {"id": "columns", "label": "Colunas e ordem correspondem ao esperado", "passed": columns_passed},
        {"id": "row-count", "label": "Quantidade de linhas corresponde ao esperado", "passed": count_passed},
        {
            "id": "rows",
            "label": "Valores e ordenação correspondem ao esperado" if ordered else "Valores correspondem ao esperado",
            "passed": rows_passed,
        },
    ]
    passed = all(check["passed"] for check in checks)
    return {
        "passed": passed,
        "score": round(sum(1 for check in checks if check["passed"]) * 100 / len(checks)),
        "checks": checks,
        "ordered": ordered,
    }


def _exception_location(exc: BaseException) -> tuple[int | None, int | None]:
    if isinstance(exc, SyntaxError):
        return exc.lineno, exc.offset
    for frame in reversed(traceback.extract_tb(exc.__traceback__)):
        if frame.filename == "<estudante>":
            return frame.lineno, 1
    return None, None


def _diagnostic_from_exception(exc: BaseException) -> dict[str, Any]:
    if isinstance(exc, PolicyViolation):
        diagnostic = {
            "severity": "error",
            "code": exc.code,
            "message": exc.message,
            "line": exc.line,
            "column": exc.column,
        }
        if exc.hint:
            diagnostic["hint"] = exc.hint
        return diagnostic

    line, column = _exception_location(exc)
    name = type(exc).__name__
    message = str(exc).strip() or name
    lowered = message.lower()
    if isinstance(exc, (ParseError, UnsupportedError)):
        code = "E-SQL-001"
        hint = "Revise a sintaxe do dialeto Spark SQL e as funções usadas."
    elif isinstance(exc, NameError):
        code = "E-NAME-001"
        hint = "Confira o nome da variável e execute as transformações na ordem correta."
    elif isinstance(exc, AttributeError):
        code = "E-API-001"
        hint = "Confira o nome do método e a matriz de compatibilidade do laboratório."
    elif isinstance(exc, ImportError):
        code = "E-POLICY-003"
        hint = "Use somente imports de pyspark.sql."
    elif isinstance(exc, FileNotFoundError):
        code = "E-FILE-001"
        hint = "Use um dos arquivos virtuais informados na atividade."
    elif "binder" in name.lower() or "column" in lowered or "referenced" in lowered:
        code = "E-COL-001"
        hint = "Confira as colunas disponíveis no schema da tabela de exemplo."
    elif "parser" in name.lower() or "syntax" in lowered:
        code = "E-SQL-001"
        hint = "Revise parênteses, aspas, aliases e a ordem das cláusulas."
    elif isinstance(exc, (NotImplementedError, UnsupportedError)):
        code = "E-UNSUPPORTED-001"
        hint = "Este recurso deve ser executado no PySpark real."
    elif isinstance(exc, (TypeError, ValueError)):
        code = "E-TYPE-001"
        hint = "Confira os argumentos, tipos e nomes informados."
    else:
        code = "E-RUNTIME-001"
        hint = "Revise a última transformação; se o recurso for válido no Spark, ele pode ainda não ser suportado pelo laboratório."
    return {
        "severity": "error",
        "code": code,
        "message": message,
        "line": line,
        "column": column,
        "hint": hint,
    }


def _version(package: str) -> str:
    try:
        return importlib.metadata.version(package)
    except Exception:
        return "desconhecida"


def mentor_set_fixtures_json(fixtures_json: str) -> str:
    global _FIXTURES
    parsed = json.loads(fixtures_json)
    if not isinstance(parsed, dict) or not isinstance(parsed.get("tables"), dict):
        raise ValueError("Fixture inválida: o campo 'tables' é obrigatório.")
    _FIXTURES = parsed
    return json.dumps({"status": "ok", "version": parsed.get("version", "custom")})


def mentor_reset() -> dict[str, Any]:
    global _CTX
    if _CTX is not None:
        try:
            _CTX.connection.close()
        except Exception:
            pass
    _CTX = None
    _BaseSession._instance = None
    return {"status": "ok", "reset": True}


def mentor_handle(payload: dict[str, Any]) -> dict[str, Any]:
    operation = payload.get("op", "run")
    if operation == "init":
        return {
            "status": "ok",
            "runtime": {
                "name": ENGINE_NAME,
                "version": ENGINE_VERSION,
                "isApacheSpark": False,
                "python": "Pyodide",
                "engine": "PYODIDE + SQLFRAME + DUCKDB",
                "sqlframe": _version("sqlframe"),
                "sqlglot": _version("sqlglot"),
                "duckdb": _version("duckdb"),
                "fixture": _FIXTURES.get("version"),
            },
            "capabilities": {
                "modes": ["pyspark", "sql"],
                "returns": ["sql", "rows", "schema", "plan", "warnings", "diagnostics"],
                "distributedExecution": False,
            },
        }
    if operation == "reset":
        return mentor_reset()
    if operation != "run":
        raise PolicyViolation("E-PROTOCOL-001", f"Operação desconhecida: {operation}")
    mode = str(payload.get("mode", "pyspark")).lower()
    if mode == "pyspark":
        response = _run_pyspark(payload)
        response["grade"] = _grade_result(payload.get("expected"), response["result"])
        response["passed"] = response["grade"]["passed"]
        response["compiledSql"] = response.get("sql")
        return response
    if mode in {"sql", "spark-sql", "sparksql"}:
        response = _run_sql(payload)
        response["grade"] = _grade_result(payload.get("expected"), response["result"])
        response["passed"] = response["grade"]["passed"]
        response["compiledSql"] = response.get("sql")
        return response
    raise PolicyViolation("E-PROTOCOL-002", f"Modo desconhecido: {mode}")


def mentor_handle_json(payload_json: str) -> str:
    payload: dict[str, Any] = {}
    try:
        payload = json.loads(payload_json)
        response = mentor_handle(payload)
    except BaseException as exc:
        response = {
            "status": "error",
            "diagnostics": [_diagnostic_from_exception(exc)],
            "warnings": _CTX.warnings if _CTX is not None else [],
            "result": {"kind": "none"},
            "sql": None,
            "grade": {"passed": False, "score": 0, "checks": []},
            "passed": False,
        }
    response.setdefault(
        "runtime",
        {
            "name": ENGINE_NAME,
            "engine": "PYODIDE + SQLFRAME + DUCKDB",
            "version": ENGINE_VERSION,
            "isApacheSpark": False,
        },
    )
    return json.dumps(response, ensure_ascii=False, separators=(",", ":"))


_patch_sqlframe()
