# Fontes e plano de aprofundamento

O Mentor de Dados usa fontes oficiais como referência normativa e materiais gratuitos ou open source como complemento. Uma explicação do app deve ser confrontada com a documentação da versão do Spark instalada, principalmente antes de aplicar o conteúdo em produção.

## Como avaliar uma fonte

Use esta ordem de confiança:

1. documentação e código do Apache Spark na versão estudada;
2. documentação do formato, biblioteca ou plataforma responsável pelo recurso;
3. livros e projetos open source com licença e histórico públicos;
4. artigos, vídeos e respostas de comunidade como explicação adicional, nunca como única prova.

Sempre confira:

- versão e data do material;
- se o exemplo usa Spark SQL, PySpark DataFrame, pandas API on Spark ou uma API diferente;
- se o ambiente é local, cluster tradicional ou serverless;
- configuração relevante, como modo ANSI, timezone e case sensitivity;
- licença do código que você pretende reutilizar.

## Fonte primária: Apache Spark 4.2.0

| Objetivo | Fonte oficial |
| --- | --- |
| Visão geral e navegação | [Apache Spark 4.2.0](https://spark.apache.org/docs/4.2.0/) |
| Preparar PySpark | [Instalação](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html) |
| Primeiros passos em Python | [Getting Started](https://spark.apache.org/docs/4.2.0/api/python/getting_started/index.html) |
| DataFrames e Spark SQL | [Quickstart DataFrame](https://spark.apache.org/docs/4.2.0/api/python/getting_started/quickstart_df.html) |
| Conceitos e APIs de SQL | [Spark SQL Programming Guide](https://spark.apache.org/docs/4.2.0/sql-programming-guide.html) |
| Sintaxe, tipos e funções | [Spark SQL Reference](https://spark.apache.org/docs/4.2.0/sql-ref.html) |
| Arquitetura distribuída | [Cluster Mode Overview](https://spark.apache.org/docs/4.2.0/cluster-overview.html) |
| Planos e desempenho | [Performance Tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html) |
| Código e exemplos | [Repositório apache/spark](https://github.com/apache/spark) |

Os exemplos mantidos no repositório oficial ficam em [`examples/`](https://github.com/apache/spark/tree/master/examples). Ao comparar código, selecione a tag correspondente à versão instalada em vez de assumir que `master` e 4.2.0 são idênticos.

## Complementos gratuitos e open source

### The Internals of Spark SQL

[The Internals of Spark SQL](https://books.japila.pl/spark-sql-internals/) explica Catalyst, planos lógicos e físicos, estratégias e operadores. O [código-fonte do livro](https://github.com/japila-books/spark-sql-internals) usa licença Apache-2.0.

É um material avançado. Use depois de dominar DataFrames, lazy evaluation, joins e leitura de `explain()`. Ele complementa, mas não substitui, a documentação da versão.

### Delta Lake

[Delta Lake](https://docs.delta.io/) é um formato open source para tabelas em data lakes. O [repositório delta-io/delta](https://github.com/delta-io/delta) usa licença Apache-2.0.

Estude Delta somente depois de compreender leitura, transformação, escrita e particionamento no Spark. O starter mínimo deste projeto não instala Delta Lake.

### Apache Arrow

[Apache Arrow](https://arrow.apache.org/docs/) define um formato colunar em memória usado em integrações de dados, incluindo caminhos de conversão no ecossistema PySpark. O [repositório apache/arrow](https://github.com/apache/arrow) usa licença Apache-2.0.

Arrow é um aprofundamento para interoperabilidade e desempenho, não um pré-requisito para as primeiras aulas.

### Formatos, prática e testes

- [Apache Parquet](https://parquet.apache.org/docs/) é a fonte oficial e open source para o formato colunar usado nas aulas de leitura e escrita.
- [Data Engineering Zoomcamp — Batch Processing](https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/06-batch) oferece um módulo gratuito e prático. Confirme APIs e versões na documentação do Spark antes de reproduzir os exemplos.
- [The Internals of Apache Spark](https://github.com/japila-books/apache-spark-internals) aprofunda scheduler, RDDs e execução. É material avançado e não deve antecipar o estudo básico de DataFrames.
- [chispa](https://github.com/MrPowers/chispa) é uma biblioteca open source para comparar DataFrames em testes PySpark. A documentação oficial de [testes no PySpark](https://spark.apache.org/docs/4.2.0/api/python/getting_started/testing_pyspark.html) continua sendo a referência primária.
- [NYC Taxi & Limousine Commission — Trip Record Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page) disponibiliza dados públicos que inspiram o projeto final. O app usa uma amostra sintética e não redistribui o conjunto completo.

Esses materiais ampliam a prática, mas não formam uma cadeia obrigatória. Comece pela fonte ligada à aula atual e mantenha o escopo de uma hora por dia.

### Ferramentas do Laboratório Semântico

Estas fontes explicam como o app analisa e executa exemplos no navegador; elas não documentam Apache Spark:

- [SQLGlot](https://sqlglot.com/sqlglot.html): parser e transpiler SQL, licença MIT;
- [SQLFrame Standalone](https://sqlframe.readthedocs.io/en/stable/standalone/): API DataFrame que gera SQL, licença MIT;
- [DuckDB](https://duckdb.org/docs/stable/): banco analítico embutido, licença MIT;
- [Pyodide](https://pyodide.org/en/stable/): CPython em WebAssembly, licença MPL-2.0.

Conhecer essas ferramentas ajuda a entender as ressalvas do laboratório. Não use uma diferença do DuckDB ou SQLFrame para concluir como o Spark se comporta; confirme no Spark real.

### JupyterLite como prática de Python

[JupyterLite](https://jupyterlite.readthedocs.io/en/stable/) oferece notebooks estáticos no navegador e é open source sob BSD-3-Clause. Ele pode apoiar o aprendizado de Python básico, mas o kernel Pyodide **não é um runtime Apache Spark**. Este projeto não depende de JupyterLite.

## Serviços gratuitos úteis

O [Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition) é uma opção para executar notebooks Spark reais sem configurar Java e Python localmente. O serviço não é open source, tem cotas e [limitações serverless](https://docs.databricks.com/aws/en/compute/serverless/limitations).

Antes de usar qualquer serviço externo:

- leia os termos e a política de privacidade atuais;
- não envie dados pessoais, corporativos ou confidenciais;
- confirme versão do runtime e limitações da modalidade gratuita;
- exporte o código que deseja preservar.

## Trilha sugerida para quem já sabe SQL

### Semana 1 — mudar o modelo mental

Objetivos:

- distinguir Spark, PySpark e Spark SQL;
- entender driver, executor, aplicação e sessão;
- mapear `SELECT`, `WHERE` e colunas calculadas para DataFrames;
- ler o Python mínimo necessário para imports, chamadas e encadeamentos;
- trabalhar com schema explícito, tipos, `NULL` e modo ANSI.

Leia o [Quickstart DataFrame](https://spark.apache.org/docs/4.2.0/api/python/getting_started/quickstart_df.html) em paralelo às aulas. No fim da semana, explique por que um DataFrame não é apenas uma tabela já calculada em memória.

### Semana 2 — expressar o mesmo problema em duas APIs

Objetivos:

- criar e consultar views temporárias;
- fazer agregações, joins, datas e janelas;
- comparar uma consulta Spark SQL com sua cadeia PySpark equivalente;
- reconhecer quando tipos, aliases e `NULL` alteram o resultado.

Use a [referência Spark SQL](https://spark.apache.org/docs/4.2.0/sql-ref.html) para conferir sintaxe e funções. Execute os exercícios suportados no laboratório e repita ao menos dois no PySpark local.

### Semana 3 — compreender a execução

Objetivos:

- ler planos com `explain()`;
- relacionar partições, tasks, stages, jobs e shuffle;
- entender o custo de joins e agregações;
- discutir cache, broadcast e AQE sem decorar regras universais.

Esta semana exige Spark real. Consulte [Cluster Mode Overview](https://spark.apache.org/docs/4.2.0/cluster-overview.html) e [Performance Tuning](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html). Use o livro *The Internals of Spark SQL* somente para aprofundar termos já vistos.

### Semana 4 — construir com qualidade

Objetivos:

- validar schema, unicidade, completude e regras de negócio;
- separar ingestão, transformação e saída;
- escrever testes de schema, conteúdo e casos de borda;
- entender idempotência na escrita de Parquet e tabelas;
- concluir um pipeline pequeno com validação e reconciliação;
- reconhecer Delta Lake como aprofundamento opcional, não como pré-requisito.

Não confunda “o notebook terminou” com “o pipeline está pronto para produção”. Registre entradas, contratos, falhas possíveis e como o resultado foi validado.

## Rotina diária de 60 minutos

| Minutos | Atividade | Evidência de aprendizagem |
| ---: | --- | --- |
| 0–5 | Retomada SQL. | Escreva o que já sabe sobre a operação da aula. |
| 5–15 | Conceito Spark. | Anote uma definição e o link da fonte versionada. |
| 15–25 | Solução SQL. | Resolva primeiro com a linguagem conhecida. |
| 25–40 | Tradução PySpark. | Relacione cada parte do SQL à API DataFrame. |
| 40–55 | Prática avaliada. | Execute, leia o diagnóstico e faça uma mudança própria. |
| 55–60 | Quiz e registro. | Registre uma conclusão e uma dúvida específica. |

Se o ambiente consumir a hora inteira com instalação, isso é preparação, não prática. Retome a mesma aula no dia seguinte.

## Perguntas de verificação

Ao terminar um assunto, tente responder sem consultar:

1. Qual problema esse recurso resolve?
2. Qual é a tradução aproximada entre SQL e PySpark?
3. Essa chamada é transformação ou ação?
4. O que pode causar shuffle?
5. Qual parte o Laboratório Semântico consegue realmente testar?
6. O que precisa ser confirmado no Spark real?
7. Qual documentação e versão sustentam minha resposta?

Uma resposta que inclui código, resultado observado e fonte versionada é mais confiável que uma definição memorizada.

## O que evitar

- misturar exemplos de versões diferentes sem perceber;
- copiar configurações de desempenho sem medir o próprio caso;
- aprender apenas a sintaxe PySpark e ignorar o plano de execução;
- interpretar resultado do DuckDB como prova de comportamento distribuído;
- depender de um único curso, vídeo ou gerador de código;
- usar dados confidenciais em serviços ou exercícios públicos;
- avançar para streaming, ML ou formatos de tabela antes de dominar DataFrames e Spark SQL.

## Referências internas

- [Laboratório Semântico](LABORATORIO_SEMANTICO.md)
- [Matriz de compatibilidade](COMPATIBILIDADE.md)
- [Instalação local gratuita](INSTALACAO_LOCAL.md)
- [Licenças e atribuições](LICENCAS_E_ATRIBUICOES.md)
- [Referências históricas do projeto](../REFERENCES.md)
