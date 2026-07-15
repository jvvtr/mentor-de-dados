# Matriz de compatibilidade

Esta matriz define o contrato do Laboratório Semântico. O escopo é deliberadamente menor que o Apache Spark: ele cobre as construções necessárias aos exercícios introdutórios e recusa o restante com um diagnóstico explícito.

As classificações são:

- **Executado**: analisado e calculado no navegador sobre os dados do exercício;
- **Com ressalvas**: executado, mas existe uma diferença conhecida em relação ao Spark;
- **Simulado/aviso**: a chamada é reconhecida para fins didáticos, mas seu efeito distribuído, de I/O ou de plano não é reproduzido;
- **Spark real**: não deve ser simulado; use PySpark local ou uma plataforma Spark;
- **Fora do escopo**: não faz parte da trilha nem do runtime atual.

“Executado” vale somente para as fixtures, schemas e formas de chamada declarados nas aulas. A presença de um método na política de segurança não garante que todas as assinaturas aceitas pelo PySpark real sejam compiláveis.

## Spark SQL

| Recurso | Classificação | Observações |
| --- | --- | --- |
| `SELECT`, alias e expressões aritméticas | Executado | Colunas devem existir no schema do exercício. |
| `WHERE` e operadores booleanos | Executado | Inclui `AND`, `OR`, `NOT`, comparações e `IN`. |
| `IS NULL`, `IS NOT NULL`, `COALESCE` | Com ressalvas | Tipos e coerções podem divergir entre Spark e DuckDB. |
| `CASE WHEN` e `CAST` | Com ressalvas | Somente tipos declarados nos exercícios. |
| `GROUP BY`, `HAVING`, `SUM`, `AVG`, `COUNT`, `MIN`, `MAX` | Executado | Funções aproximadas não estão incluídas. |
| `INNER`, `LEFT`, `RIGHT` e `FULL JOIN` | Com ressalvas | Nomes duplicados e ordem de colunas exigem atenção. |
| CTE com `WITH` e subconsulta | Executado | CTE recursiva não está incluída. |
| `ORDER BY`, `LIMIT` e `DISTINCT` | Executado | A ordem só é avaliada quando declarada. |
| `UNION` e `UNION ALL` | Com ressalvas | Requer quantidade e tipos de colunas compatíveis. |
| Funções de texto comuns | Com ressalvas | `upper`, `lower`, `trim`, `length`, `substring` e `concat` no escopo das aulas. |
| Funções de data comuns | Com ressalvas | Timezone, parsing e calendário podem produzir diferenças. |
| Janelas com `OVER`, `PARTITION BY` e `ORDER BY` | Com ressalvas | `row_number`, `rank`, `dense_rank`, `lag`, `lead` e agregações usadas nas aulas. |
| `EXPLAIN` | Spark real | Um plano DuckDB não representa um plano Catalyst. |
| `CREATE TEMP VIEW` | Fora do escopo | As tabelas do exercício já são registradas pelo runtime. |
| `CREATE` controlado na aula 18 | Simulado/aviso | A aula 18 pode usar `CREATE SCHEMA`, `CREATE VIEW` ou CTAS seguro; o objeto existe somente no DuckDB efêmero e não representa catálogo, arquivos ou tabela Spark real. |
| Demais DDL, DML e comandos administrativos | Fora do escopo | `ALTER`, `DROP`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `GRANT` e similares são bloqueados. Fora da aula 18, `CREATE` também é recusado no modo Spark SQL. |
| Funções de tabela | Fora do escopo | `read_text`, `read_csv`, `read_parquet`, `parquet_scan`, `range`, `query` e outras funções em `FROM` são bloqueadas; use somente as tabelas da fixture. |
| Leitura de arquivos, URLs, catálogos ou bancos externos | Fora do escopo | O laboratório usa somente fixtures locais declaradas. |
| Hive, Delta Lake, Iceberg e Hudi reais | Spark real | Requerem runtime, extensões e armazenamento apropriados. |

## API DataFrame PySpark

