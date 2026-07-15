# Referências oficiais

Esta lista reúne fontes primárias para verificar e aprofundar o conteúdo do Mentor de Dados. Os links e requisitos foram conferidos em **15 de julho de 2026**. A base de compatibilidade do projeto é **Apache Spark/PySpark 4.2.0**; links com `latest` podem apontar para uma versão mais recente no futuro.

## Apache Spark 4.2.0 e PySpark

- [Documentação do Apache Spark 4.2.0](https://spark.apache.org/docs/4.2.0/)
- [Documentação mais recente do Apache Spark](https://spark.apache.org/docs/latest/)
- [Instalação do PySpark](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html)
- [Quickstart: DataFrame e Spark SQL](https://spark.apache.org/docs/4.2.0/api/python/getting_started/quickstart_df.html)
- [Guia de DataFrames PySpark](https://spark.apache.org/docs/4.2.0/api/python/user_guide/dataframes.html)
- [Referência da API PySpark](https://spark.apache.org/docs/4.2.0/api/python/reference/index.html)
- [Spark SQL, DataFrames and Datasets Guide](https://spark.apache.org/docs/4.2.0/sql-programming-guide.html)
- [Spark SQL Reference](https://spark.apache.org/docs/4.2.0/sql-ref.html)
- [RDD Programming Guide](https://spark.apache.org/docs/4.2.0/rdd-programming-guide.html)

Segundo a documentação da versão 4.2.0, PySpark requer Python 3.10 ou superior e Java 17 ou superior. O Apache Spark 4.2.0 oferece suporte a Java 17, 21 e 25; o kit local adota JDK 17 como referência conservadora.

## Execução, planos e performance

- [Spark SQL Performance Tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html)
- [Tuning Spark](https://spark.apache.org/docs/4.2.0/tuning.html)
- [Cluster Mode Overview](https://spark.apache.org/docs/4.2.0/cluster-overview.html)
- [Spark Web UI](https://spark.apache.org/docs/4.2.0/web-ui.html)
- [Spark configuration](https://spark.apache.org/docs/4.2.0/configuration.html)

## Databricks Free Edition

- [Cadastro e visão geral do Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition)
- [Limitações do Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition-limitations)
- [Limitações do compute serverless](https://docs.databricks.com/aws/en/compute/serverless/limitations)
- [PySpark no Databricks](https://docs.databricks.com/aws/en/pyspark/)
- [Fundamentos de PySpark](https://docs.databricks.com/aws/en/pyspark/basics)
- [Tutorial de DataFrames no Databricks](https://docs.databricks.com/aws/en/getting-started/dataframes)
- [Arquitetura Medallion: Bronze, Silver e Gold](https://docs.databricks.com/aws/en/lakehouse/medallion)

O Free Edition substituiu o antigo Community Edition. Ele é um ambiente gratuito, serverless e sujeito a cotas. No compute serverless, somente APIs Spark Connect são suportadas: APIs RDD e APIs de cache de DataFrame/SQL não são suportadas. O app sinaliza os exercícios afetados e oferece o PySpark local como alternativa.

## Delta Lake

- [Documentação do Delta Lake](https://docs.delta.io/)
- [Delta Lake Quick Start](https://docs.delta.io/quick-start/)
- [Compatibilidade entre Delta Lake e Apache Spark](https://docs.delta.io/releases/)

O kit local deste repositório não instala Delta Lake. As práticas Delta são direcionadas ao Databricks Free Edition, com tabelas gerenciadas, ou a um ambiente configurado separadamente.

## Python e Java no Windows

- [Downloads oficiais do Python para Windows](https://www.python.org/downloads/windows/)
- [Documentação do módulo `venv`](https://docs.python.org/3/library/venv.html)
- [Eclipse Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17)

O Eclipse Adoptium é uma distribuição de OpenJDK. O projeto não exige um fornecedor específico de JDK; o requisito técnico vem da documentação do PySpark.

## Marcas e ativos visuais

- [Diretrizes de marcas do Apache Spark](https://spark.apache.org/trademarks.html)
- [Política de marcas da Apache Software Foundation](https://www.apache.org/foundation/marks/)
- [Índice oficial de imagens do site Apache Spark](https://spark.apache.org/images/)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [Atribuição dos ativos incluídos no projeto](assets/ATTRIBUTION.md)

Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. Os ativos oficiais são usados sem alteração somente para identificar a tecnologia estudada. O aplicativo possui nome e símbolo próprios e não declara afiliação ou endosso.

## Como interpretar estas referências

O conteúdo do app é introdutório e usa simplificações pedagógicas. Em caso de divergência:

1. confirme a versão efetivamente executada no seu ambiente;
2. prefira a documentação correspondente àquela versão;
3. confira as limitações específicas do provedor de compute;
4. trate a documentação oficial como fonte de autoridade.

Encontrou uma afirmação incorreta ou desatualizada? Abra uma issue usando o formulário **Correção de conteúdo** e inclua uma fonte primária.
