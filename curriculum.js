(function () {
  "use strict";

  const code = (lines) => lines.join("\n");

  const SOURCE = {
    docs: {
      label: "Documentação do Apache Spark 4.2.0",
      url: "https://spark.apache.org/docs/4.2.0/",
      type: "oficial"
    },
    quickstart: {
      label: "Quickstart de DataFrames no PySpark",
      url: "https://spark.apache.org/docs/4.2.0/api/python/getting_started/quickstart_df.html",
      type: "oficial"
    },
    userGuide: {
      label: "Guia de DataFrames PySpark",
      url: "https://spark.apache.org/docs/4.2.0/api/python/user_guide/dataframes.html",
      type: "oficial"
    },
    python: {
      label: "Tutorial oficial de Python",
      url: "https://docs.python.org/3/tutorial/",
      type: "oficial"
    },
    sqlGuide: {
      label: "Spark SQL, DataFrames and Datasets Guide",
      url: "https://spark.apache.org/docs/4.2.0/sql-programming-guide.html",
      type: "oficial"
    },
    sqlReference: {
      label: "Referência do Spark SQL",
      url: "https://spark.apache.org/docs/4.2.0/sql-ref.html",
      type: "oficial"
    },
    functions: {
      label: "Funções nativas do Spark SQL",
      url: "https://spark.apache.org/docs/4.2.0/sql-ref-functions-builtin.html",
      type: "oficial"
    },
    nulls: {
      label: "Semântica de NULL no Spark SQL",
      url: "https://spark.apache.org/docs/4.2.0/sql-ref-null-semantics.html",
      type: "oficial"
    },
    ansi: {
      label: "Conformidade ANSI do Spark SQL",
      url: "https://spark.apache.org/docs/4.2.0/sql-ref-ansi-compliance.html",
      type: "oficial"
    },
    dataSources: {
      label: "Fontes de dados do Spark SQL",
      url: "https://spark.apache.org/docs/4.2.0/sql-data-sources.html",
      type: "oficial"
    },
    cluster: {
      label: "Cluster Mode Overview",
      url: "https://spark.apache.org/docs/4.2.0/cluster-overview.html",
      type: "oficial"
    },
    performance: {
      label: "Spark SQL Performance Tuning",
      url: "https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html",
      type: "oficial"
    },
    webUi: {
      label: "Spark Web UI",
      url: "https://spark.apache.org/docs/4.2.0/web-ui.html",
      type: "oficial"
    },
    testing: {
      label: "Testing PySpark",
      url: "https://spark.apache.org/docs/4.2.0/api/python/getting_started/testing_pyspark.html",
      type: "oficial"
    },
    streaming: {
      label: "Structured Streaming Programming Guide",
      url: "https://spark.apache.org/docs/4.2.0/streaming/index.html",
      type: "oficial"
    },
    examples: {
      label: "Exemplos no repositório Apache Spark",
      url: "https://github.com/apache/spark/tree/v4.2.0/examples/src/main/python/sql",
      type: "open-source"
    },
    parquet: {
      label: "Documentação do Apache Parquet",
      url: "https://parquet.apache.org/docs/overview/",
      type: "open-source"
    },
    zoomcamp: {
      label: "Data Engineering Zoomcamp — Batch Processing",
      url: "https://github.com/DataTalksClub/data-engineering-zoomcamp/tree/main/06-batch",
      type: "gratuito"
    },
    sparkInternals: {
      label: "The Internals of Apache Spark",
      url: "https://github.com/japila-books/apache-spark-internals",
      type: "open-source"
    },
    sqlInternals: {
      label: "The Internals of Spark SQL",
      url: "https://github.com/japila-books/spark-sql-internals",
      type: "open-source"
    },
    chispa: {
      label: "chispa — testes de DataFrames",
      url: "https://github.com/MrPowers/chispa",
      type: "open-source"
    },
    nycTlc: {
      label: "NYC TLC Trip Record Data",
      url: "https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page",
      type: "dados-publicos"
    },
    delta: {
      label: "Documentação do Delta Lake",
      url: "https://docs.delta.io/",
      type: "open-source-opcional"
    }
  };

  function assessment(inputs, expectedSchema, expectedRows, edgeCases, planChecks) {
    return {
      entrypoint: "resultado",
      inputs,
      expectedSchema,
      expectedRows,
      edgeCases: edgeCases || [],
      planChecks: planChecks || [],
      checks: ["sintaxe suportada", "colunas de saída", "linhas da fixture", "ordenação declarada"]
    };
  }

  const lessons = [
    {
      id: 1,
      week: 1,
      title: "Spark para quem já conhece SQL",
      subtitle: "Da consulta em um banco para uma engine de processamento",
      objective: "Distinguir engine, armazenamento e linguagem e executar a primeira transformação Spark.",
      intro: "Apache Spark não é um banco de dados nem uma linguagem. É uma engine que lê dados de diferentes fontes, cria um plano de execução e processa esse plano localmente ou em várias máquinas.",
      analogy: "Em SQL, você descreve o resultado e o banco escolhe um plano. No Spark, você também descreve transformações; a diferença é que a engine foi desenhada para dividir o trabalho em partições e distribuí-lo quando necessário.",
      concepts: [
        { title: "Engine", text: "Executa transformações e ações sobre dados, mas não precisa ser o local permanente de armazenamento." },
        { title: "SQL e PySpark", text: "São duas interfaces para expressar planos que podem ser analisados pela mesma engine Spark SQL." },
        { title: "Local e cluster", text: "O mesmo código pode usar threads de uma máquina ou recursos de um cluster, respeitadas as diferenças de ambiente." },
        { title: "Driver e executors", text: "O driver coordena o plano; executors realizam tasks sobre partições. Por enquanto, basta reconhecer os papéis." }
      ],
      sql: code([
        "-- A intenção conhecida: resumir vendas por categoria",
        "SELECT categoria, SUM(valor) AS faturamento",
        "FROM vendas",
        "GROUP BY categoria;"
      ]),
      pyspark: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    vendas.groupBy(\"categoria\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        ")",
        "",
        "resultado.show()"
      ]),
      exercise: "Crie spark.range(3), renomeie id para numero, acrescente dobro = numero * 2 e grave o DataFrame em resultado.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = spark.range(3)"
      ]),
      hint: "Use withColumnRenamed para id e withColumn com F.col para calcular dobro.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    spark.range(3)",
        "    .withColumnRenamed(\"id\", \"numero\")",
        "    .withColumn(\"dobro\", F.col(\"numero\") * 2)",
        "    .orderBy(\"numero\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT numero",
        "FROM VALUES (0), (1), (2) AS numeros(numero);"
      ]),
      sqlSolution: code([
        "SELECT numero, numero * 2 AS dobro",
        "FROM VALUES (0), (1), (2) AS numeros(numero)",
        "ORDER BY numero;"
      ]),
      expected: {
        columns: ["numero", "dobro"],
        rows: [[0, 0], [1, 2], [2, 4]],
        ordered: true
      },
      tables: [],
      assessment: assessment(
        [{ name: "spark", schema: "SparkSession local; sem DataFrame de entrada" }],
        "numero: long non-null, dobro: long non-null",
        [{ numero: 0, dobro: 0 }, { numero: 1, dobro: 2 }, { numero: 2, dobro: 4 }],
        ["A função deve devolver um DataFrame, não uma lista.", "A solução não deve depender da ordem física das partições."]
      ),
      sources: [SOURCE.docs, SOURCE.quickstart, SOURCE.zoomcamp],
      quiz: {
        question: "Qual descrição é correta?",
        options: ["Spark é um banco relacional", "PySpark substitui SQL", "Spark é uma engine que pode executar planos descritos em SQL ou PySpark", "Spark exige sempre várias máquinas"],
        correct: 2,
        explanation: "Spark é uma engine. SQL e PySpark são interfaces, e o modo local permite estudar sem um cluster real."
      }
    },
    {
      id: 2,
      week: 1,
      title: "SparkSession, DataFrame e temp view",
      subtitle: "A ponte mais curta entre uma tabela SQL e o Spark",
      objective: "Reconhecer SparkSession, criar uma temp view e consultar um DataFrame com Spark SQL.",
      intro: "SparkSession é a porta de entrada da aplicação. Um DataFrame possui linhas, colunas e schema; uma temp view dá a esse DataFrame um nome que pode ser usado em uma consulta SQL durante a sessão.",
      analogy: "Uma temp view se parece com uma view de sessão: ela não copia os dados, apenas registra um nome para o plano representado pelo DataFrame.",
      concepts: [
        { title: "SparkSession", text: "Cria DataFrames, acessa fontes, executa SQL e controla configurações da sessão." },
        { title: "DataFrame", text: "Representa dados tabulares e um plano de transformação; operações devolvem novos DataFrames." },
        { title: "Schema", text: "Define nomes, tipos e nulabilidade. printSchema ajuda a inspecioná-lo." },
        { title: "Temp view", text: "Existe durante a sessão e permite alternar entre SQL e DataFrame API sem trocar de engine." }
      ],
      sql: code([
        "SELECT id_cliente, nome",
        "FROM clientes",
        "WHERE ativo = true",
        "ORDER BY id_cliente;"
      ]),
      pyspark: code([
        "clientes.createOrReplaceTempView(\"clientes\")",
        "",
        "resultado = spark.sql(\"\"\"",
        "  SELECT id_cliente, nome",
        "  FROM clientes",
        "  WHERE ativo = true",
        "  ORDER BY id_cliente",
        "\"\"\")"
      ]),
      exercise: "Registre clientes como vw_clientes e grave em resultado uma consulta spark.sql com id_cliente e nome dos ativos, ordenados por id_cliente.",
      starter: code([
        "clientes.createOrReplaceTempView(\"vw_clientes\")",
        "",
        "resultado = clientes"
      ]),
      hint: "Use clientes.createOrReplaceTempView e clientes.sparkSession.sql.",
      solution: code([
        "clientes.createOrReplaceTempView(\"vw_clientes\")",
        "resultado = clientes.sparkSession.sql(\"\"\"",
        "    SELECT id_cliente, nome",
        "    FROM vw_clientes",
        "    WHERE ativo = true",
        "    ORDER BY id_cliente",
        "\"\"\")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_cliente, nome, ativo",
        "FROM clientes;"
      ]),
      sqlSolution: code([
        "SELECT id_cliente, nome",
        "FROM clientes",
        "WHERE ativo = true",
        "ORDER BY id_cliente;"
      ]),
      expected: {
        columns: ["id_cliente", "nome"],
        rows: [[1, "Ana"], [3, "Caio"]],
        ordered: true
      },
      tables: [
        { name: "clientes", columns: ["id_cliente", "nome", "ativo"], rows: [[2, "Bia", false], [1, "Ana", true], [3, "Caio", true]] }
      ],
      assessment: assessment(
        [{ name: "clientes", schema: "id_cliente: long, nome: string, ativo: boolean; [(2,'Bia',false),(1,'Ana',true),(3,'Caio',true)]" }],
        "id_cliente: long, nome: string",
        [{ id_cliente: 1, nome: "Ana" }, { id_cliente: 3, nome: "Caio" }],
        ["Nenhum cliente ativo deve produzir DataFrame vazio com o mesmo schema.", "Colunas extras não fazem parte do contrato."]
      ),
      sources: [SOURCE.quickstart, SOURCE.sqlGuide, SOURCE.examples],
      quiz: {
        question: "O que createOrReplaceTempView faz?",
        options: ["Grava uma tabela permanente", "Associa um nome temporário a um DataFrame", "Converte o DataFrame em lista Python", "Inicia um novo cluster"],
        correct: 1,
        explanation: "A temp view permite consultar o DataFrame com SQL durante a sessão e não implica gravação permanente."
      }
    },
    {
      id: 3,
      week: 1,
      title: "Python mínimo para PySpark",
      subtitle: "Ler imports, funções, métodos e encadeamentos sem estudar Python inteiro",
      objective: "Interpretar a sintaxe Python usada na DataFrame API e escrever uma transformação simples.",
      intro: "Para começar com PySpark, você não precisa dominar Python avançado. Precisa reconhecer imports, variáveis, funções, indentação, argumentos nomeados e chamadas de método.",
      analogy: "Uma sequência de métodos é semelhante a uma cadeia de CTEs: cada etapa recebe um resultado tabular e descreve a próxima transformação.",
      concepts: [
        { title: "Import", text: "from pyspark.sql import functions as F cria um apelido para as funções nativas." },
        { title: "Função", text: "def agrupa entradas e devolve uma saída reutilizável; return entrega o DataFrame resultante." },
        { title: "Método", text: "produtos.select(...) chama uma operação pertencente ao DataFrame produtos." },
        { title: "Imutabilidade", text: "withColumn não altera o objeto original; produz um novo DataFrame." }
      ],
      sql: code([
        "SELECT id_produto,",
        "       quantidade * preco_unitario AS subtotal",
        "FROM itens;"
      ]),
      pyspark: code([
        "from pyspark.sql import functions as F",
        "",
        "def calcular_subtotal(itens):",
        "    return itens.select(",
        "        \"id_produto\",",
        "        (F.col(\"quantidade\") * F.col(\"preco_unitario\")).alias(\"subtotal\")",
        "    )"
      ]),
      exercise: "Grave em resultado id_produto e subtotal = quantidade * preco_unitario. Preserve o DataFrame de entrada.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = itens"
      ]),
      hint: "Dentro de select, uma expressão de coluna pode receber alias.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = itens.select(",
        "    \"id_produto\",",
        "    (F.col(\"quantidade\") * F.col(\"preco_unitario\")).alias(\"subtotal\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT * FROM itens;"
      ]),
      sqlSolution: code([
        "SELECT id_produto, quantidade * preco_unitario AS subtotal",
        "FROM itens;"
      ]),
      expected: {
        columns: ["id_produto", "subtotal"],
        rows: [[10, 15.0], [20, 12.0]],
        ordered: false
      },
      tables: [
        { name: "itens", columns: ["id_produto", "quantidade", "preco_unitario"], rows: [[10, 2, 7.5], [20, 3, 4.0]] }
      ],
      assessment: assessment(
        [{ name: "itens", schema: "id_produto: long, quantidade: long, preco_unitario: double; [(10,2,7.5),(20,3,4.0)]" }],
        "id_produto: long, subtotal: double",
        [{ id_produto: 10, subtotal: 15.0 }, { id_produto: 20, subtotal: 12.0 }],
        ["Entrada vazia deve manter o schema de saída.", "Quantidade zero deve resultar em subtotal 0.0."]
      ),
      sources: [SOURCE.python, SOURCE.userGuide, SOURCE.quickstart],
      quiz: {
        question: "O que withColumn retorna?",
        options: ["O mesmo DataFrame alterado internamente", "Um novo DataFrame", "Uma lista Python", "Uma instrução SQL em texto"],
        correct: 1,
        explanation: "DataFrames são imutáveis do ponto de vista da API: transformações devolvem novos DataFrames."
      }
    },
    {
      id: 4,
      week: 1,
      title: "SELECT, WHERE e ORDER BY",
      subtitle: "Traduzindo operações SQL para a DataFrame API",
      objective: "Selecionar, filtrar, renomear e ordenar colunas usando expressões PySpark.",
      intro: "As operações relacionais mais frequentes têm equivalentes diretos. O desafio inicial é lembrar que comparações em PySpark produzem expressões de coluna, não valores booleanos Python comuns.",
      analogy: "select corresponde à projeção, filter ou where à seleção de linhas, alias ao AS e orderBy ao ORDER BY.",
      concepts: [
        { title: "F.col", text: "Cria uma referência explícita a uma coluna e permite compor expressões." },
        { title: "filter / where", text: "Recebem uma expressão de coluna booleana e são equivalentes." },
        { title: "Operadores", text: "Use &, | e ~ para combinar condições, sempre com parênteses." },
        { title: "Ordenação", text: "orderBy define uma ordem no resultado; sem ele, a ordem de linhas não é garantida." }
      ],
      sql: code([
        "SELECT nome, estado",
        "FROM clientes",
        "WHERE estado = 'SP' AND ativo = true",
        "ORDER BY nome;"
      ]),
      pyspark: code([
        "resultado = (",
        "    clientes",
        "    .filter((F.col(\"estado\") == \"SP\") & F.col(\"ativo\"))",
        "    .select(\"nome\", \"estado\")",
        "    .orderBy(\"nome\")",
        ")"
      ]),
      exercise: "Mantenha clientes ativos de SP e grave em resultado somente nome e estado, ordenados por nome.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = clientes"
      ]),
      hint: "Aplique filter antes de select e finalize com orderBy.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    clientes",
        "    .filter((F.col(\"estado\") == \"SP\") & (F.col(\"ativo\") == True))",
        "    .select(\"nome\", \"estado\")",
        "    .orderBy(\"nome\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT nome, estado FROM clientes;"
      ]),
      sqlSolution: code([
        "SELECT nome, estado",
        "FROM clientes",
        "WHERE estado = 'SP' AND ativo = true",
        "ORDER BY nome;"
      ]),
      expected: {
        columns: ["nome", "estado"],
        rows: [["Ana", "SP"], ["Zeca", "SP"]],
        ordered: true
      },
      tables: [
        { name: "clientes", columns: ["nome", "estado", "ativo"], rows: [["Zeca", "SP", true], ["Ana", "SP", true], ["Bia", "RJ", true], ["Caio", "SP", false]] }
      ],
      assessment: assessment(
        [{ name: "clientes", schema: "nome: string, estado: string, ativo: boolean; [('Zeca','SP',true),('Ana','SP',true),('Bia','RJ',true),('Caio','SP',false)]" }],
        "nome: string, estado: string",
        [{ nome: "Ana", estado: "SP" }, { nome: "Zeca", estado: "SP" }],
        ["Nome nulo continua válido se estado e ativo atenderem ao filtro.", "Entrada vazia deve devolver DataFrame vazio."]
      ),
      sources: [SOURCE.quickstart, SOURCE.userGuide, SOURCE.functions],
      quiz: {
        question: "Como combinar duas condições de coluna com E lógico?",
        options: ["condicao1 and condicao2", "condicao1 && condicao2", "(condicao1) & (condicao2)", "AND(condicao1, condicao2)"],
        correct: 2,
        explanation: "Na DataFrame API, use & e coloque cada comparação entre parênteses."
      }
    },
    {
      id: 5,
      week: 1,
      title: "Schema, tipos, NULL e modo ANSI",
      subtitle: "O contrato que evita resultados silenciosamente errados",
      objective: "Converter tipos, tratar nulos com intenção e reconhecer erros produzidos pelo modo ANSI.",
      intro: "Um schema incorreto muda a semântica das operações. Spark SQL usa regras explícitas de tipos e nulos; no modo ANSI, entradas inválidas tendem a produzir erros em vez de resultados silenciosos.",
      analogy: "CAST, COALESCE e CASE WHEN já fazem parte do repertório SQL. No PySpark, cast, coalesce e when constroem as mesmas expressões no plano.",
      concepts: [
        { title: "cast", text: "Converte uma expressão para outro tipo; conversões inválidas podem falhar no modo ANSI." },
        { title: "NULL", text: "Representa valor desconhecido. Comparações comuns com nulo não retornam true." },
        { title: "coalesce", text: "Retorna o primeiro valor não nulo entre suas expressões." },
        { title: "Schema explícito", text: "Evita inferências inconsistentes e documenta o contrato de entrada." }
      ],
      sql: code([
        "SELECT id_item,",
        "       quantidade * COALESCE(CAST(preco AS DOUBLE), 0.0) AS valor",
        "FROM itens;"
      ]),
      pyspark: code([
        "resultado = itens.select(",
        "    \"id_item\",",
        "    (",
        "        F.col(\"quantidade\") *",
        "        F.coalesce(F.col(\"preco\").cast(\"double\"), F.lit(0.0))",
        "    ).alias(\"valor\")",
        ")"
      ]),
      exercise: "Converta preco string para double, use 0.0 quando for nulo e grave em resultado id_item e valor = quantidade * preco convertido.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = itens"
      ]),
      hint: "Crie a expressão de preço com F.coalesce(F.col('preco').cast('double'), F.lit(0.0)).",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "preco = F.coalesce(F.col(\"preco\").cast(\"double\"), F.lit(0.0))",
        "resultado = itens.select(",
        "    \"id_item\",",
        "    (F.col(\"quantidade\") * preco).alias(\"valor\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_item, quantidade, preco FROM itens;"
      ]),
      sqlSolution: code([
        "SELECT id_item,",
        "       quantidade * COALESCE(CAST(preco AS DOUBLE), 0.0) AS valor",
        "FROM itens;"
      ]),
      expected: {
        columns: ["id_item", "valor"],
        rows: [[1, 21.0], [2, 0.0], [3, 0.0]],
        ordered: false
      },
      tables: [
        { name: "itens", columns: ["id_item", "quantidade", "preco"], rows: [[1, 2, "10.50"], [2, 3, null], [3, 0, "7.00"]] }
      ],
      assessment: assessment(
        [{ name: "itens", schema: "id_item: long, quantidade: long, preco: string; [(1,2,'10.50'),(2,3,null),(3,0,'7.00')]" }],
        "id_item: long, valor: double",
        [{ id_item: 1, valor: 21.0 }, { id_item: 2, valor: 0.0 }, { id_item: 3, valor: 0.0 }],
        ["Com ANSI ativo, texto não numérico deve produzir erro de cast explicável.", "Preço nulo deve virar 0.0; quantidade nula permanece nula."]
      ),
      sources: [SOURCE.userGuide, SOURCE.nulls, SOURCE.ansi],
      quiz: {
        question: "Qual afirmação sobre NULL está correta?",
        options: ["NULL = NULL sempre é true", "COUNT(coluna) conta todos os nulos", "COALESCE pode escolher o primeiro valor não nulo", "NULL é o mesmo que zero"],
        correct: 2,
        explanation: "COALESCE percorre as expressões e retorna a primeira não nula. NULL não equivale a zero nem a string vazia."
      }
    },
    {
      id: 6,
      week: 2,
      title: "Ler CSV, JSON e Parquet",
      subtitle: "Transformar arquivos em DataFrames com schema previsível",
      objective: "Usar DataFrameReader, opções de leitura e schema explícito e explicar por que Parquet favorece análise.",
      intro: "Arquivos não carregam todos o mesmo nível de informação. CSV precisa de opções e tipos; JSON pode conter estruturas; Parquet preserva schema e organiza valores por coluna.",
      analogy: "Uma tabela possui catálogo e tipos. Ao ler um arquivo, você precisa fornecer ou recuperar esse contrato antes de tratá-lo como uma relação confiável.",
      concepts: [
        { title: "DataFrameReader", text: "spark.read configura formato, opções, schema e caminho antes de criar o DataFrame." },
        { title: "Schema explícito", text: "Evita inferir tipos a cada leitura e faz entradas inválidas aparecerem de forma previsível." },
        { title: "CSV e JSON", text: "São formatos textuais; opções como header, sep e dateFormat mudam a interpretação." },
        { title: "Parquet", text: "É colunar, tipado e comprimido, permitindo ler apenas colunas necessárias em muitos cenários." }
      ],
      sql: code([
        "SELECT id_pedido, status",
        "FROM pedidos_arquivo",
        "WHERE status = 'APROVADO';"
      ]),
      pyspark: code([
        "pedidos = (",
        "    spark.read.schema(schema)",
        "    .option(\"header\", True)",
        "    .option(\"sep\", \";\")",
        "    .csv(caminho)",
        ")",
        "resultado = pedidos.select(\"id_pedido\", \"status\")"
      ]),
      exercise: "Leia o CSV indicado por caminho com cabeçalho, separador ponto e vírgula e o schema fornecido. Devolva apenas id_pedido e status na variável resultado.",
      starter: code([
        "pedidos = (",
        "    spark.read.schema(schema)",
        "    # configure header, separador e leitura",
        ")",
        "resultado = pedidos"
      ]),
      hint: "Encadeie option('header', True), option('sep', ';'), csv(caminho) e select.",
      solution: code([
        "pedidos = (",
        "    spark.read.schema(schema)",
        "    .option(\"header\", True)",
        "    .option(\"sep\", \";\")",
        "    .csv(caminho)",
        ")",
        "resultado = pedidos.select(\"id_pedido\", \"status\")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT *",
        "FROM pedidos_arquivo;"
      ]),
      sqlSolution: code([
        "SELECT id_pedido, status",
        "FROM pedidos_arquivo;"
      ]),
      expected: {
        columns: ["id_pedido", "status"],
        rows: [[1, "APROVADO"], [2, "PENDENTE"]],
        ordered: false
      },
      tables: [
        {
          name: "pedidos_arquivo",
          columns: ["id_pedido", "status", "valor"],
          rows: [[1, "APROVADO", 10.5], [2, "PENDENTE", 7.0]]
        }
      ],
      assessment: assessment(
        [
          { name: "caminho", schema: "CSV temporário: id_pedido;status;valor com duas linhas" },
          { name: "schema", schema: "id_pedido: long non-null, status: string, valor: double" }
        ],
        "id_pedido: long, status: string",
        [{ id_pedido: 1, status: "APROVADO" }, { id_pedido: 2, status: "PENDENTE" }],
        ["Arquivo apenas com cabeçalho deve gerar DataFrame vazio.", "Separador incorreto deve ser diagnosticado pelo schema/resultado."]
      ),
      sources: [SOURCE.dataSources, SOURCE.parquet, SOURCE.zoomcamp],
      quiz: {
        question: "Qual vantagem central do Parquet para análise?",
        options: ["É sempre legível em editor de texto", "Não possui schema", "É colunar e preserva tipos", "Dispensa validação"],
        correct: 2,
        explanation: "Parquet armazena dados por coluna e preserva tipos, favorecendo leitura seletiva e compressão."
      }
    },
    {
      id: 7,
      week: 2,
      title: "Expressões, strings e datas",
      subtitle: "Usar funções nativas antes de pensar em UDF",
      objective: "Limpar texto e converter datas com funções que o Spark consegue analisar.",
      intro: "Funções nativas viram expressões no plano Spark. Elas são preferíveis a funções Python linha a linha porque preservam informação para análise e otimização.",
      analogy: "Assim como funções SQL aparecem na árvore da consulta, F.trim, F.upper e F.to_date ficam visíveis para o otimizador.",
      concepts: [
        { title: "Funções nativas", text: "Operam como expressões distribuídas conhecidas pelo Catalyst." },
        { title: "withColumn", text: "Adiciona ou substitui uma coluna em um novo DataFrame." },
        { title: "when / otherwise", text: "Representa CASE WHEN na DataFrame API." },
        { title: "Datas tipadas", text: "to_date e to_timestamp convertem strings usando formato explícito." }
      ],
      sql: code([
        "SELECT id_cliente,",
        "       UPPER(TRIM(nome)) AS nome_normalizado,",
        "       TO_DATE(data_cadastro, 'yyyy-MM-dd') AS data_cadastro",
        "FROM clientes;"
      ]),
      pyspark: code([
        "resultado = clientes.select(",
        "    \"id_cliente\",",
        "    F.upper(F.trim(\"nome\")).alias(\"nome_normalizado\"),",
        "    F.to_date(\"data_cadastro\", \"yyyy-MM-dd\").alias(\"data_cadastro\")",
        ")"
      ]),
      exercise: "Crie resultado com id_cliente, nome_normalizado em maiúsculas sem espaços externos e data_cadastro convertida do formato yyyy-MM-dd.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = clientes"
      ]),
      hint: "Combine F.upper(F.trim('nome')) e F.to_date('data_cadastro', 'yyyy-MM-dd').",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = clientes.select(",
        "    \"id_cliente\",",
        "    F.upper(F.trim(\"nome\")).alias(\"nome_normalizado\"),",
        "    F.to_date(\"data_cadastro\", \"yyyy-MM-dd\").alias(\"data_cadastro\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_cliente, nome, data_cadastro",
        "FROM clientes;"
      ]),
      sqlSolution: code([
        "SELECT id_cliente,",
        "       UPPER(TRIM(nome)) AS nome_normalizado,",
        "       TO_DATE(data_cadastro, 'yyyy-MM-dd') AS data_cadastro",
        "FROM clientes;"
      ]),
      expected: {
        columns: ["id_cliente", "nome_normalizado", "data_cadastro"],
        rows: [[1, "ANA", "2026-01-05"], [2, null, "2026-02-10"]],
        ordered: false
      },
      tables: [
        {
          name: "clientes",
          columns: ["id_cliente", "nome", "data_cadastro"],
          rows: [[1, " Ana ", "2026-01-05"], [2, null, "2026-02-10"]]
        }
      ],
      assessment: assessment(
        [{ name: "clientes", schema: "id_cliente: long, nome: string, data_cadastro: string" }],
        "id_cliente: long, nome_normalizado: string, data_cadastro: date",
        [{ id_cliente: 1, nome_normalizado: "ANA", data_cadastro: "2026-01-05" }, { id_cliente: 2, nome_normalizado: null, data_cadastro: "2026-02-10" }],
        ["Nome nulo deve continuar nulo.", "Data inválida deve seguir a política ANSI configurada."]
      ),
      sources: [SOURCE.functions, SOURCE.userGuide, SOURCE.ansi],
      quiz: {
        question: "Por que preferir uma função nativa do Spark a uma UDF Python simples?",
        options: ["Só funciona localmente", "O Catalyst entende e pode otimizar a expressão", "UDF sempre retorna string", "Elimina qualquer shuffle"],
        correct: 1,
        explanation: "Expressões nativas permanecem visíveis no plano e evitam uma fronteira Python desnecessária."
      }
    },
    {
      id: 8,
      week: 2,
      title: "Agregações e granularidade",
      subtitle: "GROUP BY com resultados que podem ser reconciliados",
      objective: "Calcular contagens e somas por grupo e validar a mudança de granularidade.",
      intro: "Agregação reduz várias linhas a uma linha por combinação de chaves. Antes de escrever métricas, declare o que cada linha final representa.",
      analogy: "Em SQL, toda coluna selecionada fora de uma função agregadora participa do agrupamento. groupBy e agg expressam a mesma regra.",
      concepts: [
        { title: "Granularidade", text: "Define o que uma linha representa no resultado." },
        { title: "groupBy", text: "Escolhe as chaves que formarão os grupos." },
        { title: "agg", text: "Reúne expressões agregadoras com aliases claros." },
        { title: "Nulos", text: "COUNT(*) conta linhas; COUNT(coluna) ignora valores nulos." }
      ],
      sql: code([
        "SELECT status, COUNT(*) AS quantidade_pedidos,",
        "       SUM(quantidade * preco_unitario) AS faturamento",
        "FROM itens GROUP BY status ORDER BY status;"
      ]),
      pyspark: code([
        "resultado = (",
        "    itens.withColumn(\"valor\", F.col(\"quantidade\") * F.col(\"preco_unitario\"))",
        "    .groupBy(\"status\")",
        "    .agg(",
        "        F.count(\"*\").alias(\"quantidade_pedidos\"),",
        "        F.sum(\"valor\").alias(\"faturamento\")",
        "    )",
        "    .orderBy(\"status\")",
        ")"
      ]),
      exercise: "Crie valor, agrupe por status e grave em resultado as colunas status, quantidade_pedidos e faturamento, ordenadas por status.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = itens"
      ]),
      hint: "Crie valor antes de groupBy; em agg use count('*') e sum('valor').",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    itens.withColumn(\"valor\", F.col(\"quantidade\") * F.col(\"preco_unitario\"))",
        "    .groupBy(\"status\")",
        "    .agg(",
        "        F.count(\"*\").alias(\"quantidade_pedidos\"),",
        "        F.sum(\"valor\").alias(\"faturamento\")",
        "    )",
        "    .orderBy(\"status\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT status, COUNT(*) AS quantidade_pedidos",
        "FROM itens GROUP BY status;"
      ]),
      sqlSolution: code([
        "SELECT status, COUNT(*) AS quantidade_pedidos,",
        "       SUM(quantidade * preco_unitario) AS faturamento",
        "FROM itens GROUP BY status ORDER BY status;"
      ]),
      expected: {
        columns: ["status", "quantidade_pedidos", "faturamento"],
        rows: [["APROVADO", 2, 25.0], ["PENDENTE", 1, 6.0]],
        ordered: true
      },
      tables: [
        {
          name: "itens",
          columns: ["status", "quantidade", "preco_unitario"],
          rows: [["APROVADO", 2, 10.0], ["APROVADO", 1, 5.0], ["PENDENTE", 3, 2.0]]
        }
      ],
      assessment: assessment(
        [{ name: "itens", schema: "status: string, quantidade: long, preco_unitario: double" }],
        "status: string, quantidade_pedidos: long, faturamento: double",
        [{ status: "APROVADO", quantidade_pedidos: 2, faturamento: 25.0 }, { status: "PENDENTE", quantidade_pedidos: 1, faturamento: 6.0 }],
        ["Entrada vazia preserva o schema.", "Um grupo com todos os valores nulos mantém a semântica de SUM."]
      ),
      sources: [SOURCE.sqlGuide, SOURCE.functions, SOURCE.nulls],
      quiz: {
        question: "Após agrupar apenas por status, o que uma linha representa?",
        options: ["Um item", "Um cliente", "Um grupo de linhas com o mesmo status", "Uma partição física"],
        correct: 2,
        explanation: "As chaves do groupBy definem a granularidade lógica."
      }
    },
    {
      id: 9,
      week: 2,
      title: "Joins e cardinalidade",
      subtitle: "Combinar relações sem multiplicar resultados por acidente",
      objective: "Executar left join e validar chaves, nulos e quantidade de linhas.",
      intro: "Se a chave do lado que deveria ser único estiver duplicada, cada correspondência cria uma nova linha. O Spark executa a relação descrita; o contrato de cardinalidade é responsabilidade do pipeline.",
      analogy: "É o mesmo comportamento de um join SQL. A consulta pode estar sintaticamente correta e ainda assim produzir totais errados.",
      concepts: [
        { title: "Inner join", text: "Mantém linhas com correspondência nos dois lados." },
        { title: "Left join", text: "Preserva a esquerda e usa nulos quando não encontra correspondência." },
        { title: "Cardinalidade", text: "Declara quantas correspondências podem existir por chave." },
        { title: "Reconciliação", text: "Compare contagem, chaves ausentes e totais antes e depois." }
      ],
      sql: code([
        "SELECT p.id_pedido, p.id_cliente, c.estado",
        "FROM pedidos p LEFT JOIN clientes c",
        "  ON p.id_cliente = c.id_cliente",
        "ORDER BY p.id_pedido;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.join(",
        "        clientes.select(\"id_cliente\", \"estado\"),",
        "        on=\"id_cliente\", how=\"left\"",
        "    )",
        "    .select(\"id_pedido\", \"id_cliente\", \"estado\")",
        "    .orderBy(\"id_pedido\")",
        ")"
      ]),
      exercise: "Faça left join de pedidos com clientes por id_cliente e grave em resultado id_pedido, id_cliente e estado, ordenados por id_pedido.",
      starter: code([
        "resultado = pedidos"
      ]),
      hint: "Selecione id_cliente e estado do lado direito antes do join.",
      solution: code([
        "resultado = (",
        "    pedidos.join(",
        "        clientes.select(\"id_cliente\", \"estado\"),",
        "        on=\"id_cliente\", how=\"left\"",
        "    )",
        "    .select(\"id_pedido\", \"id_cliente\", \"estado\")",
        "    .orderBy(\"id_pedido\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT p.id_pedido, p.id_cliente",
        "FROM pedidos p;"
      ]),
      sqlSolution: code([
        "SELECT p.id_pedido, p.id_cliente, c.estado",
        "FROM pedidos p LEFT JOIN clientes c",
        "  ON p.id_cliente = c.id_cliente",
        "ORDER BY p.id_pedido;"
      ]),
      expected: {
        columns: ["id_pedido", "id_cliente", "estado"],
        rows: [[10, 1, "SP"], [20, 2, "RJ"], [30, 99, null]],
        ordered: true
      },
      tables: [
        { name: "pedidos", columns: ["id_pedido", "id_cliente"], rows: [[10, 1], [20, 2], [30, 99]] },
        { name: "clientes", columns: ["id_cliente", "estado"], rows: [[1, "SP"], [2, "RJ"]] }
      ],
      assessment: assessment(
        [
          { name: "pedidos", schema: "id_pedido: long, id_cliente: long" },
          { name: "clientes", schema: "id_cliente: long, estado: string" }
        ],
        "id_pedido: long, id_cliente: long, estado: string",
        [{ id_pedido: 10, id_cliente: 1, estado: "SP" }, { id_pedido: 20, id_cliente: 2, estado: "RJ" }, { id_pedido: 30, id_cliente: 99, estado: null }],
        ["Cliente ausente preserva o pedido.", "Chave duplicada em clientes deve ser detectada por validação de cardinalidade."]
      ),
      sources: [SOURCE.userGuide, SOURCE.sqlGuide, SOURCE.zoomcamp],
      quiz: {
        question: "Por que um left join pode aumentar a quantidade de linhas?",
        options: ["Sempre replica a esquerda", "Uma chave da esquerda pode encontrar várias linhas à direita", "Nulos são removidos", "Todo join usa broadcast"],
        correct: 1,
        explanation: "Uma relação um-para-muitos gera uma linha para cada correspondência."
      }
    },
    {
      id: 10,
      week: 2,
      title: "Janelas e deduplicação determinística",
      subtitle: "Escolher explicitamente qual versão deve permanecer",
      objective: "Usar Window e row_number para manter a versão mais recente de cada chave.",
      intro: "dropDuplicates não expressa qual registro deve vencer. Uma janela ordenada torna a regra de escolha explícita e testável.",
      analogy: "É o padrão SQL ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...), seguido por rn = 1.",
      concepts: [
        { title: "partitionBy lógico", text: "Na Window, define grupos de cálculo; não reparticiona fisicamente por si só." },
        { title: "orderBy da janela", text: "Define prioridade dentro de cada chave." },
        { title: "row_number", text: "Numera linhas para selecionar a primeira." },
        { title: "Desempate", text: "Uma ordenação total evita escolhas instáveis." }
      ],
      sql: code([
        "WITH versoes AS (",
        "  SELECT *, ROW_NUMBER() OVER (",
        "    PARTITION BY id_cliente",
        "    ORDER BY atualizado_em DESC, id_evento DESC",
        "  ) AS rn FROM historico",
        ")",
        "SELECT id_cliente, nome, atualizado_em",
        "FROM versoes WHERE rn = 1 ORDER BY id_cliente;"
      ]),
      pyspark: code([
        "janela = Window.partitionBy(\"id_cliente\").orderBy(",
        "    F.col(\"atualizado_em\").desc(), F.col(\"id_evento\").desc()",
        ")",
        "resultado = (",
        "    historico.withColumn(\"rn\", F.row_number().over(janela))",
        "    .filter(F.col(\"rn\") == 1)",
        "    .select(\"id_cliente\", \"nome\", \"atualizado_em\")",
        "    .orderBy(\"id_cliente\")",
        ")"
      ]),
      exercise: "Para cada id_cliente, mantenha a linha mais recente por atualizado_em; em empate use maior id_evento. Grave o resultado ordenado por id_cliente.",
      starter: code([
        "from pyspark.sql import functions as F",
        "from pyspark.sql.window import Window",
        "",
        "resultado = historico"
      ]),
      hint: "Crie uma Window com dois critérios descendentes, numere e filtre rn == 1.",
      solution: code([
        "from pyspark.sql import functions as F",
        "from pyspark.sql.window import Window",
        "",
        "janela = Window.partitionBy(\"id_cliente\").orderBy(",
        "    F.col(\"atualizado_em\").desc(), F.col(\"id_evento\").desc()",
        ")",
        "resultado = (",
        "    historico.withColumn(\"rn\", F.row_number().over(janela))",
        "    .filter(F.col(\"rn\") == 1)",
        "    .select(\"id_cliente\", \"nome\", \"atualizado_em\")",
        "    .orderBy(\"id_cliente\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_cliente, nome, atualizado_em",
        "FROM historico;"
      ]),
      sqlSolution: code([
        "WITH versoes AS (",
        "  SELECT *, ROW_NUMBER() OVER (",
        "    PARTITION BY id_cliente",
        "    ORDER BY atualizado_em DESC, id_evento DESC",
        "  ) AS rn FROM historico",
        ")",
        "SELECT id_cliente, nome, atualizado_em",
        "FROM versoes WHERE rn = 1 ORDER BY id_cliente;"
      ]),
      expected: {
        columns: ["id_cliente", "nome", "atualizado_em"],
        rows: [[10, "Ana B", "2026-02-01 00:00:00"], [20, "Caio", "2026-01-05 00:00:00"]],
        ordered: true
      },
      tables: [
        {
          name: "historico",
          columns: ["id_evento", "id_cliente", "nome", "atualizado_em"],
          rows: [[1, 10, "Ana", "2026-01-01 00:00:00"], [2, 10, "Ana B", "2026-02-01 00:00:00"], [3, 20, "Caio", "2026-01-05 00:00:00"]]
        }
      ],
      assessment: assessment(
        [{ name: "historico", schema: "id_evento: long, id_cliente: long, nome: string, atualizado_em: timestamp" }],
        "id_cliente: long, nome: string, atualizado_em: timestamp",
        [{ id_cliente: 10, nome: "Ana B", atualizado_em: "2026-02-01 00:00:00" }, { id_cliente: 20, nome: "Caio", atualizado_em: "2026-01-05 00:00:00" }],
        ["Empate em timestamp escolhe maior id_evento.", "Uma única versão é preservada."]
      ),
      sources: [SOURCE.functions, SOURCE.sqlGuide, SOURCE.userGuide],
      quiz: {
        question: "Por que incluir um critério de desempate?",
        options: ["Evitar qualquer shuffle", "Garantir escolha determinística entre timestamps iguais", "Converter timestamp", "Aumentar linhas"],
        correct: 1,
        explanation: "Sem ordenação total, linhas empatadas podem trocar de posição."
      }
    },
    {
      id: 11,
      week: 3,
      title: "Lazy evaluation, actions, jobs e stages",
      subtitle: "O código descreve um plano antes de processar dados",
      objective: "Distinguir transformations de actions e relacionar uma action a jobs, stages e tasks.",
      intro: "select, filter e join criam novos planos sem exigir imediatamente um resultado. Uma action pede dados e faz o Spark organizar o trabalho em jobs, stages e tasks.",
      analogy: "Um banco não executa SELECT, WHERE e GROUP BY isoladamente na ordem digitada. Ele analisa a consulta como um plano; o Spark também observa o conjunto antes de executar.",
      concepts: [
        { title: "Transformation", text: "Descreve um novo DataFrame e mantém a avaliação adiada." },
        { title: "Action", text: "Solicita um resultado, como count, collect, show ou write." },
        { title: "Job e stage", text: "Uma action pode criar jobs; fronteiras de shuffle ajudam a separar stages." },
        { title: "Task", text: "É uma unidade de trabalho executada sobre uma partição." }
      ],
      sql: code([
        "SELECT id_pedido, valor",
        "FROM pedidos",
        "WHERE status = 'APROVADO'",
        "ORDER BY id_pedido;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"id_pedido\", \"valor\")",
        "    .orderBy(\"id_pedido\")",
        ")  # transformations",
        "",
        "resultado.show()  # action"
      ]),
      exercise: "Monte em resultado o plano que filtra aprovados, seleciona id_pedido e valor e ordena por id_pedido. O avaliador será responsável por disparar a action.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = pedidos"
      ]),
      hint: "Encadeie filter, select e orderBy; não use collect dentro da solução.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"id_pedido\", \"valor\")",
        "    .orderBy(\"id_pedido\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT * FROM pedidos;"
      ]),
      sqlSolution: code([
        "SELECT id_pedido, valor",
        "FROM pedidos",
        "WHERE status = 'APROVADO'",
        "ORDER BY id_pedido;"
      ]),
      expected: {
        columns: ["id_pedido", "valor"],
        rows: [[1, 10.0], [3, 7.5]],
        ordered: true
      },
      tables: [
        {
          name: "pedidos",
          columns: ["id_pedido", "status", "valor"],
          rows: [[1, "APROVADO", 10.0], [2, "PENDENTE", 5.0], [3, "APROVADO", 7.5]]
        }
      ],
      assessment: assessment(
        [{ name: "pedidos", schema: "id_pedido: long, status: string, valor: double" }],
        "id_pedido: long, valor: double",
        [{ id_pedido: 1, valor: 10.0 }, { id_pedido: 3, valor: 7.5 }],
        ["Entrada vazia produz saída vazia.", "collect e toPandas são proibidos no código do estudante."],
        ["Plano contém Filter, Project e Sort."]
      ),
      sources: [SOURCE.sqlGuide, SOURCE.cluster, SOURCE.sparkInternals],
      quiz: {
        question: "Qual operação normalmente dispara execução?",
        options: ["select", "filter", "withColumn", "count"],
        correct: 3,
        explanation: "count precisa de um resultado e é uma action; as demais operações normalmente apenas ampliam o plano."
      }
    },
    {
      id: 12,
      week: 3,
      title: "Partitions, tasks e paralelismo",
      subtitle: "Como o Spark divide os dados para trabalhar",
      objective: "Relacionar partições a tasks e observar uma redistribuição usando APIs de DataFrame.",
      intro: "Uma partição é uma fração dos dados. Em um stage, normalmente uma task processa uma partição. Mais partições não significam automaticamente mais velocidade: recursos e tamanho dos lotes importam.",
      analogy: "Dividir uma relação em lotes permite processá-los em paralelo, mas muitos lotes minúsculos também criam custo de coordenação.",
      concepts: [
        { title: "Partition", text: "É uma divisão física dos registros usada como unidade de paralelismo." },
        { title: "Task", text: "Executa o trabalho de um stage sobre uma partição." },
        { title: "repartition", text: "Redistribui dados e pode aumentar ou reduzir o número de partições, causando shuffle." },
        { title: "coalesce", text: "Costuma reduzir partições com menos movimentação, sem garantir balanceamento." }
      ],
      sql: code([
        "SELECT grupo, COUNT(*) AS linhas",
        "FROM eventos",
        "GROUP BY grupo",
        "ORDER BY grupo;"
      ]),
      pyspark: code([
        "distribuidos = (",
        "    eventos.repartition(2, \"grupo\")",
        "    .withColumn(\"particao\", F.spark_partition_id())",
        ")",
        "resultado = (",
        "    distribuidos.groupBy(\"grupo\")",
        "    .agg(F.countDistinct(\"particao\").alias(\"particoes_usadas\"))",
        "    .orderBy(\"grupo\")",
        ")"
      ]),
      exercise: "Redistribua eventos em 2 partições por grupo, adicione spark_partition_id e devolva por grupo a quantidade de partições distintas usadas.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = eventos"
      ]),
      hint: "Crie distribuidos com repartition e spark_partition_id; depois agrupe e use countDistinct.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "distribuidos = (",
        "    eventos.repartition(2, \"grupo\")",
        "    .withColumn(\"particao\", F.spark_partition_id())",
        ")",
        "resultado = (",
        "    distribuidos.groupBy(\"grupo\")",
        "    .agg(F.countDistinct(\"particao\").alias(\"particoes_usadas\"))",
        "    .orderBy(\"grupo\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT grupo FROM eventos;"
      ]),
      sqlSolution: code([
        "SELECT grupo, COUNT(*) AS linhas",
        "FROM eventos GROUP BY grupo ORDER BY grupo;"
      ]),
      expected: {
        columns: ["grupo", "particoes_usadas"],
        rows: [["A", 1], ["B", 1]],
        ordered: true
      },
      sqlExpected: {
        columns: ["grupo", "linhas"],
        rows: [["A", 2], ["B", 2]],
        ordered: true
      },
      tables: [
        { name: "eventos", columns: ["id", "grupo"], rows: [[1, "A"], [2, "A"], [3, "B"], [4, "B"]] }
      ],
      assessment: assessment(
        [{ name: "eventos", schema: "id: long, grupo: string" }],
        "grupo: string, particoes_usadas: long",
        [{ grupo: "A", particoes_usadas: 1 }, { grupo: "B", particoes_usadas: 1 }],
        ["IDs físicos das partições não devem ser comparados por valor.", "Grupo único continua usando uma partição após repartition por chave."],
        ["Plano contém RepartitionByExpression."]
      ),
      sources: [SOURCE.cluster, SOURCE.webUi, SOURCE.sparkInternals],
      quiz: {
        question: "Qual relação é geralmente válida dentro de um stage?",
        options: ["Uma task processa todas as partições", "Uma task costuma processar uma partição", "Uma partição exige um cluster inteiro", "repartition nunca causa shuffle"],
        correct: 1,
        explanation: "Tasks são agendadas sobre partições; o paralelismo também depende dos recursos disponíveis."
      }
    },
    {
      id: 13,
      week: 3,
      title: "Shuffle, repartition e redução antecipada",
      subtitle: "Movimentar somente os dados necessários",
      objective: "Reconhecer uma operação wide e reduzir linhas e colunas antes da redistribuição.",
      intro: "Shuffle move registros entre partições para reunir chaves relacionadas. É necessário para muitos groupBy, joins e ordenações, mas pode envolver rede, serialização e disco.",
      analogy: "Se lotes foram divididos sem considerar estado, agrupar por estado exige enviar registros para novos destinos.",
      concepts: [
        { title: "Narrow transformation", text: "Cada partição de saída depende de poucas partições de entrada, sem redistribuição global." },
        { title: "Wide transformation", text: "Pode depender de várias partições e cria uma fronteira de shuffle." },
        { title: "Redução antecipada", text: "Filtrar linhas e projetar colunas antes do shuffle diminui o volume movimentado." },
        { title: "Exchange", text: "É um sinal comum de redistribuição no plano físico." }
      ],
      sql: code([
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM pedidos",
        "WHERE status = 'APROVADO'",
        "GROUP BY estado ORDER BY estado;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"estado\", \"valor\")",
        "    .groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        "    .orderBy(\"estado\")",
        ")"
      ]),
      exercise: "Filtre aprovados e selecione apenas estado e valor antes de agrupar. Grave faturamento por estado em resultado, ordenado por estado.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = pedidos"
      ]),
      hint: "A ordem pedagógica é filter, select, groupBy, agg e orderBy.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"estado\", \"valor\")",
        "    .groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        "    .orderBy(\"estado\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM pedidos GROUP BY estado;"
      ]),
      sqlSolution: code([
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM pedidos WHERE status = 'APROVADO'",
        "GROUP BY estado ORDER BY estado;"
      ]),
      expected: {
        columns: ["estado", "faturamento"],
        rows: [["RJ", 7.0], ["SP", 15.0]],
        ordered: true
      },
      tables: [
        {
          name: "pedidos",
          columns: ["id_pedido", "estado", "status", "valor", "observacao"],
          rows: [[1, "SP", "APROVADO", 10.0, "x"], [2, "SP", "PENDENTE", 99.0, "y"], [3, "SP", "APROVADO", 5.0, "z"], [4, "RJ", "APROVADO", 7.0, "w"]]
        }
      ],
      assessment: assessment(
        [{ name: "pedidos", schema: "id_pedido: long, estado: string, status: string, valor: double, observacao: string" }],
        "estado: string, faturamento: double",
        [{ estado: "RJ", faturamento: 7.0 }, { estado: "SP", faturamento: 15.0 }],
        ["Estados sem aprovados não aparecem.", "Coluna observacao não deve chegar à agregação."],
        ["Filter e Project aparecem antes de Exchange no plano."]
      ),
      sources: [SOURCE.performance, SOURCE.webUi, SOURCE.sparkInternals],
      quiz: {
        question: "Qual operação costuma provocar shuffle?",
        options: ["Selecionar uma coluna", "Renomear uma coluna", "Agrupar por uma chave", "Criar um alias"],
        correct: 2,
        explanation: "Registros com a mesma chave precisam ser reunidos, geralmente por redistribuição."
      }
    },
    {
      id: 14,
      week: 3,
      title: "Broadcast join, skew e AQE",
      subtitle: "Escolher e verificar estratégias de join",
      objective: "Usar broadcast para uma relação pequena e reconhecer skew e Adaptive Query Execution.",
      intro: "Se uma relação é suficientemente pequena, cada executor pode receber uma cópia e evitar redistribuir a relação grande. Estatísticas e AQE também ajudam o Spark a ajustar estratégias.",
      analogy: "Em vez de mover todos os pedidos para encontrar produtos, cada equipe recebe uma cópia do pequeno catálogo.",
      concepts: [
        { title: "Broadcast join", text: "Replica uma relação pequena e evita um shuffle completo do lado grande." },
        { title: "Estatísticas", text: "Ajudam o otimizador a estimar tamanhos e escolher estratégias." },
        { title: "Data skew", text: "Poucas chaves concentram muitas linhas e deixam algumas tasks muito mais lentas." },
        { title: "AQE", text: "Pode ajustar partições e estratégias usando informações observadas durante a execução." }
      ],
      sql: code([
        "SELECT p.id_pedido, p.id_produto, d.categoria, p.valor",
        "FROM pedidos p",
        "JOIN produtos d ON p.id_produto = d.id_produto",
        "ORDER BY p.id_pedido;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.join(",
        "        F.broadcast(produtos),",
        "        on=\"id_produto\", how=\"inner\"",
        "    )",
        "    .select(\"id_pedido\", \"id_produto\", \"categoria\", \"valor\")",
        "    .orderBy(\"id_pedido\")",
        ")",
        "resultado.explain(\"formatted\")"
      ]),
      exercise: "Use F.broadcast(produtos) em um inner join por id_produto e grave em resultado id_pedido, id_produto, categoria e valor, ordenados por id_pedido.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = pedidos"
      ]),
      hint: "Envolva o DataFrame pequeno com F.broadcast antes de passá-lo a join.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    pedidos.join(F.broadcast(produtos), on=\"id_produto\", how=\"inner\")",
        "    .select(\"id_pedido\", \"id_produto\", \"categoria\", \"valor\")",
        "    .orderBy(\"id_pedido\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT p.id_pedido, p.id_produto, p.valor",
        "FROM pedidos p;"
      ]),
      sqlSolution: code([
        "SELECT p.id_pedido, p.id_produto, d.categoria, p.valor",
        "FROM pedidos p JOIN produtos d",
        "  ON p.id_produto = d.id_produto",
        "ORDER BY p.id_pedido;"
      ]),
      expected: {
        columns: ["id_pedido", "id_produto", "categoria", "valor"],
        rows: [[1, 10, "A", 15.0], [2, 20, "B", 8.0], [3, 10, "A", 5.0]],
        ordered: true
      },
      tables: [
        { name: "pedidos", columns: ["id_pedido", "id_produto", "valor"], rows: [[1, 10, 15.0], [2, 20, 8.0], [3, 10, 5.0], [4, 99, 2.0]] },
        { name: "produtos", columns: ["id_produto", "categoria"], rows: [[10, "A"], [20, "B"]] }
      ],
      assessment: assessment(
        [
          { name: "pedidos", schema: "id_pedido: long, id_produto: long, valor: double" },
          { name: "produtos", schema: "id_produto: long, categoria: string; relação pequena" }
        ],
        "id_pedido: long, id_produto: long, categoria: string, valor: double",
        [{ id_pedido: 1, id_produto: 10, categoria: "A", valor: 15.0 }, { id_pedido: 2, id_produto: 20, categoria: "B", valor: 8.0 }, { id_pedido: 3, id_produto: 10, categoria: "A", valor: 5.0 }],
        ["Produto ausente é removido pelo inner join.", "Chave dominante deve ser discutida como possível skew."],
        ["Plano final contém BroadcastHashJoin ou BroadcastNestedLoopJoin compatível."]
      ),
      sources: [SOURCE.performance, SOURCE.sqlInternals, SOURCE.zoomcamp],
      quiz: {
        question: "Quando broadcast tende a ser apropriado?",
        options: ["Quando os dois lados são enormes", "Quando um lado é pequeno o suficiente para ser replicado", "Em qualquer cross join", "Para eliminar nulos"],
        correct: 1,
        explanation: "Broadcast troca a redistribuição do lado grande pela replicação controlada do lado pequeno."
      }
    },
    {
      id: 15,
      week: 3,
      title: "Ler e melhorar o plano de execução",
      subtitle: "Usar explain antes de otimizar por intuição",
      objective: "Identificar filtros, projeções, exchanges e estratégias de join e aplicar otimizações justificadas.",
      intro: "O plano físico mostra o que a engine pretende executar. A meta não é decorar cada nó, mas localizar leitura, filtros, projeções, exchanges e joins.",
      analogy: "Como em um EXPLAIN de banco relacional, o plano conecta uma consulta legível às operações físicas e aos custos prováveis.",
      concepts: [
        { title: "Plano lógico", text: "Representa relações e expressões antes da escolha das operações físicas." },
        { title: "Plano físico", text: "Mostra estratégias concretas, como scan, exchange e hash join." },
        { title: "Pushdown e pruning", text: "Aplicam filtros junto à fonte e evitam ler colunas desnecessárias quando suportado." },
        { title: "Cache com propósito", text: "Só ajuda quando um resultado caro será reutilizado; ocupa recursos e não deve ser padrão." }
      ],
      sql: code([
        "SELECT c.estado, SUM(p.valor) AS faturamento",
        "FROM pedidos p JOIN clientes c",
        "  ON p.id_cliente = c.id_cliente",
        "WHERE p.status = 'APROVADO'",
        "GROUP BY c.estado ORDER BY c.estado;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"id_cliente\", \"valor\")",
        "    .join(clientes.select(\"id_cliente\", \"estado\"), \"id_cliente\")",
        "    .groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        "    .orderBy(\"estado\")",
        ")",
        "resultado.explain(\"formatted\")"
      ]),
      exercise: "Filtre e projete pedidos antes do join, agregue faturamento por estado e grave o resultado ordenado. O avaliador verificará também o plano.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = pedidos"
      ]),
      hint: "Antes do join, mantenha apenas aprovados e as colunas id_cliente e valor.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .select(\"id_cliente\", \"valor\")",
        "    .join(clientes.select(\"id_cliente\", \"estado\"), \"id_cliente\")",
        "    .groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        "    .orderBy(\"estado\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT c.estado, SUM(p.valor) AS faturamento",
        "FROM pedidos p JOIN clientes c ON p.id_cliente = c.id_cliente",
        "GROUP BY c.estado;"
      ]),
      sqlSolution: code([
        "SELECT c.estado, SUM(p.valor) AS faturamento",
        "FROM pedidos p JOIN clientes c ON p.id_cliente = c.id_cliente",
        "WHERE p.status = 'APROVADO'",
        "GROUP BY c.estado ORDER BY c.estado;"
      ]),
      expected: {
        columns: ["estado", "faturamento"],
        rows: [["RJ", 7.0], ["SP", 15.0]],
        ordered: true
      },
      tables: [
        { name: "pedidos", columns: ["id_pedido", "id_cliente", "status", "valor", "payload"], rows: [[1, 10, "APROVADO", 10.0, "x"], [2, 10, "PENDENTE", 99.0, "y"], [3, 10, "APROVADO", 5.0, "z"], [4, 20, "APROVADO", 7.0, "w"]] },
        { name: "clientes", columns: ["id_cliente", "estado", "nome"], rows: [[10, "SP", "Ana"], [20, "RJ", "Bia"]] }
      ],
      assessment: assessment(
        [
          { name: "pedidos", schema: "id_pedido: long, id_cliente: long, status: string, valor: double, payload: string" },
          { name: "clientes", schema: "id_cliente: long, estado: string, nome: string" }
        ],
        "estado: string, faturamento: double",
        [{ estado: "RJ", faturamento: 7.0 }, { estado: "SP", faturamento: 15.0 }],
        ["Colunas payload e nome não são necessárias.", "Cache não deve ser aplicado sem reutilização."],
        ["Filter e Project precedem Join.", "Plano não contém PythonUDF.", "Há Exchange associado à agregação quando aplicável."]
      ),
      sources: [SOURCE.performance, SOURCE.webUi, SOURCE.sqlInternals],
      quiz: {
        question: "Qual prática é mais segura ao investigar performance?",
        options: ["Adicionar cache a tudo", "Aumentar partições sem medir", "Ler o plano e medir antes de mudar", "Trocar SQL por PySpark automaticamente"],
        correct: 2,
        explanation: "Plano e métricas ajudam a localizar o custo real antes de aplicar uma otimização."
      }
    },
    {
      id: 16,
      week: 4,
      title: "Qualidade de dados como contrato",
      subtitle: "Um job concluído não garante um resultado correto",
      objective: "Transformar regras de completude, domínio e validade em colunas verificáveis.",
      intro: "Qualidade não é apenas remover linhas ruins. É declarar regras, identificar rejeições, explicar motivos e reconciliar quantidades.",
      analogy: "Uma consulta SQL de validação pode contar chaves nulas, valores fora do domínio e duplicidades. No pipeline, essas consultas viram contratos automatizados.",
      concepts: [
        { title: "Completude", text: "Campos obrigatórios não podem estar nulos." },
        { title: "Domínio", text: "Valores precisam pertencer ao conjunto permitido." },
        { title: "Validade", text: "Regras como quantidade maior que zero precisam ser testadas." },
        { title: "Quarentena", text: "Registros rejeitados devem conservar contexto e motivo para investigação." }
      ],
      sql: code([
        "SELECT *,",
        "  CASE",
        "    WHEN id_pedido IS NULL THEN 'ID_NULO'",
        "    WHEN quantidade <= 0 THEN 'QUANTIDADE_INVALIDA'",
        "    WHEN status NOT IN ('APROVADO','PENDENTE') THEN 'STATUS_INVALIDO'",
        "    ELSE 'OK'",
        "  END AS motivo_qualidade",
        "FROM pedidos ORDER BY sequencia;"
      ]),
      pyspark: code([
        "motivo = (",
        "    F.when(F.col(\"id_pedido\").isNull(), \"ID_NULO\")",
        "    .when(F.col(\"quantidade\") <= 0, \"QUANTIDADE_INVALIDA\")",
        "    .when(~F.col(\"status\").isin(\"APROVADO\", \"PENDENTE\"), \"STATUS_INVALIDO\")",
        "    .otherwise(\"OK\")",
        ")",
        "resultado = pedidos.withColumn(\"motivo_qualidade\", motivo).orderBy(\"sequencia\")"
      ]),
      exercise: "Crie motivo_qualidade com prioridade ID_NULO, QUANTIDADE_INVALIDA, STATUS_INVALIDO e OK. Preserve as colunas e ordene por sequencia.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = pedidos"
      ]),
      hint: "Encadeie F.when na ordem de prioridade e finalize com otherwise('OK').",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "motivo = (",
        "    F.when(F.col(\"id_pedido\").isNull(), \"ID_NULO\")",
        "    .when(F.col(\"quantidade\") <= 0, \"QUANTIDADE_INVALIDA\")",
        "    .when(~F.col(\"status\").isin(\"APROVADO\", \"PENDENTE\"), \"STATUS_INVALIDO\")",
        "    .otherwise(\"OK\")",
        ")",
        "resultado = pedidos.withColumn(\"motivo_qualidade\", motivo).orderBy(\"sequencia\")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT * FROM pedidos ORDER BY sequencia;"
      ]),
      sqlSolution: code([
        "SELECT *, CASE",
        "  WHEN id_pedido IS NULL THEN 'ID_NULO'",
        "  WHEN quantidade <= 0 THEN 'QUANTIDADE_INVALIDA'",
        "  WHEN status NOT IN ('APROVADO','PENDENTE') THEN 'STATUS_INVALIDO'",
        "  ELSE 'OK' END AS motivo_qualidade",
        "FROM pedidos ORDER BY sequencia;"
      ]),
      expected: {
        columns: ["sequencia", "id_pedido", "quantidade", "status", "motivo_qualidade"],
        rows: [[1, 10, 2, "APROVADO", "OK"], [2, null, 1, "APROVADO", "ID_NULO"], [3, 30, 0, "PENDENTE", "QUANTIDADE_INVALIDA"], [4, 40, 1, "CANCELADO", "STATUS_INVALIDO"]],
        ordered: true
      },
      tables: [
        {
          name: "pedidos",
          columns: ["sequencia", "id_pedido", "quantidade", "status"],
          rows: [[1, 10, 2, "APROVADO"], [2, null, 1, "APROVADO"], [3, 30, 0, "PENDENTE"], [4, 40, 1, "CANCELADO"]]
        }
      ],
      assessment: assessment(
        [{ name: "pedidos", schema: "sequencia: long, id_pedido: long nullable, quantidade: long, status: string" }],
        "colunas originais + motivo_qualidade: string",
        [
          { sequencia: 1, motivo_qualidade: "OK" },
          { sequencia: 2, motivo_qualidade: "ID_NULO" },
          { sequencia: 3, motivo_qualidade: "QUANTIDADE_INVALIDA" },
          { sequencia: 4, motivo_qualidade: "STATUS_INVALIDO" }
        ],
        ["Uma linha que viola várias regras recebe o motivo de maior prioridade.", "Status nulo precisa ser tratado explicitamente em teste oculto."]
      ),
      sources: [SOURCE.functions, SOURCE.nulls, SOURCE.testing],
      quiz: {
        question: "Por que guardar o motivo da rejeição?",
        options: ["Para aumentar partições", "Para tornar a regra observável e investigável", "Para substituir o schema", "Para evitar todos os testes"],
        correct: 1,
        explanation: "Uma quarentena explicável permite medir falhas e corrigir a origem."
      }
    },
    {
      id: 17,
      week: 4,
      title: "Transformações testáveis",
      subtitle: "Comparar schema e conteúdo, não apenas olhar show",
      objective: "Escrever uma transformação determinística e validá-la com utilitários oficiais do PySpark.",
      intro: "Olhar algumas linhas é útil para explorar, mas não constitui um teste repetível. PySpark oferece assertDataFrameEqual e assertSchemaEqual para comparar contratos.",
      analogy: "Assim como uma query pode ter casos de teste com entradas e saídas conhecidas, uma função de DataFrame deve ser verificável com fixtures pequenas.",
      concepts: [
        { title: "Fixture", text: "Pequeno conjunto de dados criado para representar casos normais e de borda." },
        { title: "Resultado esperado", text: "DataFrame com valores e schema definidos antes de executar a solução." },
        { title: "Ordem", text: "Só deve ser comparada quando fizer parte do contrato; DataFrames não têm ordem implícita." },
        { title: "Teste de schema", text: "Nomes, tipos e nulabilidade também fazem parte da correção." }
      ],
      sql: code([
        "SELECT id_cliente, UPPER(TRIM(nome)) AS nome_normalizado",
        "FROM clientes",
        "WHERE id_cliente IS NOT NULL",
        "ORDER BY id_cliente;"
      ]),
      pyspark: code([
        "from pyspark.testing.utils import assertDataFrameEqual",
        "",
        "resultado = (",
        "    clientes.filter(F.col(\"id_cliente\").isNotNull())",
        "    .select(\"id_cliente\", F.upper(F.trim(\"nome\")).alias(\"nome_normalizado\"))",
        "    .orderBy(\"id_cliente\")",
        ")",
        "",
        "assertDataFrameEqual(resultado, esperado, checkRowOrder=True)"
      ]),
      exercise: "Crie resultado removendo id_cliente nulo e normalizando nome com trim e upper. Selecione id_cliente e nome_normalizado e ordene por id_cliente.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = clientes"
      ]),
      hint: "Filtre isNotNull, normalize dentro de select e finalize com orderBy.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = (",
        "    clientes.filter(F.col(\"id_cliente\").isNotNull())",
        "    .select(",
        "        \"id_cliente\",",
        "        F.upper(F.trim(\"nome\")).alias(\"nome_normalizado\")",
        "    )",
        "    .orderBy(\"id_cliente\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_cliente, nome FROM clientes;"
      ]),
      sqlSolution: code([
        "SELECT id_cliente, UPPER(TRIM(nome)) AS nome_normalizado",
        "FROM clientes WHERE id_cliente IS NOT NULL",
        "ORDER BY id_cliente;"
      ]),
      expected: {
        columns: ["id_cliente", "nome_normalizado"],
        rows: [[1, "ANA"], [2, "BIA"]],
        ordered: true
      },
      tables: [
        { name: "clientes", columns: ["id_cliente", "nome"], rows: [[2, " bia "], [null, "sem id"], [1, " Ana "]] }
      ],
      assessment: assessment(
        [{ name: "clientes", schema: "id_cliente: long nullable, nome: string" }],
        "id_cliente: long, nome_normalizado: string",
        [{ id_cliente: 1, nome_normalizado: "ANA" }, { id_cliente: 2, nome_normalizado: "BIA" }],
        ["Nome nulo permanece nulo.", "Entrada vazia conserva schema.", "Ordem faz parte deste contrato."],
        ["Sem PythonUDF."]
      ),
      sources: [SOURCE.testing, SOURCE.chispa, SOURCE.examples],
      quiz: {
        question: "Quando checkRowOrder deve ser exigido?",
        options: ["Sempre", "Nunca", "Quando a ordem faz parte explícita do contrato", "Somente em joins"],
        correct: 2,
        explanation: "Sem orderBy, a ordem não é garantida; o teste deve refletir o contrato real."
      }
    },
    {
      id: 18,
      week: 4,
      title: "Escrita idempotente em Parquet e tabelas",
      subtitle: "Save modes, particionamento e saídas verificáveis",
      objective: "Gravar uma tabela gerenciada em Parquet, escolher o modo e reler o resultado.",
      intro: "Uma saída é parte do contrato do pipeline. Formato, schema, modo de gravação e estratégia de repetição precisam ser explícitos.",
      analogy: "INSERT, INSERT OVERWRITE e CREATE OR REPLACE possuem consequências diferentes. A DataFrameWriter expressa decisões equivalentes fora de uma instrução SQL.",
      concepts: [
        { title: "Save mode", text: "append, overwrite, ignore e errorifexists tratam destinos existentes de formas diferentes." },
        { title: "Tabela gerenciada", text: "O catálogo controla metadados e localização padrão da tabela." },
        { title: "Idempotência", text: "Reexecutar com a mesma entrada deve produzir o estado final esperado, sem duplicar acidentalmente." },
        { title: "Delta opcional", text: "Delta Lake adiciona log transacional e outras garantias, mas não é requisito para aprender Spark." }
      ],
      sql: code([
        "CREATE OR REPLACE TABLE pedidos_saida",
        "USING PARQUET",
        "AS SELECT id_pedido, status, valor FROM pedidos;",
        "",
        "SELECT * FROM pedidos_saida ORDER BY id_pedido;"
      ]),
      pyspark: code([
        "saida = pedidos.select(\"id_pedido\", \"status\", \"valor\")",
        "(saida.write.mode(\"overwrite\").format(\"parquet\").saveAsTable(tabela))",
        "resultado = spark.table(tabela).orderBy(\"id_pedido\")"
      ]),
      exercise: "Selecione id_pedido, status e valor, grave com overwrite em formato parquet usando saveAsTable(tabela) e releia em resultado ordenado por id_pedido.",
      starter: code([
        "saida = pedidos.select(\"id_pedido\", \"status\", \"valor\")",
        "# configure a escrita e releia a tabela",
        "resultado = saida"
      ]),
      hint: "Use saida.write.mode('overwrite').format('parquet').saveAsTable(tabela) e spark.table.",
      solution: code([
        "saida = pedidos.select(\"id_pedido\", \"status\", \"valor\")",
        "saida.write.mode(\"overwrite\").format(\"parquet\").saveAsTable(tabela)",
        "resultado = spark.table(tabela).orderBy(\"id_pedido\")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT id_pedido, status, valor FROM pedidos;"
      ]),
      sqlSolution: code([
        "CREATE OR REPLACE TABLE pedidos_saida",
        "USING PARQUET",
        "AS SELECT id_pedido, status, valor FROM pedidos;",
        "SELECT * FROM pedidos_saida ORDER BY id_pedido;"
      ]),
      expected: {
        columns: ["id_pedido", "status", "valor"],
        rows: [[1, "APROVADO", 10.0], [2, "PENDENTE", 7.5]],
        ordered: true
      },
      tables: [
        { name: "pedidos", columns: ["id_pedido", "status", "valor"], rows: [[2, "PENDENTE", 7.5], [1, "APROVADO", 10.0]] }
      ],
      assessment: assessment(
        [
          { name: "pedidos", schema: "id_pedido: long, status: string, valor: double" },
          { name: "tabela", schema: "nome isolado fornecido pelo avaliador" }
        ],
        "id_pedido: long, status: string, valor: double",
        [{ id_pedido: 1, status: "APROVADO", valor: 10.0 }, { id_pedido: 2, status: "PENDENTE", valor: 7.5 }],
        ["Duas execuções com overwrite não duplicam linhas.", "A tabela de teste deve ser removida pelo sandbox após a avaliação."]
      ),
      sources: [SOURCE.dataSources, SOURCE.parquet, SOURCE.delta],
      quiz: {
        question: "Qual modo é naturalmente adequado a uma reconstrução completa idempotente?",
        options: ["append sem chave", "overwrite controlado", "ignore", "collect"],
        correct: 1,
        explanation: "Overwrite pode reconstruir o destino; ainda exige cuidado com escopo, partições e concorrência."
      }
    },
    {
      id: 19,
      week: 4,
      title: "Projeto: pipeline de viagens",
      subtitle: "Dados brutos, validação e resumo analítico",
      objective: "Combinar tipagem, filtro, datas e agregação em um pipeline pequeno e reconciliável.",
      intro: "O projeto usa uma amostra sintética inspirada no formato de dados públicos de viagens. O objetivo é produzir uma tabela mensal por zona, mantendo etapas legíveis.",
      analogy: "Pense em três contratos: entrada bruta, dados validados e resumo. Os nomes das camadas importam menos que as regras e a rastreabilidade entre elas.",
      concepts: [
        { title: "Entrada bruta", text: "Preserva campos recebidos e torna o schema de origem explícito." },
        { title: "Validação", text: "Converte tipos e remove somente registros que violam regras declaradas." },
        { title: "Resumo", text: "Agrega na granularidade mês e zona com métricas reconciliáveis." },
        { title: "Reconciliação", text: "Contagens e somas entre etapas ajudam a detectar perda ou duplicação indevida." }
      ],
      sql: code([
        "SELECT DATE_TRUNC('month', TO_TIMESTAMP(inicio)) AS mes,",
        "       zona, COUNT(*) AS viagens, SUM(valor) AS valor_total",
        "FROM viagens",
        "WHERE status = 'VALIDA' AND valor >= 0",
        "GROUP BY 1, zona ORDER BY mes, zona;"
      ]),
      pyspark: code([
        "validas = (",
        "    viagens.withColumn(\"inicio_ts\", F.to_timestamp(\"inicio\"))",
        "    .filter((F.col(\"status\") == \"VALIDA\") & (F.col(\"valor\") >= 0))",
        ")",
        "resultado = (",
        "    validas.withColumn(\"mes\", F.date_trunc(\"month\", \"inicio_ts\"))",
        "    .groupBy(\"mes\", \"zona\")",
        "    .agg(F.count(\"*\").alias(\"viagens\"), F.sum(\"valor\").alias(\"valor_total\"))",
        "    .orderBy(\"mes\", \"zona\")",
        ")"
      ]),
      exercise: "Converta inicio para timestamp, mantenha status VALIDA e valor >= 0 e agregue viagens e valor_total por mês e zona. Grave resultado ordenado.",
      starter: code([
        "from pyspark.sql import functions as F",
        "",
        "resultado = viagens"
      ]),
      hint: "Separe a etapa validas da agregação; use to_timestamp, date_trunc, groupBy e agg.",
      solution: code([
        "from pyspark.sql import functions as F",
        "",
        "validas = (",
        "    viagens.withColumn(\"inicio_ts\", F.to_timestamp(\"inicio\"))",
        "    .filter((F.col(\"status\") == \"VALIDA\") & (F.col(\"valor\") >= 0))",
        ")",
        "resultado = (",
        "    validas.withColumn(\"mes\", F.date_trunc(\"month\", \"inicio_ts\"))",
        "    .groupBy(\"mes\", \"zona\")",
        "    .agg(",
        "        F.count(\"*\").alias(\"viagens\"),",
        "        F.sum(\"valor\").alias(\"valor_total\")",
        "    )",
        "    .orderBy(\"mes\", \"zona\")",
        ")"
      ]),
      practiceMode: "pyspark",
      sqlStarter: code([
        "SELECT zona, COUNT(*) AS viagens",
        "FROM viagens GROUP BY zona;"
      ]),
      sqlSolution: code([
        "SELECT DATE_TRUNC('month', TO_TIMESTAMP(inicio)) AS mes,",
        "       zona, COUNT(*) AS viagens, SUM(valor) AS valor_total",
        "FROM viagens",
        "WHERE status = 'VALIDA' AND valor >= 0",
        "GROUP BY 1, zona ORDER BY mes, zona;"
      ]),
      expected: {
        columns: ["mes", "zona", "viagens", "valor_total"],
        rows: [["2026-01-01 00:00:00", "Centro", 2, 25.0], ["2026-02-01 00:00:00", "Norte", 1, 8.0]],
        ordered: true
      },
      tables: [
        {
          name: "viagens",
          columns: ["id_viagem", "inicio", "zona", "valor", "status"],
          rows: [[1, "2026-01-05 10:00:00", "Centro", 10.0, "VALIDA"], [2, "2026-01-20 12:00:00", "Centro", 15.0, "VALIDA"], [3, "2026-01-21 09:00:00", "Sul", -2.0, "VALIDA"], [4, "2026-02-02 14:00:00", "Norte", 8.0, "VALIDA"], [5, "2026-02-03 08:00:00", "Norte", 99.0, "CANCELADA"]]
        }
      ],
      assessment: assessment(
        [{ name: "viagens", schema: "id_viagem: long, inicio: string, zona: string, valor: double, status: string" }],
        "mes: timestamp, zona: string, viagens: long, valor_total: double",
        [
          { mes: "2026-01-01 00:00:00", zona: "Centro", viagens: 2, valor_total: 25.0 },
          { mes: "2026-02-01 00:00:00", zona: "Norte", viagens: 1, valor_total: 8.0 }
        ],
        ["Valor negativo e status cancelado não entram.", "Timestamp inválido deve ser rejeitado ou tratado conforme contrato.", "Total de viagens do resumo deve reconciliar com válidas."]
      ),
      sources: [SOURCE.nycTlc, SOURCE.parquet, SOURCE.testing],
      quiz: {
        question: "Qual verificação melhor reconcilia o projeto?",
        options: ["Comparar apenas nomes de variáveis", "Confirmar contagem e soma das válidas antes e depois da agregação", "Usar collect em toda etapa", "Remover todos os nulos sem regra"],
        correct: 1,
        explanation: "Contagens e totais ajudam a identificar perda ou duplicação entre etapas."
      }
    },
    {
      id: 20,
      week: 4,
      title: "Consolidação e próximos passos",
      subtitle: "Explicar decisões antes de ampliar o ecossistema",
      objective: "Consolidar o modelo mental de Spark e criar um plano de evolução fundamentado.",
      intro: "Ao terminar, você deve conseguir explicar não apenas a sintaxe, mas por que uma transformação está correta e como o Spark tende a executá-la.",
      analogy: "SQL continua sendo uma ferramenta central. PySpark acrescenta composição programática; ambos podem expressar planos para a mesma engine.",
      concepts: [
        { title: "Correção", text: "Schema, linhas e casos de borda vêm antes de performance." },
        { title: "Plano", text: "explain e métricas conectam intenção lógica ao trabalho físico." },
        { title: "Escolha de interface", text: "SQL favorece clareza declarativa; PySpark favorece composição e reutilização." },
        { title: "Próximas trilhas", text: "Structured Streaming, Delta Lake, testes avançados e operação de clusters podem vir depois dos fundamentos." }
      ],
      sql: code([
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM pedidos",
        "WHERE status = 'APROVADO'",
        "GROUP BY estado;"
      ]),
      pyspark: code([
        "resultado = (",
        "    pedidos.filter(F.col(\"status\") == \"APROVADO\")",
        "    .groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        ")"
      ]),
      exercise: "Escreva uma retrospectiva em cinco partes: Spark versus banco; DataFrame e schema; lazy evaluation; partition e shuffle; quando usar SQL ou PySpark. Termine com duas próximas práticas concretas.",
      starter: code([
        "# Minha retrospectiva",
        "",
        "## 1. Spark versus banco",
        "",
        "## 2. DataFrame e schema",
        "",
        "## 3. Lazy evaluation",
        "",
        "## 4. Partition e shuffle",
        "",
        "## 5. SQL ou PySpark",
        "",
        "## Próximas práticas"
      ]),
      hint: "Use exemplos das aulas e explique relações de causa e efeito, não apenas definições.",
      solution: code([
        "# Resposta de referência",
        "",
        "1. Spark é uma engine; bancos também armazenam e gerenciam dados.",
        "2. DataFrame representa dados tipados e um plano imutável.",
        "3. Transformations são adiadas até uma action solicitar resultado.",
        "4. Partitions permitem paralelismo; shuffle redistribui registros e tem custo.",
        "5. SQL é ótimo para lógica declarativa; PySpark ajuda a compor código reutilizável.",
        "",
        "Próximas práticas: testar um pipeline com dados públicos e estudar Structured Streaming."
      ]),
      practiceMode: "reflection",
      sqlStarter: code([
        "-- Reescreva em suas palavras quando esta consulta é uma boa escolha.",
        "SELECT estado, SUM(valor) FROM pedidos GROUP BY estado;"
      ]),
      sqlSolution: code([
        "-- SQL é adequado quando a transformação é naturalmente relacional e declarativa.",
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM pedidos GROUP BY estado;"
      ]),
      expected: {
        columns: [],
        rows: [],
        ordered: false
      },
      tables: [],
      assessment: {
        entrypoint: "reflexao",
        checks: ["cinco conceitos cobertos", "duas próximas práticas", "texto autoral"],
        edgeCases: ["Não exigir código executável nesta aula."]
      },
      sources: [SOURCE.docs, SOURCE.testing, SOURCE.streaming, SOURCE.delta],
      quiz: {
        question: "Qual afirmação demonstra o modelo mental mais sólido?",
        options: ["PySpark é sempre mais rápido que SQL", "Toda transformação executa imediatamente", "SQL e DataFrame API podem gerar planos equivalentes; correção e contexto orientam a escolha", "Mais partições sempre melhoram performance"],
        correct: 2,
        explanation: "O Spark otimiza planos. Interface, correção, legibilidade e características dos dados orientam a decisão."
      }
    }
  ];

  const weekInfo = [
    {
      week: 1,
      title: "De SQL para Spark",
      description: "Use seu repertório SQL para entender SparkSession, DataFrames, PySpark, schemas e nulos."
    },
    {
      week: 2,
      title: "Transformações corretas",
      description: "Leia dados, aplique funções, agregue, combine tabelas e use janelas com resultados verificáveis."
    },
    {
      week: 3,
      title: "Como o Spark executa",
      description: "Entenda lazy evaluation, jobs, partitions, shuffle, estratégias de join e planos físicos."
    },
    {
      week: 4,
      title: "Código confiável e projeto",
      description: "Crie contratos de qualidade, testes de DataFrame, saídas idempotentes e um pipeline completo."
    }
  ];

  const labOperations = [
    {
      id: "select",
      label: "Selecionar",
      title: "SELECT → select",
      description: "Escolha apenas as colunas necessárias e dê nomes explícitos às expressões.",
      sql: code([
        "SELECT id_pedido, valor AS valor_bruto",
        "FROM pedidos;"
      ]),
      pyspark: code([
        "resultado = pedidos.select(",
        "    \"id_pedido\",",
        "    F.col(\"valor\").alias(\"valor_bruto\")",
        ")"
      ]),
      note: "A projeção reduz a quantidade de colunas transportadas e torna o contrato de saída explícito."
    },
    {
      id: "filter",
      label: "Filtrar",
      title: "WHERE → filter",
      description: "Combine condições com operadores de coluna, sempre usando parênteses.",
      sql: code([
        "SELECT * FROM pedidos",
        "WHERE status = 'APROVADO' AND quantidade >= 2;"
      ]),
      pyspark: code([
        "resultado = pedidos.filter(",
        "    (F.col(\"status\") == \"APROVADO\") &",
        "    (F.col(\"quantidade\") >= 2)",
        ")"
      ]),
      note: "filter e where são equivalentes na DataFrame API."
    },
    {
      id: "case",
      label: "CASE WHEN",
      title: "CASE WHEN → when",
      description: "Expresse regras condicionais com funções nativas que o Spark consegue analisar.",
      sql: code([
        "SELECT CASE WHEN valor >= 1000 THEN 'ALTO'",
        "            WHEN valor >= 500 THEN 'MEDIO'",
        "            ELSE 'BAIXO' END AS faixa",
        "FROM vendas;"
      ]),
      pyspark: code([
        "resultado = vendas.withColumn(",
        "    \"faixa\",",
        "    F.when(F.col(\"valor\") >= 1000, \"ALTO\")",
        "     .when(F.col(\"valor\") >= 500, \"MEDIO\")",
        "     .otherwise(\"BAIXO\")",
        ")"
      ]),
      note: "Evite uma função Python linha a linha quando houver uma função nativa equivalente."
    },
    {
      id: "group",
      label: "Agrupar",
      title: "GROUP BY → groupBy + agg",
      description: "As chaves de agrupamento determinam a granularidade do resultado.",
      sql: code([
        "SELECT estado, SUM(valor) AS faturamento",
        "FROM vendas GROUP BY estado;"
      ]),
      pyspark: code([
        "resultado = (",
        "    vendas.groupBy(\"estado\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        ")"
      ]),
      note: "Agrupamentos normalmente exigem shuffle para reunir chaves iguais."
    },
    {
      id: "join",
      label: "Combinar",
      title: "JOIN → join",
      description: "Defina a chave, o tipo de join e valide a cardinalidade.",
      sql: code([
        "SELECT p.*, c.estado",
        "FROM pedidos p LEFT JOIN clientes c",
        "  ON p.id_cliente = c.id_cliente;"
      ]),
      pyspark: code([
        "resultado = pedidos.join(",
        "    clientes.select(\"id_cliente\", \"estado\"),",
        "    on=\"id_cliente\",",
        "    how=\"left\"",
        ")"
      ]),
      note: "Uma chave duplicada no lado direito pode multiplicar linhas sem gerar erro técnico."
    },
    {
      id: "window",
      label: "Janela",
      title: "OVER → Window",
      description: "Calcule rankings e versões dentro de grupos sem reduzir as linhas.",
      sql: code([
        "SELECT *, ROW_NUMBER() OVER (",
        "  PARTITION BY id_cliente ORDER BY atualizado_em DESC",
        ") AS rn FROM clientes_historico;"
      ]),
      pyspark: code([
        "janela = Window.partitionBy(\"id_cliente\").orderBy(",
        "    F.col(\"atualizado_em\").desc()",
        ")",
        "resultado = clientes_historico.withColumn(",
        "    \"rn\", F.row_number().over(janela)",
        ")"
      ]),
      note: "Inclua um segundo critério de ordenação quando puder haver empates."
    },
    {
      id: "nulls",
      label: "Tratar nulos",
      title: "COALESCE → coalesce",
      description: "Nulo significa valor desconhecido; substitua-o apenas quando a regra permitir.",
      sql: code([
        "SELECT id_produto, COALESCE(preco, 0) AS preco",
        "FROM produtos;"
      ]),
      pyspark: code([
        "resultado = produtos.select(",
        "    \"id_produto\",",
        "    F.coalesce(F.col(\"preco\"), F.lit(0.0)).alias(\"preco\")",
        ")"
      ]),
      note: "COUNT(*) e COUNT(coluna) têm semânticas diferentes quando há nulos."
    },
    {
      id: "date",
      label: "Datas",
      title: "DATE_TRUNC → date_trunc",
      description: "Converta texto para date ou timestamp antes de criar períodos.",
      sql: code([
        "SELECT DATE_TRUNC('month', data_pedido) AS mes,",
        "       SUM(valor) AS faturamento",
        "FROM vendas GROUP BY 1;"
      ]),
      pyspark: code([
        "resultado = (",
        "    vendas.withColumn(\"mes\", F.date_trunc(\"month\", \"data_pedido\"))",
        "    .groupBy(\"mes\")",
        "    .agg(F.sum(\"valor\").alias(\"faturamento\"))",
        ")"
      ]),
      note: "Datas armazenadas como string não possuem, por si só, semântica de calendário."
    }
  ];

  const glossary = [
    { term: "Action", category: "Execução", definition: "Operação que exige um resultado e dispara um job, como count, show, collect ou write." },
    { term: "Adaptive Query Execution", category: "Performance", definition: "Otimização que ajusta partes do plano físico usando estatísticas coletadas durante a execução." },
    { term: "ANSI mode", category: "Spark SQL", definition: "Modo em que operações inválidas, casts e overflows seguem regras mais próximas do SQL ANSI e tendem a gerar erros explícitos." },
    { term: "Broadcast", category: "Performance", definition: "Envio de uma relação pequena aos executors para evitar redistribuir a relação grande em um join." },
    { term: "Cache", category: "Performance", definition: "Persistência temporária de um resultado que será reutilizado; ocupa recursos e precisa ser materializada por uma action." },
    { term: "Catalyst", category: "Spark SQL", definition: "Otimizador que analisa e transforma planos lógicos produzidos por SQL e DataFrames." },
    { term: "Cluster", category: "Arquitetura", definition: "Conjunto de recursos de computação no qual aplicações Spark podem ser executadas." },
    { term: "Column pruning", category: "Performance", definition: "Otimização que evita ler colunas não necessárias para o resultado." },
    { term: "DAG", category: "Execução", definition: "Grafo de dependências das transformações usado pelo Spark para organizar o trabalho." },
    { term: "DataFrame", category: "Fundamentos", definition: "Representação tabular, tipada, distribuível e imutável de um plano de transformação." },
    { term: "Data skew", category: "Performance", definition: "Distribuição desigual em que poucas chaves concentram muitas linhas e atrasam algumas tasks." },
    { term: "Driver", category: "Arquitetura", definition: "Processo que coordena a aplicação, cria planos e agenda trabalho." },
    { term: "Executor", category: "Arquitetura", definition: "Processo que executa tasks e processa partições de dados." },
    { term: "Idempotência", category: "Engenharia", definition: "Propriedade de produzir o mesmo estado final ao repetir uma operação com a mesma entrada." },
    { term: "Job", category: "Execução", definition: "Conjunto de stages criado para atender a uma action." },
    { term: "Lazy evaluation", category: "Execução", definition: "Estratégia de adiar o processamento até uma action para analisar e otimizar o plano completo." },
    { term: "Parquet", category: "Armazenamento", definition: "Formato open source colunar, comprimido e tipado, eficiente para cargas analíticas." },
    { term: "Partition", category: "Arquitetura", definition: "Fração dos dados processada por uma task; unidade básica do paralelismo." },
    { term: "Predicate pushdown", category: "Performance", definition: "Aplicação de filtros junto à fonte para evitar a leitura de linhas desnecessárias." },
    { term: "PySpark", category: "Fundamentos", definition: "API Python do Apache Spark." },
    { term: "Schema", category: "Fundamentos", definition: "Contrato que define nomes, tipos e nulabilidade das colunas." },
    { term: "Shuffle", category: "Performance", definition: "Redistribuição de registros entre partições, comum em joins, agregações e ordenações." },
    { term: "SparkSession", category: "Fundamentos", definition: "Porta de entrada para criar DataFrames, ler e gravar dados e executar Spark SQL." },
    { term: "Stage", category: "Execução", definition: "Grupo de tasks que pode ser executado sem atravessar uma fronteira de shuffle." },
    { term: "Task", category: "Execução", definition: "Menor unidade de trabalho agendada, normalmente associada a uma partição." },
    { term: "Temp view", category: "Spark SQL", definition: "Nome temporário associado a um DataFrame para consultá-lo com SQL durante a sessão." },
    { term: "Transformation", category: "Execução", definition: "Operação que descreve um novo DataFrame sem necessariamente executar o processamento." },
    { term: "Window function", category: "Spark SQL", definition: "Cálculo dentro de grupos lógicos que preserva as linhas, como ranking, lag e acumulados." }
  ];

  window.SPARK_MENTOR_DATA = {
    lessons,
    weekInfo,
    labOperations,
    glossary,
    routine: [
      { label: "Retomada SQL", minutes: 5 },
      { label: "Conceito Spark", minutes: 10 },
      { label: "Solução SQL", minutes: 10 },
      { label: "Tradução PySpark", minutes: 15 },
      { label: "Prática avaliada", minutes: 15 },
      { label: "Quiz e registro", minutes: 5 }
    ]
  };
})();
