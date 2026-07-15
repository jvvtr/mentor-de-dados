(function () {
  "use strict";

  const lessons = [
    {
      id: 1,
      week: 1,
      title: "O que é Apache Spark?",
      subtitle: "Do banco SQL ao processamento distribuído",
      objective: "Entender por que o Spark existe e como driver, executors e cluster trabalham juntos.",
      intro: "Spark não é um banco de dados. É um mecanismo que coordena o processamento de dados, dividindo o trabalho entre várias máquinas quando necessário.",
      analogy: "No Power BI, o mecanismo processa etapas da consulta. No Spark, o driver organiza um plano e distribui partes dele aos executors — como um coordenador repartindo uma consulta grande entre várias equipes.",
      concepts: [
        { title: "Engine de processamento", text: "O Spark lê dados de outras fontes, transforma-os e grava resultados. Ele não precisa ser o lugar onde os dados ficam armazenados." },
        { title: "Driver", text: "É o coordenador da aplicação: interpreta seu código, cria o plano de execução e acompanha as tarefas." },
        { title: "Executors", text: "São os trabalhadores: recebem tarefas, processam partições e devolvem resultados ao driver." },
        { title: "Cluster", text: "É o conjunto de recursos de computação no qual driver e executors são executados." }
      ],
      sql: `-- Ideia conhecida: uma consulta descreve o resultado
SELECT categoria, SUM(valor) AS faturamento
FROM vendas
GROUP BY categoria;`,
      pyspark: `# No PySpark, você descreve a mesma transformação
from pyspark.sql import functions as F

resultado = (
    vendas
    .groupBy("categoria")
    .agg(F.sum("valor").alias("faturamento"))
)

resultado.show()  # a action dispara o processamento`,
      exercise: "Explique com suas palavras o papel do driver e dos executors. Depois, execute a primeira linha abaixo em um notebook Databricks e observe o resultado.",
      starter: `df = spark.range(10)
df.show()`,
      hint: "Pense no driver como quem planeja e nos executors como quem executa os pedaços do trabalho.",
      solution: `# Resposta-modelo:
# O driver cria e coordena o plano.
# Os executors processam as partições em paralelo.

df = spark.range(10)
df.show()`,
      quiz: {
        question: "Qual frase descreve melhor o Apache Spark?",
        options: ["Um banco de dados relacional", "Um mecanismo distribuído de processamento", "Uma linguagem que substitui SQL", "Uma ferramenta exclusiva do Power BI"],
        correct: 1,
        explanation: "Spark é uma engine de processamento. Ele pode consultar várias fontes e usar SQL, mas não é, por si só, um banco de dados."
      }
    },
    {
      id: 2,
      week: 1,
      title: "PySpark e DataFrames",
      subtitle: "A API Python que conversa com o Spark",
      objective: "Criar um DataFrame e reconhecer SparkSession, schema, linhas e colunas.",
      intro: "PySpark é a interface Python do Apache Spark. Você escreve Python, e a API transforma suas instruções em um plano que a engine Spark executa.",
      analogy: "Um DataFrame lembra uma tabela SQL ou uma tabela no Power Query. A diferença é que ele representa um plano distribuído e imutável, não uma planilha carregada na sua tela.",
      concepts: [
        { title: "SparkSession", text: "É a porta de entrada para criar DataFrames, ler arquivos e executar Spark SQL. No Databricks, normalmente já existe como spark." },
        { title: "DataFrame", text: "Uma coleção distribuída de dados organizados em colunas com nomes e tipos." },
        { title: "Schema", text: "Define os nomes e tipos das colunas. printSchema() permite inspecioná-lo." },
        { title: "Imutabilidade", text: "Cada transformação devolve um novo DataFrame; o original não é alterado." }
      ],
      sql: `-- Uma tabela possui colunas tipadas
SELECT id_cliente, nome, estado
FROM clientes;`,
      pyspark: `dados = [
    (1, "Ana", "SP"),
    (2, "Bruno", "RJ"),
    (3, "Carla", "MG")
]

clientes = spark.createDataFrame(
    dados,
    ["id_cliente", "nome", "estado"]
)

clientes.show()
clientes.printSchema()
clientes.count()`,
      exercise: "Crie um DataFrame com três produtos contendo id, categoria e preço. Mostre as linhas e o schema.",
      starter: `produtos = spark.createDataFrame([
    # complete aqui
], ["id_produto", "categoria", "preco"])

produtos.show()
produtos.printSchema()`,
      hint: "Cada linha pode ser uma tupla como (101, \"Notebook\", 3500.0).",
      solution: `produtos = spark.createDataFrame([
    (101, "Notebook", 3500.0),
    (102, "Monitor", 1200.0),
    (103, "Mouse", 90.0)
], ["id_produto", "categoria", "preco"])

produtos.show()
produtos.printSchema()`,
      quiz: {
        question: "Qual objeto normalmente é a porta de entrada para trabalhar com DataFrames?",
        options: ["SparkSession", "ExecutorSession", "PowerQuery", "SQLContext obrigatório"],
        correct: 0,
        explanation: "A SparkSession, normalmente disponível como spark no Databricks, centraliza leitura, criação de DataFrames e Spark SQL."
      }
    },
    {
      id: 3,
      week: 1,
      title: "Selecionar e filtrar",
      subtitle: "SELECT e WHERE na DataFrame API",
      objective: "Traduzir consultas com seleção, filtro, alias e ordenação entre SQL e PySpark.",
      intro: "As operações que você mais usa em SQL têm equivalentes diretos na DataFrame API. O ganho inicial vem de aprender a ler as duas sintaxes como o mesmo plano lógico.",
      analogy: "select() equivale ao SELECT; filter() ou where() equivalem ao WHERE; orderBy() equivale ao ORDER BY.",
      concepts: [
        { title: "select", text: "Escolhe e calcula colunas do resultado." },
        { title: "filter / where", text: "Mantém somente as linhas que atendem a uma condição." },
        { title: "col", text: "Cria uma expressão de coluna explícita, útil para cálculos e condições." },
        { title: "alias", text: "Renomeia uma coluna calculada no resultado." }
      ],
      sql: `SELECT
  id_pedido,
  quantidade * preco_unitario AS valor
FROM pedidos
WHERE status = 'APROVADO'
  AND quantidade >= 2
ORDER BY valor DESC;`,
      pyspark: `from pyspark.sql import functions as F

resultado = (
    pedidos
    .filter(
        (F.col("status") == "APROVADO") &
        (F.col("quantidade") >= 2)
    )
    .select(
        "id_pedido",
        (F.col("quantidade") * F.col("preco_unitario"))
            .alias("valor")
    )
    .orderBy(F.col("valor").desc())
)`,
      exercise: "Traduza para PySpark: selecione nome e estado dos clientes de SP, ordenados por nome.",
      starter: `clientes_sp = (
    clientes
    # complete a sequência
)`,
      hint: "Use filter(F.col(\"estado\") == \"SP\"), select(...) e orderBy(...).",
      solution: `from pyspark.sql import functions as F

clientes_sp = (
    clientes
    .filter(F.col("estado") == "SP")
    .select("nome", "estado")
    .orderBy("nome")
)

clientes_sp.show()`,
      quiz: {
        question: "Ao executar pedidos.filter(...), o que acontece com o DataFrame pedidos?",
        options: ["Ele é alterado permanentemente", "Ele é apagado da memória", "Ele permanece igual; um novo DataFrame é retornado", "Ele vira uma tabela SQL"],
        correct: 2,
        explanation: "DataFrames são imutáveis. filter retorna outro DataFrame que referencia o novo plano de transformação."
      }
    },
    {
      id: 4,
      week: 1,
      title: "Tipos, nulos e colunas calculadas",
      subtitle: "Schema confiável antes da análise",
      objective: "Corrigir tipos, tratar valores nulos e criar regras com when/otherwise.",
      intro: "Grande parte dos erros de dados começa com um tipo incorreto ou um nulo tratado sem intenção. No Spark, o schema é parte central do contrato do dado.",
      analogy: "É parecido com definir tipos no Power Query antes de criar medidas: um preço lido como texto pode invalidar todos os cálculos seguintes.",
      concepts: [
        { title: "cast", text: "Converte uma coluna para outro tipo, como double, integer ou date." },
        { title: "isNull / isNotNull", text: "Testa explicitamente a ausência de valor." },
        { title: "fillna / dropna", text: "Preenche ou remove nulos de forma controlada." },
        { title: "when / otherwise", text: "Expressa regras condicionais equivalentes a CASE WHEN." }
      ],
      sql: `SELECT
  id_produto,
  CAST(preco AS DECIMAL(12,2)) AS preco,
  CASE
    WHEN preco IS NULL THEN 'SEM PREÇO'
    WHEN preco >= 1000 THEN 'ALTO'
    ELSE 'PADRÃO'
  END AS faixa
FROM produtos;`,
      pyspark: `from pyspark.sql import functions as F

tratado = (
    produtos
    .withColumn("preco", F.col("preco").cast("double"))
    .withColumn(
        "faixa",
        F.when(F.col("preco").isNull(), "SEM PREÇO")
         .when(F.col("preco") >= 1000, "ALTO")
         .otherwise("PADRÃO")
    )
)`,
      exercise: "Crie uma coluna valor = quantidade × preco_unitario. Se preco_unitario for nulo, use 0 antes do cálculo.",
      starter: `pedidos_tratados = (
    pedidos
    # trate o nulo e crie valor
)`,
      hint: "Use fillna({\"preco_unitario\": 0}) e depois withColumn.",
      solution: `from pyspark.sql import functions as F

pedidos_tratados = (
    pedidos
    .fillna({"preco_unitario": 0})
    .withColumn(
        "valor",
        F.col("quantidade") * F.col("preco_unitario")
    )
)`,
      quiz: {
        question: "Por que declarar um schema pode ser melhor do que sempre inferi-lo?",
        options: ["Porque elimina todas as linhas nulas", "Porque evita tipos incorretos e torna o contrato explícito", "Porque transforma CSV em Delta", "Porque impede qualquer erro de dados"],
        correct: 1,
        explanation: "Um schema explícito falha cedo, evita inferências erradas e documenta o formato esperado."
      }
    },
    {
      id: 5,
      week: 1,
      title: "Lazy evaluation e actions",
      subtitle: "Por que o Spark adia o trabalho",
      objective: "Distinguir transformations de actions e entender como o Spark monta um DAG.",
      intro: "O Spark não executa cada linha assim que você a escreve. Ele acumula transformações, otimiza o conjunto e só processa quando uma action exige um resultado.",
      analogy: "No Power Query, você monta várias etapas e aplica tudo ao atualizar. O Spark também observa o fluxo completo antes de executar.",
      concepts: [
        { title: "Transformation", text: "Descreve um novo DataFrame: select, filter, join e groupBy são exemplos." },
        { title: "Action", text: "Pede um resultado ou uma gravação: show, count, collect e write disparam execução." },
        { title: "Lazy evaluation", text: "O adiamento permite ao otimizador combinar e reorganizar operações." },
        { title: "DAG", text: "Grafo que representa dependências entre as etapas da computação." }
      ],
      sql: `-- O banco recebe a consulta completa e cria um plano
SELECT estado, COUNT(*) AS clientes
FROM clientes
WHERE estado IS NOT NULL
GROUP BY estado;`,
      pyspark: `plano = (
    clientes
    .filter("estado IS NOT NULL")  # transformation
    .groupBy("estado")             # transformation
    .count()                        # transformation
)

# Até aqui, o Spark apenas montou o plano.
plano.show()  # action: agora ele executa`,
      exercise: "No código abaixo, marque quais linhas são transformations e qual linha é a action que dispara o trabalho.",
      starter: `ativos = clientes.filter("status = 'ATIVO'")
nomes = ativos.select("nome")
ordenados = nomes.orderBy("nome")
total = ordenados.count()`,
      hint: "As três primeiras devolvem DataFrames. A última devolve um número ao programa.",
      solution: `ativos = clientes.filter("status = 'ATIVO'")  # transformation
nomes = ativos.select("nome")               # transformation
ordenados = nomes.orderBy("nome")            # transformation
total = ordenados.count()                     # action`,
      quiz: {
        question: "Qual operação abaixo dispara o processamento?",
        options: ["filter", "select", "withColumn", "count"],
        correct: 3,
        explanation: "count é uma action porque precisa devolver um resultado. As outras apenas estendem o plano."
      }
    },
    {
      id: 6,
      week: 2,
      title: "Ler CSV e Parquet",
      subtitle: "A entrada do seu pipeline",
      objective: "Ler arquivos com opções e schema, reconhecendo por que Parquet favorece análises.",
      intro: "Spark conecta-se a muitos formatos. Para análise, Parquet costuma superar CSV porque guarda tipos e organiza os dados por coluna.",
      analogy: "CSV é como uma exportação plana que precisa ser interpretada toda vez. Parquet se aproxima de um armazenamento analítico já tipado e organizado.",
      concepts: [
        { title: "DataFrameReader", text: "A interface spark.read configura formato, opções e caminho." },
        { title: "CSV", text: "Formato textual, simples, sem tipos nativos e normalmente maior." },
        { title: "Parquet", text: "Formato colunar, comprimido e tipado; permite ler apenas colunas necessárias." },
        { title: "Schema explícito", text: "Evita uma leitura extra para inferência e reduz ambiguidades." }
      ],
      sql: `-- Em Spark SQL, uma tabela pode apontar para arquivos
CREATE OR REPLACE TEMP VIEW pedidos_csv
USING csv
OPTIONS (path '/dados/pedidos.csv', header 'true');`,
      pyspark: `pedidos_csv = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("/dados/pedidos.csv")
)

pedidos_parquet = spark.read.parquet(
    "/dados/pedidos.parquet"
)

pedidos_parquet.printSchema()`,
      exercise: "Escreva a leitura de um CSV com cabeçalho e separador ponto e vírgula. Em seguida, selecione apenas id_pedido e status.",
      starter: `df = (
    spark.read
    # configure e leia o arquivo
)

resultado = df.select(...)`,
      hint: "Use option(\"header\", True), option(\"sep\", \";\") e csv(caminho).",
      solution: `df = (
    spark.read
    .option("header", True)
    .option("sep", ";")
    .option("inferSchema", True)
    .csv("/dados/pedidos.csv")
)

resultado = df.select("id_pedido", "status")`,
      quiz: {
        question: "Por que Parquet costuma ser melhor para leituras analíticas repetidas?",
        options: ["Porque aceita apenas números", "Porque é colunar, comprimido e guarda tipos", "Porque não possui schema", "Porque sempre cabe na memória"],
        correct: 1,
        explanation: "Parquet permite column pruning, compressão eficiente e preserva o schema, reduzindo leitura e interpretação."
      }
    },
    {
      id: 7,
      week: 2,
      title: "Spark SQL na prática",
      subtitle: "Seu SQL executado pela engine Spark",
      objective: "Criar views temporárias e alternar entre Spark SQL e a DataFrame API.",
      intro: "Spark SQL é o módulo do Spark para dados estruturados. Você pode consultar DataFrames com SQL sem mudar de engine.",
      analogy: "Uma temp view dá um nome tabular a um DataFrame. Para quem já conhece SQL, ela é a ponte mais rápida para começar no Spark.",
      concepts: [
        { title: "Temp view", text: "Uma visão temporária ligada à sessão, criada a partir de um DataFrame." },
        { title: "spark.sql", text: "Executa uma string SQL e devolve outro DataFrame." },
        { title: "Catalyst", text: "O otimizador analisa planos vindos tanto de SQL quanto da DataFrame API." },
        { title: "Interoperabilidade", text: "Você pode começar em PySpark, consultar em SQL e continuar em PySpark." }
      ],
      sql: `CREATE OR REPLACE TEMP VIEW vw_pedidos AS
SELECT * FROM parquet.\`/dados/pedidos\`;

SELECT status, COUNT(*) AS quantidade
FROM vw_pedidos
GROUP BY status;`,
      pyspark: `pedidos.createOrReplaceTempView("vw_pedidos")

por_status = spark.sql("""
    SELECT status, COUNT(*) AS quantidade
    FROM vw_pedidos
    GROUP BY status
""")

por_status.show()`,
      exercise: "Registre o DataFrame clientes como vw_clientes e consulte a quantidade de clientes por estado usando spark.sql.",
      starter: `clientes.createOrReplaceTempView(...)

resultado = spark.sql("""
    -- sua consulta
""")`,
      hint: "A consulta é SELECT estado, COUNT(*) ... GROUP BY estado.",
      solution: `clientes.createOrReplaceTempView("vw_clientes")

resultado = spark.sql("""
    SELECT estado, COUNT(*) AS quantidade
    FROM vw_clientes
    GROUP BY estado
    ORDER BY quantidade DESC
""")`,
      quiz: {
        question: "Spark SQL e PySpark DataFrames usam mecanismos de execução totalmente diferentes?",
        options: ["Sim, SQL não usa Spark", "Sim, PySpark ignora o otimizador", "Não, ambos geram planos processados pela engine Spark", "Somente no Power BI"],
        correct: 2,
        explanation: "As duas interfaces geram planos que passam pelo Catalyst e pela mesma engine. Você escolhe a sintaxe mais adequada."
      }
    },
    {
      id: 8,
      week: 2,
      title: "Agregações e métricas",
      subtitle: "GROUP BY com a DataFrame API",
      objective: "Calcular faturamento, ticket médio e clientes únicos com groupBy e agg.",
      intro: "Agregações mudam a granularidade: várias linhas de pedidos viram uma linha por grupo, exatamente como em SQL.",
      analogy: "Pense numa visualização do Power BI: as dimensões definem os grupos e as medidas definem os cálculos.",
      concepts: [
        { title: "groupBy", text: "Define as colunas que formarão a nova granularidade." },
        { title: "agg", text: "Recebe uma ou várias expressões agregadas." },
        { title: "countDistinct", text: "Conta valores únicos dentro de cada grupo." },
        { title: "Agregação condicional", text: "Combina when com sum/count para métricas filtradas." }
      ],
      sql: `SELECT
  categoria,
  SUM(quantidade * preco_unitario) AS faturamento,
  AVG(quantidade * preco_unitario) AS ticket_medio,
  COUNT(DISTINCT id_cliente) AS clientes
FROM vendas
GROUP BY categoria;`,
      pyspark: `from pyspark.sql import functions as F

metricas = (
    vendas
    .withColumn("valor", F.col("quantidade") * F.col("preco_unitario"))
    .groupBy("categoria")
    .agg(
        F.sum("valor").alias("faturamento"),
        F.avg("valor").alias("ticket_medio"),
        F.countDistinct("id_cliente").alias("clientes")
    )
)`,
      exercise: "Calcule quantidade de pedidos e faturamento por status. Crie valor antes de agregar.",
      starter: `metricas_status = (
    pedidos
    # valor, agrupamento e métricas
)`,
      hint: "Use withColumn, groupBy e agg com count e sum.",
      solution: `from pyspark.sql import functions as F

metricas_status = (
    pedidos
    .withColumn("valor", F.col("quantidade") * F.col("preco_unitario"))
    .groupBy("status")
    .agg(
        F.count("id_pedido").alias("pedidos"),
        F.sum("valor").alias("faturamento")
    )
)`,
      quiz: {
        question: "Após groupBy(\"categoria\"), qual será a granularidade do resultado agregado?",
        options: ["Uma linha por pedido", "Uma linha por cliente", "Uma linha por categoria", "A granularidade não muda"],
        correct: 2,
        explanation: "As chaves do groupBy definem a granularidade. O resultado terá uma linha para cada categoria distinta."
      }
    },
    {
      id: 9,
      week: 2,
      title: "Joins sem surpresas",
      subtitle: "Chaves, cardinalidade e validação",
      objective: "Usar inner e left joins e identificar duplicações causadas pela cardinalidade.",
      intro: "A sintaxe do join é fácil; o ponto crítico é entender se a chave é única. Uma dimensão duplicada pode multiplicar o faturamento silenciosamente.",
      analogy: "É o mesmo risco de relacionamento muitos-para-muitos no Power BI: a consulta roda, mas a métrica pode ficar errada.",
      concepts: [
        { title: "Inner join", text: "Mantém apenas chaves encontradas nos dois lados." },
        { title: "Left join", text: "Preserva todas as linhas da esquerda, mesmo sem correspondência." },
        { title: "Cardinalidade", text: "Descreve quantas linhas de um lado podem corresponder a linhas do outro." },
        { title: "Validação", text: "Conte linhas e reconcilie totais antes e depois do join." }
      ],
      sql: `SELECT
  p.id_pedido,
  c.nome,
  pr.categoria
FROM pedidos p
LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN produtos pr ON p.id_produto = pr.id_produto;`,
      pyspark: `enriquecidos = (
    pedidos.alias("p")
    .join(
        clientes.alias("c"),
        F.col("p.id_cliente") == F.col("c.id_cliente"),
        "left"
    )
    .join(produtos.alias("pr"), "id_produto", "left")
    .select("p.id_pedido", "c.nome", "pr.categoria")
)`,
      exercise: "Faça left join de pedidos com clientes pela coluna id_cliente. Depois conte pedidos sem nome de cliente.",
      starter: `enriquecidos = pedidos.join(
    clientes,
    # chave e tipo
)

sem_cliente = enriquecidos.filter(...)`,
      hint: "Depois do join, filtre F.col(\"nome\").isNull().",
      solution: `enriquecidos = pedidos.join(
    clientes,
    on="id_cliente",
    how="left"
)

sem_cliente = enriquecidos.filter(
    F.col("nome").isNull()
).count()`,
      quiz: {
        question: "Um left join preserva todas as linhas de qual DataFrame?",
        options: ["Do DataFrame da direita", "Do DataFrame da esquerda", "Somente as chaves duplicadas", "De nenhum; mantém só correspondências"],
        correct: 1,
        explanation: "O left join mantém todas as linhas da esquerda e preenche com nulo quando não encontra correspondência à direita."
      }
    },
    {
      id: 10,
      week: 2,
      title: "Datas e funções de janela",
      subtitle: "Ranking sem perder as linhas",
      objective: "Tratar datas e usar janelas para ranking e cálculos dentro de grupos.",
      intro: "GROUP BY reduz linhas; uma window function calcula dentro de um grupo preservando cada linha original.",
      analogy: "Em SQL, você já pode conhecer OVER(PARTITION BY...). No Spark, Window cria a mesma especificação para a DataFrame API.",
      concepts: [
        { title: "to_date", text: "Converte texto em data usando um formato conhecido." },
        { title: "Window.partitionBy", text: "Define os grupos lógicos da janela." },
        { title: "orderBy na janela", text: "Define a ordem usada por ranking, lag e acumulados." },
        { title: "row_number / dense_rank", text: "Atribuem posições dentro de cada grupo." }
      ],
      sql: `SELECT *
FROM (
  SELECT
    mes,
    produto,
    faturamento,
    DENSE_RANK() OVER (
      PARTITION BY mes
      ORDER BY faturamento DESC
    ) AS posicao
  FROM vendas_mensais
) x
WHERE posicao <= 3;`,
      pyspark: `from pyspark.sql import Window, functions as F

janela = Window.partitionBy("mes").orderBy(
    F.col("faturamento").desc()
)

top3 = (
    vendas_mensais
    .withColumn("posicao", F.dense_rank().over(janela))
    .filter(F.col("posicao") <= 3)
)`,
      exercise: "Crie um ranking de clientes por faturamento dentro de cada estado, do maior para o menor.",
      starter: `janela = Window.partitionBy(...).orderBy(...)

ranking = clientes_metricas.withColumn(
    "posicao",
    # função sobre a janela
)`,
      hint: "Particione por estado, ordene faturamento desc e use dense_rank().over(janela).",
      solution: `from pyspark.sql import Window, functions as F

janela = Window.partitionBy("estado").orderBy(
    F.col("faturamento").desc()
)

ranking = clientes_metricas.withColumn(
    "posicao",
    F.dense_rank().over(janela)
)`,
      quiz: {
        question: "Qual operação preserva as linhas originais enquanto adiciona um ranking?",
        options: ["GROUP BY", "Uma função de janela", "DROP DISTINCT", "UNION"],
        correct: 1,
        explanation: "A janela calcula sobre grupos lógicos sem reduzir a quantidade de linhas, ao contrário de uma agregação."
      }
    },
    {
      id: 11,
      week: 3,
      title: "Partitions e paralelismo",
      subtitle: "Como o Spark divide os dados",
      objective: "Entender partições, tasks e quando usar repartition ou coalesce.",
      intro: "Uma partição é uma fração dos dados processada por uma task. A quantidade e a distribuição das partições influenciam o paralelismo. No Databricks Free Edition, observe as partições somente com APIs de DataFrame, pois APIs de RDD não são suportadas pelo compute serverless.",
      analogy: "Imagine dividir uma tabela enorme em lotes. Executors trabalham em lotes diferentes ao mesmo tempo, desde que existam recursos disponíveis.",
      concepts: [
        { title: "Partition", text: "Unidade física/lógica de dados que uma task processa por vez." },
        { title: "Task", text: "A menor unidade de trabalho enviada a um executor." },
        { title: "repartition", text: "Redistribui dados e pode aumentar ou reduzir partições, normalmente com shuffle." },
        { title: "coalesce", text: "Costuma reduzir partições com menos movimentação, útil antes de uma saída menor." }
      ],
      sql: `-- Particionamento é detalhe físico; a consulta continua declarativa
SELECT estado, SUM(valor)
FROM vendas
GROUP BY estado;`,
      pyspark: `from pyspark.sql import functions as F

por_estado = vendas.repartition(8, "estado")

distribuicao = (
    por_estado
    .select(F.spark_partition_id().alias("particao"))
    .groupBy("particao")
    .count()
    .orderBy("particao")
)

distribuicao.show()  # mostra somente partições com linhas
por_estado.explain("formatted")  # procure hashpartitioning(estado, 8)

saida_menor = por_estado.coalesce(2)`,
      exercise: "Redistribua pedidos para 4 partições por status, liste os IDs das partições que receberam linhas e confirme o reparticionamento no plano.",
      starter: `from pyspark.sql import functions as F

pedidos_4 = pedidos.____(____, ____)

distribuicao = (
    pedidos_4
    .select(F.____().alias("particao"))
    .groupBy("particao")
    .count()
    .orderBy("particao")
)

distribuicao.show()
pedidos_4.____("formatted")`,
      hint: "Use repartition(4, \"status\"), spark_partition_id() e explain(\"formatted\"). A tabela de distribuição mostra apenas partições não vazias.",
      solution: `from pyspark.sql import functions as F

pedidos_4 = pedidos.repartition(4, "status")

distribuicao = (
    pedidos_4
    .select(F.spark_partition_id().alias("particao"))
    .groupBy("particao")
    .count()
    .orderBy("particao")
)

distribuicao.show()
pedidos_4.explain("formatted")`,
      quiz: {
        question: "O que uma partição representa durante o processamento?",
        options: ["Uma máquina inteira", "Uma fração dos dados processada por uma task", "Uma tabela obrigatoriamente pequena", "Um usuário do Databricks"],
        correct: 1,
        explanation: "Cada task trabalha sobre uma partição. Várias tasks podem rodar em paralelo nos executors."
      }
    },
    {
      id: 12,
      week: 3,
      title: "Shuffle: o custo invisível",
      subtitle: "Quando dados atravessam o cluster",
      objective: "Reconhecer operações que causam shuffle e reduzir dados antes de movimentá-los.",
      intro: "Shuffle ocorre quando o Spark precisa redistribuir registros entre partições, frequentemente através da rede. É necessário, mas costuma ser caro.",
      analogy: "Se cada equipe recebeu um lote, mas agora você precisa agrupar todos os clientes do mesmo estado, parte dos papéis terá de trocar de equipe.",
      concepts: [
        { title: "Narrow transformation", text: "Cada partição de saída depende de poucas partições de entrada, como filter e select." },
        { title: "Wide transformation", text: "A saída depende de várias entradas e normalmente exige shuffle." },
        { title: "Causadores comuns", text: "groupBy, join, distinct, repartition e orderBy frequentemente movimentam dados." },
        { title: "Redução antecipada", text: "Filtrar linhas e selecionar colunas cedo diminui o volume do shuffle." }
      ],
      sql: `-- Filtre antes de agregar para mover menos dados
SELECT estado, SUM(valor)
FROM vendas
WHERE status = 'APROVADO'
GROUP BY estado;`,
      pyspark: `otimizado = (
    vendas
    .filter(F.col("status") == "APROVADO")
    .select("estado", "valor")
    .groupBy("estado")
    .agg(F.sum("valor").alias("faturamento"))
)

otimizado.explain()`,
      exercise: "Reorganize uma consulta para filtrar somente pedidos aprovados e selecionar apenas estado e valor antes do groupBy.",
      starter: `resultado = (
    vendas
    # reduza antes do groupBy
)`,
      hint: "A ordem didática é filter → select → groupBy → agg.",
      solution: `resultado = (
    vendas
    .filter(F.col("status") == "APROVADO")
    .select("estado", "valor")
    .groupBy("estado")
    .agg(F.sum("valor").alias("faturamento"))
)`,
      quiz: {
        question: "Qual grupo contém operações que normalmente provocam shuffle?",
        options: ["select e filter", "groupBy, join e orderBy", "withColumn e alias", "show e printSchema apenas"],
        correct: 1,
        explanation: "Essas operações precisam reagrupar ou ordenar dados vindos de várias partições, causando redistribuição."
      }
    },
    {
      id: 13,
      week: 3,
      title: "Cache com propósito (laboratório local)",
      subtitle: "Prática opcional fora do Free Edition",
      objective: "Compreender quando cache/persist ajuda e praticar cache/unpersist no PySpark local.",
      intro: "Esta prática é exclusiva do ambiente PySpark local fornecido no starter. No Databricks Free Edition, leia os conceitos e responda ao quiz sem executar os comandos de cache. Cache evita recomputar um DataFrame reutilizado, mas ocupa memória e só é materializado quando uma action ocorre.",
      analogy: "É como manter uma consulta intermediária pronta para vários visuais. Faz sentido se ela for cara e reutilizada, não para cada etapa do fluxo.",
      concepts: [
        { title: "Ambiente desta aula", text: "Execute o exemplo apenas no PySpark local; no Free Edition, trate-o como estudo conceitual." },
        { title: "cache", text: "Marca o DataFrame para persistência usando o nível padrão." },
        { title: "persist", text: "Permite escolher níveis de armazenamento, como memória e disco." },
        { title: "Materialização", text: "Uma action precisa executar o plano para preencher o cache." },
        { title: "unpersist", text: "Libera os blocos quando a reutilização termina." }
      ],
      sql: `-- LABORATÓRIO LOCAL: não execute estes comandos no Free Edition
-- Conceito: uma view temporária não significa cache automático
CACHE TABLE vendas_aprovadas;
SELECT COUNT(*) FROM vendas_aprovadas;
UNCACHE TABLE vendas_aprovadas;`,
      pyspark: `# LABORATÓRIO LOCAL: execute com o starter do Mentor de Dados
aprovadas = (
    vendas
    .filter(F.col("status") == "APROVADO")
    .cache()
)

aprovadas.count()  # materializa
aprovadas.groupBy("estado").sum("valor").show()
aprovadas.groupBy("categoria").sum("valor").show()
aprovadas.unpersist()`,
      exercise: "Somente no PySpark local: marque uma agregação cara para cache, materialize-a com count, use-a duas vezes e depois libere-a.",
      starter: `base = transformacao_cara.____()
base.____()  # materializa

# duas análises

base.____()`,
      hint: "Execute no ambiente local do starter. Os métodos são cache(), count() e unpersist().",
      solution: `base = transformacao_cara.cache()
base.count()

base.filter("estado = 'SP'").show()
base.groupBy("categoria").sum("valor").show()

base.unpersist()`,
      quiz: {
        question: "Por que não aplicar cache em todos os DataFrames?",
        options: ["Porque cache impede SQL", "Porque consome recursos e pode custar mais do que recomputar", "Porque só funciona com CSV", "Porque apaga partições"],
        correct: 1,
        explanation: "Cache tem custo de armazenamento e materialização. Use-o em resultados caros que serão reutilizados."
      }
    },
    {
      id: 14,
      week: 3,
      title: "Broadcast join e data skew",
      subtitle: "Joins mais inteligentes",
      objective: "Reconhecer dimensões pequenas e usar broadcast, além de identificar chaves desbalanceadas.",
      intro: "Se uma tabela é pequena, o Spark pode enviá-la a cada executor e evitar a redistribuição da tabela grande.",
      analogy: "Em vez de reunir todos num arquivo central, cada equipe recebe uma cópia do pequeno catálogo de produtos e consulta localmente.",
      concepts: [
        { title: "Broadcast", text: "Copia uma relação pequena para os executors, evitando shuffle do lado grande." },
        { title: "Fato e dimensão", text: "Uma dimensão pequena costuma ser candidata; a fato grande normalmente não." },
        { title: "Data skew", text: "Algumas chaves concentram dados demais e criam tasks muito mais lentas." },
        { title: "Plano físico", text: "explain ajuda a confirmar BroadcastHashJoin ou outra estratégia escolhida." }
      ],
      sql: `SELECT /*+ BROADCAST(p) */
  v.id_pedido,
  p.categoria
FROM vendas v
JOIN produtos p ON v.id_produto = p.id_produto;`,
      pyspark: `from pyspark.sql.functions import broadcast

enriquecidas = vendas.join(
    broadcast(produtos),
    on="id_produto",
    how="left"
)

enriquecidas.explain()`,
      exercise: "Faça join de pedidos com a pequena tabela produtos usando broadcast e inspecione o plano.",
      starter: `resultado = pedidos.join(
    ____(produtos),
    on=____,
    how=____
)

resultado.____()`,
      hint: "Importe broadcast, use a chave id_produto e finalize com explain().",
      solution: `from pyspark.sql.functions import broadcast

resultado = pedidos.join(
    broadcast(produtos),
    on="id_produto",
    how="left"
)

resultado.explain()`,
      quiz: {
        question: "Quando uma tabela é boa candidata a broadcast?",
        options: ["Quando é a maior tabela do pipeline", "Quando é pequena o bastante para ser copiada aos executors", "Quando não possui chave", "Sempre que houver um left join"],
        correct: 1,
        explanation: "Broadcast é eficiente quando a relação pequena cabe com segurança na memória dos executors."
      }
    },
    {
      id: 15,
      week: 3,
      title: "Ler o plano de execução",
      subtitle: "explain antes de adivinhar",
      objective: "Identificar filtros, projeções, exchanges e estratégias de join no plano.",
      intro: "O plano revela o que a engine realmente fará. Ele é a ponte entre o código legível e o custo físico da execução.",
      analogy: "É semelhante ao plano de execução de um banco SQL: você procura leituras excessivas, movimentações e estratégias de join.",
      concepts: [
        { title: "Plano lógico", text: "Representa as operações e passa por otimizações do Catalyst." },
        { title: "Plano físico", text: "Mostra operadores concretos, exchanges, scans e joins." },
        { title: "Predicate pushdown", text: "Empurra filtros para a leitura quando a fonte permite." },
        { title: "collect", text: "Traz todas as linhas ao driver; pode exceder sua memória." }
      ],
      sql: `EXPLAIN FORMATTED
SELECT categoria, SUM(valor)
FROM vendas
WHERE data_pedido >= DATE '2026-01-01'
GROUP BY categoria;`,
      pyspark: `consulta = (
    vendas
    .filter(F.col("data_pedido") >= "2026-01-01")
    .groupBy("categoria")
    .agg(F.sum("valor").alias("faturamento"))
)

consulta.explain("formatted")`,
      exercise: "Use explain('formatted') em um join e procure as palavras Exchange e Join. Anote o que encontrou.",
      starter: `consulta = pedidos.join(clientes, "id_cliente", "left")

# inspecione o plano detalhado`,
      hint: "Chame consulta.explain(\"formatted\"). Exchange costuma indicar redistribuição.",
      solution: `consulta = pedidos.join(clientes, "id_cliente", "left")
consulta.explain("formatted")

# Procure, por exemplo:
# Exchange — redistribuição/shuffle
# SortMergeJoin ou BroadcastHashJoin — estratégia de join`,
      quiz: {
        question: "Por que collect() pode derrubar o driver?",
        options: ["Porque remove o schema", "Porque tenta trazer todos os dados para a memória do driver", "Porque sempre causa broadcast", "Porque só aceita uma coluna"],
        correct: 1,
        explanation: "collect retorna todas as linhas ao processo do driver. Em datasets grandes, a memória local pode não suportar."
      }
    },
    {
      id: 16,
      week: 4,
      title: "Qualidade de dados",
      subtitle: "Não basta o pipeline terminar",
      objective: "Aplicar regras de nulos, domínio, unicidade e integridade de chaves.",
      intro: "Um job verde pode produzir um resultado errado. Qualidade transforma expectativas de negócio em validações observáveis.",
      analogy: "É como validar medidas do Power BI contra totais conhecidos: contagem, unicidade e reconciliação fazem parte do resultado.",
      concepts: [
        { title: "Completude", text: "Colunas obrigatórias não podem estar nulas." },
        { title: "Unicidade", text: "Chaves esperadas como únicas não devem aparecer repetidas." },
        { title: "Domínio", text: "Valores devem pertencer a um conjunto permitido ou a uma faixa válida." },
        { title: "Integridade referencial", text: "Chaves de fatos precisam encontrar dimensões quando a regra exige." }
      ],
      sql: `SELECT
  COUNT(*) AS linhas,
  COUNT(DISTINCT id_pedido) AS pedidos_unicos,
  SUM(CASE WHEN id_cliente IS NULL THEN 1 ELSE 0 END) AS sem_cliente
FROM pedidos;`,
      pyspark: `validacao = pedidos.agg(
    F.count("*").alias("linhas"),
    F.countDistinct("id_pedido").alias("pedidos_unicos"),
    F.sum(
        F.when(F.col("id_cliente").isNull(), 1).otherwise(0)
    ).alias("sem_cliente")
)

rejeitados = pedidos.filter(
    F.col("id_pedido").isNull() |
    ~F.col("status").isin("APROVADO", "PENDENTE", "CANCELADO")
)`,
      exercise: "Separe pedidos válidos e rejeitados. Rejeite id_pedido nulo, quantidade <= 0 ou status fora da lista permitida.",
      starter: `regra_invalida = (
    # combine as três condições com |
)

rejeitados = pedidos.filter(regra_invalida)
validos = pedidos.filter(____)`,
      hint: "Para os válidos, negue toda a expressão com ~regra_invalida.",
      solution: `regra_invalida = (
    F.col("id_pedido").isNull() |
    (F.col("quantidade") <= 0) |
    ~F.col("status").isin("APROVADO", "PENDENTE", "CANCELADO")
)

rejeitados = pedidos.filter(regra_invalida)
validos = pedidos.filter(~regra_invalida)`,
      quiz: {
        question: "Além de contar linhas, quais validações fortalecem a confiança nos dados?",
        options: ["Somente ordenar o resultado", "Unicidade, nulos, domínios, chaves e reconciliação", "Aumentar executors", "Aplicar cache em tudo"],
        correct: 1,
        explanation: "Qualidade cobre estrutura e regras de negócio; nenhuma contagem isolada garante correção."
      }
    },
    {
      id: 17,
      week: 4,
      title: "Deduplicação com janelas",
      subtitle: "Manter o registro mais recente",
      objective: "Usar row_number, partitionBy e orderBy para deduplicar versões.",
      intro: "dropDuplicates escolhe uma linha sem controlar qual versão fica. Uma janela permite ordenar por atualização e manter explicitamente a mais recente.",
      analogy: "É como obter a última situação de cada pedido em uma tabela de histórico, uma operação comum em SQL com ROW_NUMBER.",
      concepts: [
        { title: "Chave de negócio", text: "Define o grupo de registros que representa a mesma entidade." },
        { title: "Ordenação determinística", text: "Define qual versão vence, normalmente atualizado_em decrescente." },
        { title: "row_number", text: "Numera as versões dentro da chave; a posição 1 é selecionada." },
        { title: "lag e acumulados", text: "Outros cálculos úteis sobre histórico ordenado." }
      ],
      sql: `SELECT * EXCEPT (rn)
FROM (
  SELECT p.*,
    ROW_NUMBER() OVER (
      PARTITION BY id_pedido
      ORDER BY atualizado_em DESC
    ) AS rn
  FROM pedidos_historico p
) x
WHERE rn = 1;`,
      pyspark: `janela = Window.partitionBy("id_pedido").orderBy(
    F.col("atualizado_em").desc()
)

pedidos_atuais = (
    pedidos_historico
    .withColumn("rn", F.row_number().over(janela))
    .filter(F.col("rn") == 1)
    .drop("rn")
)`,
      exercise: "Mantenha o registro mais recente de cada cliente usando id_cliente e atualizado_em.",
      starter: `janela = Window.partitionBy(____).orderBy(____)

clientes_atuais = (
    clientes_historico
    .withColumn("rn", ____)
    .filter(____)
    .drop("rn")
)`,
      hint: "Use row_number().over(janela) e filtre rn == 1.",
      solution: `janela = Window.partitionBy("id_cliente").orderBy(
    F.col("atualizado_em").desc()
)

clientes_atuais = (
    clientes_historico
    .withColumn("rn", F.row_number().over(janela))
    .filter(F.col("rn") == 1)
    .drop("rn")
)`,
      quiz: {
        question: "Como row_number seleciona a versão mais recente de cada chave?",
        options: ["Agrupa sem ordenar", "Particiona pela chave, ordena atualização desc e mantém rn = 1", "Usa collect em cada chave", "Aplica cache e distinct"],
        correct: 1,
        explanation: "A partição cria um ranking por entidade; ordenar a data decrescente coloca a versão mais recente na posição 1."
      }
    },
    {
      id: 18,
      week: 4,
      title: "Gravar tabelas Delta gerenciadas",
      subtitle: "Saídas confiáveis no Databricks Free Edition",
      objective: "Escolher modo de gravação e particionamento ao salvar uma tabela Delta gerenciada.",
      intro: "No Databricks, Delta adiciona transações e histórico sobre arquivos Parquet. No Free Edition, prefira tabelas gerenciadas pelo Unity Catalog em vez de caminhos soltos como /gold ou /silver.",
      analogy: "Parquet organiza os arquivos para análise; Delta acrescenta um diário transacional que controla versões e mudanças.",
      concepts: [
        { title: "append / overwrite", text: "Append acrescenta dados; overwrite substitui o destino ou partições conforme a configuração." },
        { title: "Delta Lake", text: "Adiciona log transacional, ACID, schema enforcement, merge e time travel." },
        { title: "Tabela gerenciada", text: "O catálogo controla o nome e o local de armazenamento; saveAsTable grava sem exigir um caminho manual." },
        { title: "partitionBy na escrita", text: "Organiza fisicamente a tabela por valores, útil para filtros frequentes e colunas de baixa cardinalidade." },
        { title: "Small files", text: "Arquivos pequenos demais aumentam metadados e podem prejudicar leituras." }
      ],
      sql: `CREATE SCHEMA IF NOT EXISTS spark_mentor;

CREATE OR REPLACE TABLE spark_mentor.vendas_mensais
USING DELTA
PARTITIONED BY (ano_mes)
AS SELECT * FROM vw_vendas_mensais;

SELECT * FROM spark_mentor.vendas_mensais
VERSION AS OF 0;`,
      pyspark: `spark.sql("CREATE SCHEMA IF NOT EXISTS spark_mentor")

(
    vendas_limpas
    .write
    .format("delta")
    .mode("overwrite")
    .partitionBy("ano_mes")
    .saveAsTable("spark_mentor.vendas_mensais")
)

releitura = (
    spark.read.table("spark_mentor.vendas_mensais")
    .filter(F.col("ano_mes") == "2026-07")
)`,
      exercise: "Crie o schema spark_mentor, grave pedidos_validos como a tabela Delta gerenciada spark_mentor.pedidos no modo overwrite, particione por ano_mes e releia a tabela.",
      starter: `spark.sql("CREATE SCHEMA IF NOT EXISTS ____")

(
    pedidos_validos.write
    # formato, modo, partição e tabela gerenciada
)

resultado = spark.read.____(____)`,
      hint: "Crie o schema spark_mentor e encadeie format('delta'), mode('overwrite'), partitionBy('ano_mes') e saveAsTable('spark_mentor.pedidos').",
      solution: `spark.sql("CREATE SCHEMA IF NOT EXISTS spark_mentor")

(
    pedidos_validos.write
    .format("delta")
    .mode("overwrite")
    .partitionBy("ano_mes")
    .saveAsTable("spark_mentor.pedidos")
)

resultado = spark.read.table("spark_mentor.pedidos")`,
      quiz: {
        question: "O que Delta acrescenta ao armazenamento Parquet?",
        options: ["Somente arquivos CSV auxiliares", "Log transacional, ACID, versões e operações como merge", "Uma linguagem que substitui Python", "Memória infinita"],
        correct: 1,
        explanation: "Delta usa Parquet como dados e adiciona um log que habilita garantias transacionais e evolução controlada."
      }
    },
    {
      id: 19,
      week: 4,
      title: "Projeto: pipeline de vendas",
      subtitle: "Bronze, Silver e Gold",
      objective: "Unir ingestão, limpeza, joins e métricas em um pipeline pequeno e verificável.",
      intro: "O projeto consolida a trilha: dados brutos entram em Bronze, são limpos em Silver e viram métricas de negócio em Gold.",
      analogy: "Silver funciona como uma camada de dados confiáveis; Gold se aproxima do modelo pronto para o Power BI.",
      concepts: [
        { title: "Bronze", text: "Dados recebidos com mínima transformação e rastreabilidade da origem." },
        { title: "Silver", text: "Dados tipados, deduplicados, validados e integrados." },
        { title: "Gold", text: "Tabelas orientadas a métricas e consumidores analíticos." },
        { title: "Reconciliação", text: "Compara contagens e valores em cada passagem para detectar perdas ou multiplicações." }
      ],
      sql: `CREATE OR REPLACE TEMP VIEW gold_vendas AS
SELECT
  DATE_TRUNC('month', data_pedido) AS mes,
  categoria,
  SUM(quantidade * preco_unitario) AS faturamento,
  COUNT(DISTINCT id_pedido) AS pedidos
FROM silver_vendas
WHERE status = 'APROVADO'
GROUP BY 1, 2;`,
      pyspark: `silver = (
    pedidos
    .filter(F.col("status") == "APROVADO")
    .join(clientes, "id_cliente", "left")
    .join(produtos, "id_produto", "left")
    .withColumn("valor", F.col("quantidade") * F.col("preco_unitario"))
)

gold = (
    silver
    .withColumn("mes", F.date_trunc("month", "data_pedido"))
    .groupBy("mes", "categoria")
    .agg(
        F.sum("valor").alias("faturamento"),
        F.countDistinct("id_pedido").alias("pedidos")
    )
)`,
      exercise: "Monte uma Gold com faturamento, ticket médio e clientes únicos por mês e categoria. Inclua apenas aprovados.",
      starter: `gold = (
    silver
    # filtro, mês, agrupamento e métricas
)`,
      hint: "Crie mes com date_trunc, agrupe por mes/categoria e use sum, avg e countDistinct.",
      solution: `gold = (
    silver
    .filter(F.col("status") == "APROVADO")
    .withColumn("mes", F.date_trunc("month", "data_pedido"))
    .groupBy("mes", "categoria")
    .agg(
        F.sum("valor").alias("faturamento"),
        F.avg("valor").alias("ticket_medio"),
        F.countDistinct("id_cliente").alias("clientes_unicos")
    )
)`,
      quiz: {
        question: "Antes de confiar no faturamento depois dos joins, o que deve ser validado?",
        options: ["A cor do notebook", "Cardinalidade, duplicações e reconciliação de totais", "Apenas o tempo de execução", "Somente o nome das colunas"],
        correct: 1,
        explanation: "Joins podem multiplicar linhas. Compare contagens e somas antes/depois e valide a unicidade das dimensões."
      }
    },
    {
      id: 20,
      week: 4,
      title: "Consolidação e próximos passos",
      subtitle: "Escolher SQL ou PySpark com intenção",
      objective: "Revisar a arquitetura, justificar escolhas e planejar a evolução no Databricks.",
      intro: "Você não precisa abandonar SQL. Spark SQL e PySpark são duas formas de expressar planos na mesma engine; a escolha depende do problema e da equipe.",
      analogy: "SQL é excelente para transformações declarativas. PySpark ajuda quando o fluxo exige composição, funções, parâmetros, testes e reutilização.",
      concepts: [
        { title: "Spark SQL", text: "Ótimo para consultas, modelos analíticos e colaboração com profissionais de dados que dominam SQL." },
        { title: "PySpark", text: "Útil para pipelines programáticos, abstrações, automação e integração com código Python." },
        { title: "Performance", text: "Em operações equivalentes, ambos podem gerar o mesmo plano otimizado." },
        { title: "Próxima etapa", text: "Pratique com dados reais, acompanhe o Spark UI e aprenda Delta/Jobs gradualmente." }
      ],
      sql: `SELECT
  estado,
  SUM(valor) AS faturamento
FROM silver_vendas
WHERE status = 'APROVADO'
GROUP BY estado;`,
      pyspark: `resultado = (
    silver_vendas
    .filter(F.col("status") == "APROVADO")
    .groupBy("estado")
    .agg(F.sum("valor").alias("faturamento"))
)

# Compare os planos das duas versões.
resultado.explain("formatted")`,
      exercise: "Escreva cinco tópicos explicando: o que é Spark, DataFrame, lazy evaluation, partition/shuffle e quando você escolheria SQL ou PySpark.",
      starter: `1. Spark é...
2. Um DataFrame...
3. Lazy evaluation...
4. Partition e shuffle...
5. Eu escolheria...`,
      hint: "Use suas próprias palavras. Se conseguir explicar sem copiar, o conceito já está ficando sólido.",
      solution: `1. Spark é uma engine distribuída que coordena processamento de dados.
2. DataFrame é uma coleção distribuída, tabular, tipada e imutável.
3. Lazy evaluation adia o processamento para otimizar o plano completo.
4. Partition divide os dados; shuffle redistribui registros entre partições.
5. SQL é direto para transformações declarativas; PySpark favorece fluxos programáticos e reutilizáveis.`,
      quiz: {
        question: "Qual critério é mais correto ao escolher entre Spark SQL e PySpark?",
        options: ["PySpark é sempre mais rápido", "SQL nunca deve ser usado no Spark", "Escolher a sintaxe adequada ao problema; operações equivalentes podem gerar o mesmo plano", "Usar ambos obrigatoriamente em toda célula"],
        correct: 2,
        explanation: "O otimizador trabalha com planos, não com preferência de sintaxe. Clareza, equipe e necessidade de programação orientam a escolha."
      }
    }
  ];

  const weekInfo = [
    { week: 1, title: "Fundamentos e DataFrames", description: "Entenda a arquitetura e domine as primeiras transformações." },
    { week: 2, title: "Spark SQL e análise", description: "Use seu conhecimento de SQL para consultar, agregar e combinar dados." },
    { week: 3, title: "Execução e performance", description: "Veja como partitions, shuffle, cache e joins afetam o cluster." },
    { week: 4, title: "Pipeline no Databricks", description: "Trate qualidade, grave em Delta e monte um projeto de vendas." }
  ];

  const labOperations = [
    {
      id: "select",
      label: "Selecionar colunas",
      title: "SELECT → select",
      description: "Escolha apenas as colunas necessárias. Isso também ajuda o Spark a evitar leitura e transporte desnecessários.",
      sql: `SELECT id_pedido, status, quantidade
FROM pedidos;`,
      pyspark: `resultado = pedidos.select(
    "id_pedido",
    "status",
    "quantidade"
)`,
      note: "Em ambos os casos, o resultado continua sendo um DataFrame e ainda não precisa ter sido executado."
    },
    {
      id: "filter",
      label: "Filtrar linhas",
      title: "WHERE → filter",
      description: "Combine condições com &, | e ~. Cada expressão precisa de parênteses na DataFrame API.",
      sql: `SELECT *
FROM pedidos
WHERE status = 'APROVADO'
  AND quantidade >= 2;`,
      pyspark: `resultado = pedidos.filter(
    (F.col("status") == "APROVADO") &
    (F.col("quantidade") >= 2)
)`,
      note: "filter e where são equivalentes no PySpark. Use a forma que deixar o código mais claro."
    },
    {
      id: "case",
      label: "CASE WHEN",
      title: "CASE WHEN → when",
      description: "Crie classificações e regras condicionais sem recorrer a funções Python linha a linha.",
      sql: `SELECT
  CASE
    WHEN valor >= 1000 THEN 'ALTO'
    WHEN valor >= 500 THEN 'MÉDIO'
    ELSE 'BAIXO'
  END AS faixa
FROM vendas;`,
      pyspark: `resultado = vendas.withColumn(
    "faixa",
    F.when(F.col("valor") >= 1000, "ALTO")
     .when(F.col("valor") >= 500, "MÉDIO")
     .otherwise("BAIXO")
)`,
      note: "Prefira funções nativas do Spark: o otimizador entende essas expressões e pode planejar melhor."
    },
    {
      id: "group",
      label: "Agrupar",
      title: "GROUP BY → groupBy + agg",
      description: "As chaves do agrupamento definem a granularidade do resultado.",
      sql: `SELECT estado, SUM(valor) AS faturamento
FROM vendas
GROUP BY estado;`,
      pyspark: `resultado = (
    vendas
    .groupBy("estado")
    .agg(F.sum("valor").alias("faturamento"))
)`,
      note: "groupBy normalmente provoca shuffle porque registros do mesmo estado precisam chegar ao mesmo conjunto de tasks."
    },
    {
      id: "join",
      label: "Combinar tabelas",
      title: "JOIN → join",
      description: "Defina chave e tipo do join e valide a cardinalidade antes de confiar nas métricas.",
      sql: `SELECT p.*, c.estado
FROM pedidos p
LEFT JOIN clientes c
  ON p.id_cliente = c.id_cliente;`,
      pyspark: `resultado = pedidos.join(
    clientes.select("id_cliente", "estado"),
    on="id_cliente",
    how="left"
)`,
      note: "Quando a chave tem o mesmo nome nos dois DataFrames, usar on='id_cliente' evita duplicar essa coluna."
    },
    {
      id: "window",
      label: "Janela",
      title: "OVER → Window",
      description: "Calcule rankings e históricos dentro de grupos sem reduzir as linhas.",
      sql: `SELECT *,
  ROW_NUMBER() OVER (
    PARTITION BY id_cliente
    ORDER BY data_pedido DESC
  ) AS rn
FROM pedidos;`,
      pyspark: `janela = Window.partitionBy("id_cliente").orderBy(
    F.col("data_pedido").desc()
)

resultado = pedidos.withColumn(
    "rn",
    F.row_number().over(janela)
)`,
      note: "A Window specification separa o desenho da janela da função que será calculada sobre ela."
    },
    {
      id: "nulls",
      label: "Tratar nulos",
      title: "COALESCE → coalesce",
      description: "Substitua nulos com intenção e mantenha o significado de negócio.",
      sql: `SELECT
  id_produto,
  COALESCE(preco, 0) AS preco
FROM produtos;`,
      pyspark: `resultado = produtos.select(
    "id_produto",
    F.coalesce(F.col("preco"), F.lit(0)).alias("preco")
)`,
      note: "DataFrame.fillna também é útil quando você quer preencher várias colunas por nome."
    },
    {
      id: "date",
      label: "Datas",
      title: "DATE_TRUNC → date_trunc",
      description: "Transforme datas em períodos consistentes para análise.",
      sql: `SELECT
  DATE_TRUNC('month', data_pedido) AS mes,
  SUM(valor) AS faturamento
FROM vendas
GROUP BY 1;`,
      pyspark: `resultado = (
    vendas
    .withColumn("mes", F.date_trunc("month", "data_pedido"))
    .groupBy("mes")
    .agg(F.sum("valor").alias("faturamento"))
)`,
      note: "Garanta que data_pedido seja date ou timestamp antes de aplicar funções de data."
    }
  ];

  const glossary = [
    { term: "Action", category: "Execução", definition: "Operação que exige um resultado e dispara o processamento, como count, show, collect ou write." },
    { term: "Broadcast", category: "Performance", definition: "Envio de uma tabela pequena para cada executor, permitindo joins sem redistribuir a tabela grande." },
    { term: "Cache", category: "Performance", definition: "Persistência de um resultado intermediário para evitar recomputação quando ele será reutilizado." },
    { term: "Catalyst", category: "Spark SQL", definition: "Otimizador que analisa e transforma os planos lógicos de Spark SQL e DataFrames." },
    { term: "Cluster", category: "Arquitetura", definition: "Conjunto de recursos de computação usados para executar uma aplicação Spark." },
    { term: "DAG", category: "Execução", definition: "Grafo acíclico dirigido que representa as dependências entre as etapas de processamento." },
    { term: "DataFrame", category: "Fundamentos", definition: "Coleção distribuída, imutável e tipada de dados organizados em linhas e colunas." },
    { term: "Data skew", category: "Performance", definition: "Distribuição desigual na qual poucas chaves concentram muitas linhas e criam tasks lentas." },
    { term: "Delta Lake", category: "Databricks", definition: "Camada de armazenamento baseada em Parquet que acrescenta log transacional, ACID, versões e operações como MERGE." },
    { term: "Driver", category: "Arquitetura", definition: "Processo coordenador que interpreta o código, cria planos e agenda tarefas para os executors." },
    { term: "Executor", category: "Arquitetura", definition: "Processo trabalhador que executa tasks sobre partições e pode armazenar dados em memória ou disco." },
    { term: "Lazy evaluation", category: "Execução", definition: "Estratégia de adiar o processamento até uma action, permitindo otimizar o plano completo." },
    { term: "Parquet", category: "Armazenamento", definition: "Formato colunar, comprimido e tipado, eficiente para cargas analíticas." },
    { term: "Partition", category: "Arquitetura", definition: "Fração dos dados processada por uma task; base do paralelismo no Spark." },
    { term: "Predicate pushdown", category: "Performance", definition: "Otimização que aplica filtros já na fonte de dados para ler menos registros." },
    { term: "PySpark", category: "Fundamentos", definition: "API Python do Apache Spark, usada para descrever transformações e ações executadas pela engine." },
    { term: "Schema", category: "Fundamentos", definition: "Contrato que define nomes, tipos e possibilidade de nulos das colunas." },
    { term: "Shuffle", category: "Performance", definition: "Redistribuição de dados entre partições/executors, comum em joins, agregações e ordenações." },
    { term: "SparkSession", category: "Fundamentos", definition: "Porta de entrada para ler dados, criar DataFrames e executar Spark SQL; no Databricks costuma ser spark." },
    { term: "Task", category: "Execução", definition: "Menor unidade de trabalho enviada pelo driver a um executor, normalmente sobre uma partição." },
    { term: "Temp view", category: "Spark SQL", definition: "Nome temporário registrado para consultar um DataFrame com SQL durante a sessão." },
    { term: "Transformation", category: "Execução", definition: "Operação que descreve um novo DataFrame, como select, filter, join e withColumn." },
    { term: "Window function", category: "Spark SQL", definition: "Cálculo dentro de grupos lógicos que preserva as linhas, usado em ranking, lag e acumulados." }
  ];

  window.SPARK_MENTOR_DATA = {
    lessons,
    weekInfo,
    labOperations,
    glossary,
    routine: [
      { label: "Retomada", minutes: 5 },
      { label: "Microaula", minutes: 15 },
      { label: "SQL ↔ PySpark", minutes: 15 },
      { label: "Prática", minutes: 20 },
      { label: "Quiz e registro", minutes: 5 }
    ]
  };
})();
