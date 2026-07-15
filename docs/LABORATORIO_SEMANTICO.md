# Laboratório Semântico

O Laboratório Semântico funciona como um **compilador semântico educacional**: ele analisa e executa, no navegador, o subconjunto de Spark SQL e PySpark usado nos exercícios do Mentor de Dados. Ele foi criado para oferecer retorno imediato sem exigir uma instalação logo na primeira aula.

> O laboratório **não executa Apache Spark**. Ele valida a intenção do código e calcula exemplos pequenos com tecnologias compatíveis. Conceitos que dependem do runtime distribuído devem ser confirmados em um ambiente Spark real.

## O que ele entrega

Ao selecionar **Analisar e executar**, o laboratório tenta produzir quatro tipos de retorno:

1. diagnóstico de sintaxe, com linha e coluna quando disponíveis;
2. diagnóstico semântico, como tabela ou coluna desconhecida e operação fora do escopo;
3. SQL DuckDB gerado a partir da expressão Spark SQL ou da cadeia PySpark;
4. resultado calculado sobre os dados de exemplo, quando a operação é executável no navegador.

Uma validação somente estrutural pode continuar disponível como contingência quando o runtime pesado não inicializa. Esse retorno é identificado como verificação parcial e nunca deve ser confundido com uma execução aprovada.

## Arquitetura

```text
Código do estudante
        |
        +-- Spark SQL --> SQLGlot (dialeto Spark)
        |                     |
        |                     +--> AST, nomes e operações permitidas
        |
        +-- PySpark ----> AST do Python + SQLFrame Standalone
                              |
                              +--> cadeia DataFrame e plano SQL
        |
        +--> SQL DuckDB gerado --> DuckDB no Pyodide --> dados e testes do exercício
        |
        +--> diagnóstico em português + classificação de compatibilidade
```

Todo o runtime pesado ocorre em um único **Web Worker**, separado da interface. O worker é carregado sob demanda e aceita operações de inicialização, análise/execução e reinicialização. Dentro dele, o Pyodide hospeda SQLGlot, SQLFrame e o pacote Python oficial `duckdb`, compilado para WebAssembly; o worker devolve à interface o plano gerado, os diagnósticos e o resultado.

### Componentes fixados