| Recurso | Classificação | Observações |
| --- | --- | --- |
| `spark.range(...)` e `spark.createDataFrame(...)` | Com ressalvas | Somente dados pequenos e formas de entrada previstas pelas aulas; `spark.range` aceita até 10.000 linhas. |
| `spark.table(...)` | Executado | Somente tabelas do exercício. |
| `spark.sql(...)` | Com ressalvas | A string segue o mesmo subconjunto Spark SQL desta matriz. |
| `select` e `alias` | Com ressalvas | Expressões devem ser reconhecidas pelo compilador. |
| `filter` e `where` | Executado | Com expressões de coluna suportadas. |
| `withColumn`, `fillna` e `drop` | Com ressalvas | Operações sobre schemas simples e formas previstas nas aulas. |
| `groupBy(...).agg(...)` | Executado | Agregações declaradas abaixo. |
| `join` | Com ressalvas | Chaves simples ou condição suportada; sugestões de broadcast não são executadas. |
| `orderBy` | Executado | Sem ordenação, a sequência de linhas é ignorada na correção. |
| `F.col`, `F.lit`, `F.when(...).otherwise(...)`, `F.coalesce` | Com ressalvas | Inclui `cast`, `isNull`, `isNotNull` e `isin` dentro do subconjunto seguro. |
| `F.sum`, `F.avg`, `F.count`, `F.countDistinct` | Executado | Agregações aproximadas e funções adicionais ficam fora da versão atual. |
| `F.date_trunc` | Com ressalvas | Parsing e timezone devem ser confirmados no Spark real. |
| `Window.partitionBy(...).orderBy(...)` com `row_number` ou `dense_rank` | Com ressalvas | Somente as formas cobertas pelas fixtures das aulas. |
| `F.spark_partition_id` | Simulado/aviso | O valor local não representa partições ou distribuição Spark. |
| `show`, `collect` e `count` como ação | Com ressalvas | O laboratório materializa o resultado internamente; não simula execução distribuída. |
| `printSchema` e `schema` | Com ressalvas | O schema mostrado é o modelo educacional, não o schema inferido pelo Spark. |
| Reader virtual com `csv` ou `parquet` | Simulado/aviso | Usa fixtures locais; não lê o caminho fornecido nem testa o conector Spark. |
| Writer virtual com `format`, `mode`, `partitionBy` e `saveAsTable` | Simulado/aviso | Valida a intenção sem criar arquivos, catálogo ou tabela Spark real. |
| `cache`, `persist`, `unpersist` | Simulado/aviso | A chamada pode ser reconhecida, mas não existe cache Spark no navegador. |
| `repartition` e `coalesce` físicos | Simulado/aviso | A chamada não redistribui partições Spark. |
| `broadcast` | Simulado/aviso | A chamada não executa uma estratégia de join Spark. |
| `explain` | Simulado/aviso | O plano gerado não é um plano Catalyst e deve ser rotulado como aproximação. |
| `withColumnRenamed` | Executado | Renomeia uma coluna por chamada no escopo das aulas. |
| `selectExpr`, `distinct` e `dropDuplicates` | Spark real | Não são prometidos pelo compilador semântico na versão atual. |
| `union`, `unionByName`, `sort` e `limit` | Spark real | Não são prometidos pelo compilador semântico na versão atual. |
| `F.upper`, `F.trim`, `F.to_date` e `F.to_timestamp` | Com ressalvas | Cobertas nas formas usadas pelas aulas; parsing, timezone e coerção devem ser confirmados no Spark real. |
| Outras funções de texto e data | Spark real | Mesmo que existam no PySpark, não são prometidas pelo compilador semântico nesta versão. |
| `rdd`, `mapPartitions`, `SparkContext` | Spark real | Fora da API DataFrame compilada. |
| Structured Streaming | Spark real | Não existe fonte, gatilho ou checkpoint de streaming. |
| UDF, UDTF, pandas UDF | Spark real | Código arbitrário não é executado pelo laboratório. |
| MLlib e GraphX | Fora do escopo | Não fazem parte desta trilha introdutória. |

## Python aceito

O editor de PySpark não é um console Python completo. Ele aceita a estrutura necessária para expressar transformações DataFrame:

- importações explícitas de `pyspark.sql.functions`, `Window` e nomes liberados;
- atribuições simples;
- literais de texto, número, booleano, lista e tupla;
- expressões de coluna e encadeamentos DataFrame liberados;
- parênteses e quebras de linha para legibilidade.

São bloqueados, entre outros:

- `exec`, `eval`, `compile`, `open`, `input`, `__import__` e introspecção;
- imports de sistema, rede ou arquivos;
- classes, decorators, geradores, threads e subprocessos;
- acesso a atributos especiais iniciados por `__`;
- loops ou funções arbitrárias que não fazem parte do exercício;
- chamadas para nomes e métodos ausentes da lista permitida.

O bloqueio não afirma que o código seria inválido em Python ou PySpark real; significa apenas que o laboratório não pode avaliá-lo com segurança e fidelidade suficientes.

## Diferenças semânticas conhecidas

Resultados devem ser classificados como **com ressalvas** quando dependem de:

| Tema | Possível diferença |
| --- | --- |
| `NULL` | Ordenação, comparação, agregação e propagação podem variar conforme modo e expressão. |
| Tipos numéricos | Divisão, overflow, precisão decimal e conversão implícita podem divergir. |
| Datas e timestamps | Timezone da sessão, parser, horário de verão e precisão podem divergir. |
| Texto | Expressões regulares, collation, Unicode e índice de `substring` precisam de teste específico. |
| Identificadores | Sensibilidade a maiúsculas e resolução de nomes podem depender da configuração Spark. |
| Tipos complexos | Arrays, maps e structs possuem cobertura limitada. |
| Ordem | Sem `ORDER BY`, a comparação deve tratar as linhas como conjunto ou multiconjunto. |
| Funções | Uma função de mesmo nome pode ter assinatura, tipo de retorno ou tratamento de erro diferente. |
| ANSI | O Spark pode falhar ou converter silenciosamente conforme `spark.sql.ansi.enabled`. |

## O que somente Spark real pode ensinar

Não existe substituto local no navegador para observar:

- o plano lógico analisado e otimizado pelo Catalyst;
- o plano físico selecionado pelo Spark;
- jobs, stages, tasks e métricas na Spark UI;
- shuffle entre partições e executores;
- broadcast real e decisões do Adaptive Query Execution;
- serialização, pressão de memória, spill e tolerância a falhas;
- conectores, catálogo, permissões e comportamento da versão em produção;
- custo e tempo de processamento em volume distribuído.

Para esses objetivos, siga o guia [Instalação local gratuita](INSTALACAO_LOCAL.md). O modo `local[2]` executa Spark real e permite estudar APIs e planos, embora ainda não reproduza um cluster com várias máquinas.

## Como relatar uma incompatibilidade

Ao abrir uma issue, inclua:

1. aula e exercício;
2. modo escolhido, Spark SQL ou PySpark;
3. código mínimo que reproduz o problema;
4. resultado do laboratório;
5. resultado no Apache Spark 4.2.0, quando possível;
6. navegador e versão;
7. mensagem de erro completa, sem dados sensíveis.

Uma diferença confirmada deve virar teste automatizado, correção ou ressalva explícita nesta matriz.
