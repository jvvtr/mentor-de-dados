"""Verifica se o Windows está pronto para executar o starter do Mentor de Dados."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys


def executar() -> int:
    print("Mentor de Dados — verificação do ambiente local")
    print(f"Python: {sys.version.split()[0]}")

    if sys.version_info < (3, 10):
        print("ERRO: PySpark 4.2.0 requer Python 3.10 ou superior.")
        return 1

    java = shutil.which("java")
    java_home = os.environ.get("JAVA_HOME")
    print(f"JAVA_HOME: {java_home or 'não definido (opcional quando java está no PATH)'}")

    if java is None:
        print("ERRO: o comando java não foi encontrado.")
        print("Instale Java 17 ou superior e configure PATH ou JAVA_HOME.")
        return 1

    processo_java = subprocess.run(
        [java, "-version"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    texto_java = (processo_java.stderr or processo_java.stdout).strip().splitlines()
    print(f"Java: {texto_java[0] if texto_java else java}")
    if processo_java.returncode != 0:
        print("ERRO: Java foi encontrado, mas não pôde ser executado.")
        return 1

    try:
        import pyspark
        from pyspark.sql import SparkSession
    except ImportError:
        print("ERRO: PySpark não está instalado neste ambiente Python.")
        print("Execute: python -m pip install -r requirements.txt")
        return 1

    print(f"PySpark instalado: {pyspark.__version__}")

    spark = None
    try:
        spark = (
            SparkSession.builder
            .master("local[2]")
            .appName("MentorDeDados-Verificacao")
            .config("spark.sql.shuffle.partitions", "2")
            .getOrCreate()
        )
        spark.sparkContext.setLogLevel("ERROR")

        vendas = spark.createDataFrame(
            [(1, "Sul", 100.0), (2, "Sudeste", 250.0)],
            ["id", "regiao", "valor"],
        )
        vendas.createOrReplaceTempView("vendas_verificacao")

        total = spark.sql(
            "SELECT SUM(valor) AS total FROM vendas_verificacao"
        ).first()["total"]

        if total != 350.0:
            print(f"ERRO: a consulta retornou um valor inesperado: {total!r}")
            return 1

        print(f"Spark em execução: {spark.version} / master {spark.sparkContext.master}")
        print("Spark SQL: OK (total = 350.0)")
        print("Ambiente pronto para estudar.")
        return 0
    except Exception as erro:  # mostra uma mensagem curta e acionável ao iniciante
        print(f"ERRO ao iniciar ou consultar o Spark: {erro}")
        print("Confira java -version, JAVA_HOME e a instalação do requirements.txt.")
        return 1
    finally:
        if spark is not None:
            spark.stop()


if __name__ == "__main__":
    raise SystemExit(executar())