| Componente | Versão de referência | Papel | Licença |
| --- | --- | --- | --- |
| [Pyodide](https://pyodide.org/en/stable/) | 314.0.2 | CPython em WebAssembly e instalação dos pacotes Python puros. | MPL-2.0 |
| [SQLGlot](https://sqlglot.com/sqlglot.html) | 30.8.0 | Parser, AST e tradução de Spark SQL para DuckDB. | MIT |
| [SQLFrame](https://sqlframe.readthedocs.io/en/stable/standalone/) | 4.3.0 | Conversão do subconjunto da API DataFrame PySpark em SQL. | MIT |
| [`duckdb` para Pyodide](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) | 1.5.1 | DuckDB compilado para WebAssembly, executado no mesmo worker sobre dados pequenos. | MIT |

O SQLGlot está fixado em `30.8.0`, embora existam versões posteriores, porque o SQLFrame 4.3.0 declara compatibilidade com `sqlglot >=28,<30.9`. Atualizações devem ocorrer em conjunto e passar pelos testes do currículo.

## Fluxo de Spark SQL

Para uma resposta em Spark SQL, o laboratório:

1. faz o parse com o dialeto de origem `spark`;
2. inspeciona a árvore sintática em vez de procurar palavras isoladas;
3. rejeita comandos ou recursos fora da lista permitida;
4. resolve tabelas e colunas contra o schema do exercício;
5. transpila para o dialeto `duckdb` com erros para construções não suportadas;
6. executa o SQL gerado no DuckDB hospedado pelo Pyodide;
7. compara nomes e ordem das colunas, linhas da fixture e ordenação quando ela faz parte do contrato.

Exemplo conceitual:

```sql
-- Entrada Spark SQL
SELECT cliente_id, SUM(valor) AS receita
FROM vendas
WHERE status = 'aprovada'
GROUP BY cliente_id
```

O laboratório não considera a consulta correta apenas por conter `SELECT`, `SUM` e `GROUP BY`. Ele analisa como esses elementos se relacionam e, quando possível, testa o resultado.

### O que a nota automática cobre

A aprovação automática usa uma fixture pequena e determinística por aula. Ela verifica se o código suportado executa, se as colunas esperadas aparecem e se as linhas — com ordenação quando declarada — correspondem ao contrato. O schema inferido é exibido para inspeção, mas tipos e nulabilidade podem divergir entre DuckDB e Spark e não entram sozinhos na nota.

Casos de borda e verificações de plano aparecem na interface como uma lista de revisão manual. Eles não são apresentados como testes automáticos: devem ser confirmados no PySpark local ou em outra execução Apache Spark real. Uma solução aprovada continua sendo evidência de aprendizagem sobre a fixture, não uma prova de equivalência completa nem proteção contra uma resposta hardcoded.

## Fluxo de PySpark

Para uma resposta em PySpark, o laboratório:

1. analisa o texto com o parser `ast` do Python;
2. reconhece somente os imports, nomes, chamadas e encadeamentos declarados na matriz de compatibilidade;
3. bloqueia execução arbitrária de Python, acesso a arquivos, rede e APIs do navegador;
4. representa as tabelas do exercício no modo Standalone do SQLFrame, com schemas explícitos;
5. compila a cadeia DataFrame para SQL DuckDB;
6. executa o SQL no DuckDB hospedado pelo Pyodide e aplica os testes do exercício.

Exemplo conceitual:

```python
from pyspark.sql import functions as F

resultado = (
    vendas
    .filter(F.col("status") == "aprovada")
    .groupBy("cliente_id")
    .agg(F.sum("valor").alias("receita"))
)
```

O navegador não importa a distribuição `pyspark`, não cria uma `SparkSession` real e não executa Python de propósito geral. O SQLFrame reproduz uma parte da interface DataFrame para gerar SQL; isso é útil para aprendizagem, mas não é equivalência total com PySpark.

Algumas chamadas são aceitas apenas para produzir um aviso didático. Readers `csv`/`parquet` usam fixtures virtuais; writers com `saveAsTable` não gravam arquivos nem catálogos; `cache`, `persist`, `repartition`, `broadcast` e `explain` não reproduzem seus efeitos Spark. A interface deve identificar esses casos como **simulados**, nunca como execução real.

## Segurança e privacidade

Os exercícios e resultados são processados no dispositivo. O projeto não possui backend próprio e não envia o código a um modelo de IA. Dependências podem ser baixadas de um CDN na primeira carga; depois disso, o comportamento depende do cache do navegador.

As seguintes regras orientam o runtime:

- aceitar apenas o subconjunto de AST necessário aos exercícios;
- não usar `exec` irrestrito sobre o texto do estudante;
- não autorizar leitura de arquivos locais ou requisições arbitrárias;
- limitar o tamanho dos dados e da saída;
- executar a análise Python fora da thread da interface;
- cancelar ou reinicializar o worker após falha ou tempo excessivo;
- iniciar o DuckDB com acesso externo e extensões automáticas desativados, limite de 256 MB e uma thread;
- travar a configuração antes de registrar fixtures ou executar código do estudante;
- tratar todo código e todo dado inserido pelo estudante como entrada não confiável.

A configuração aplicada ao DuckDB 1.5.1 é:

```sql
SET enable_external_access = false;
SET allow_community_extensions = false;
SET autoinstall_known_extensions = false;
SET autoload_known_extensions = false;
SET memory_limit = '256MB';
SET threads = 1;
SET lock_configuration = true;
```

O runtime falha de forma fechada se essa configuração não puder ser aplicada. O suporte exato deve ser revalidado ao atualizar o pacote DuckDB para Pyodide. Consulte o [guia oficial de segurança do DuckDB](https://duckdb.org/docs/current/operations_manual/securing_duckdb/overview).

## Desempenho e funcionamento offline

Pyodide, DuckDB e os pacotes Python tornam a primeira carga significativamente maior que a página principal. Por isso, o laboratório:

- inicializa somente quando solicitado;
- mostra estado de carregamento e não bloqueia a navegação;
- reutiliza o worker depois da primeira inicialização;
- permite reiniciar o ambiente sem recarregar toda a página;
- executa um único worker e não pressupõe suporte a múltiplas threads WebAssembly;
- mantém dados de exercícios pequenos e determinísticos.

O site pode abrir sem o runtime já baixado, mas a primeira inicialização completa requer internet quando os artefatos não estão no cache. Uma implantação totalmente offline deve hospedar o Pyodide, os wheels fixados e os bundles WebAssembly no mesmo servidor. O [guia de implantação do Pyodide](https://pyodide.org/en/stable/usage/downloading-and-deploying.html) explica as opções de distribuição própria.

## Diferenças em relação ao Spark real

| Laboratório no navegador | Apache Spark real |
| --- | --- |
| DuckDB no Pyodide executa dados pequenos em uma única máquina. | Driver e executores processam partições localmente ou em cluster. |
| SQLGlot e SQLFrame traduzem um subconjunto declarado. | Spark SQL e PySpark oferecem a API completa da versão instalada. |
| Não existe JVM, `SparkContext` ou `SparkSession` real. | A JVM e o runtime Spark constroem e executam o plano. |
| Não há shuffle distribuído, jobs, stages nem tolerância a falhas. | O scheduler coordena jobs, stages, tasks, shuffle e recuperação. |
| Não há Catalyst, AQE ou Spark UI reais. | O otimizador e a interface de execução refletem o plano Spark. |
| O resultado é uma aproximação controlada para exercícios. | O resultado e o desempenho correspondem ao ambiente de destino. |

Mesmo quando duas consultas retornam as mesmas linhas, elas podem divergir em coerções de tipo, ordenação de `NULL`, timezone, expressões regulares, precisão decimal, funções aproximadas e comportamento ANSI. Sem `ORDER BY`, a ordem das linhas não é uma garantia em nenhum dos ambientes.

## Quando usar Spark real

Use o kit em [`starter/`](../starter/) ou uma plataforma Spark sempre que a aula envolver:

- partições, jobs, stages, tasks ou shuffle;
- cache, persistência e armazenamento;
- planos físicos e otimização Catalyst;
- Adaptive Query Execution;
- Structured Streaming;
- UDFs, RDDs, MLlib ou GraphX;
- integração real com Delta Lake, catálogos ou formatos externos;
- medições de desempenho, memória ou escalabilidade.

Consulte a [matriz de compatibilidade](COMPATIBILIDADE.md) antes de interpretar um resultado e a [instalação local](INSTALACAO_LOCAL.md) para executar PySpark real gratuitamente.

## Referências técnicas

- [SQLGlot: parser e transpiler](https://github.com/tobymao/sqlglot)
- [SQLFrame Standalone](https://sqlframe.readthedocs.io/en/stable/standalone/)
- [DuckDB no ecossistema WebAssembly](https://duckdb.org/docs/current/clients/wasm/overview.html)
- [Pyodide: limitações de Python em WebAssembly](https://pyodide.org/en/stable/usage/wasm-constraints.html)
- [Apache Spark Connect 4.2.0](https://spark.apache.org/docs/4.2.0/spark-connect-overview.html), uma arquitetura diferente que requer um servidor Spark real
