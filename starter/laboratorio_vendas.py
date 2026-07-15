"""Laboratório introdutório de PySpark e Spark SQL para execução local."""

from __future__ import annotations

from datetime import date

from pyspark.sql import SparkSession, functions as F, types as T


def criar_spark() -> SparkSession:
    return (
        SparkSession.builder
        .master("local[2]")
        .appName("MentorDeDados-LaboratorioVendas")
        .config("spark.sql.shuffle.partitions", "4")
        .getOrCreate()
    )


def criar_pedidos(spark: SparkSession):
    schema = T.StructType(
        [
            T.StructField("id_pedido", T.IntegerType(), nullable=False),
            T.StructField("data_pedido", T.DateType(), nullable=False),
            T.StructField("estado", T.StringType(), nullable=False),
            T.StructField("categoria", T.StringType(), nullable=False),
            T.StructField("quantidade", T.IntegerType(), nullable=False),
            T.StructField("preco_unitario", T.DoubleType(), nullable=False),
            T.StructField("status", T.StringType(), nullable=False),
        ]
    )

    linhas = [
        (1, date(2026, 7, 1), "SP", "Eletrônicos", 1, 250.0, "APROVADO"),
        (2, date(2026, 7, 2), "RJ", "Casa", 2, 80.0, "APROVADO"),
        (3, date(2026, 7, 2), "SP", "Casa", 1, 120.0, "CANCELADO"),
        (4, date(2026, 7, 3), "MG", "Eletrônicos", 3, 50.0, "APROVADO"),
        (5, date(2026, 7, 4), "SP", "Eletrônicos", 2, 100.0, "APROVADO"),
    ]
    return spark.createDataFrame(linhas, schema)


def executar() -> int:
    spark = criar_spark()
    spark.sparkContext.setLogLevel("ERROR")

    try:
        pedidos = criar_pedidos(spark)
        print("\n1) Dados de entrada")
        pedidos.show(truncate=False)
        pedidos.printSchema()

        vendas = pedidos.withColumn(
            "valor",
            F.round(F.col("quantidade") * F.col("preco_unitario"), 2),
        )

        print("\n2) Faturamento aprovado com a DataFrame API")
        resumo_pyspark = (
            vendas
            .filter(F.col("status") == "APROVADO")
            .groupBy("estado")
            .agg(F.round(F.sum("valor"), 2).alias("faturamento"))
            .orderBy("estado")
        )
        resumo_pyspark.show()

        print("\n3) A mesma regra com Spark SQL")
        vendas.createOrReplaceTempView("vendas")
        resumo_sql = spark.sql(
            """
            SELECT
              estado,
              ROUND(SUM(valor), 2) AS faturamento
            FROM vendas
            WHERE status = 'APROVADO'
            GROUP BY estado
            ORDER BY estado
            """
        )
        resumo_sql.show()

        diferencas = (
            resumo_pyspark.exceptAll(resumo_sql).count()
            + resumo_sql.exceptAll(resumo_pyspark).count()
        )
        if diferencas:
            raise RuntimeError("Os resultados de PySpark e Spark SQL divergiram.")
        print("Resultados equivalentes: OK")

        print("\n4) Partições usando apenas APIs de DataFrame")
        por_estado = vendas.repartition(4, "estado")
        distribuicao = (
            por_estado
            .select(F.spark_partition_id().alias("particao"))
            .groupBy("particao")
            .count()
            .orderBy("particao")
        )
        distribuicao.show()
        print("A tabela acima exibe somente partições que receberam linhas.")

        print("\n5) Cache — prática exclusiva do ambiente local")
        aprovadas = vendas.filter(F.col("status") == "APROVADO").cache()
        quantidade = aprovadas.count()  # action que materializa o cache
        aprovadas.groupBy("categoria").agg(F.sum("valor").alias("total")).show()
        aprovadas.unpersist()
        print(f"Cache materializado e liberado para {quantidade} pedidos aprovados.")

        print("\nLaboratório concluído com sucesso.")
        return 0
    except Exception as erro:
        print(f"\nFalha no laboratório: {erro}")
        return 1
    finally:
        spark.stop()


if __name__ == "__main__":
    raise SystemExit(executar())
