# Mentor de Dados — SQL para Apache Spark™

> Uma rotina prática e gratuita para quem já domina o básico ou o intermediário de SQL, nunca estudou Spark ou Python e quer aprender Apache Spark, PySpark e Spark SQL em uma hora por dia.

[![Projeto educacional](https://img.shields.io/badge/projeto-educacional-0c8f8b)](https://jvvtr.github.io/mentor-de-dados/)
![Feito com IA](https://img.shields.io/badge/desenvolvimento-100%25%20com%20IA-f1693c)
![Laboratório local](https://img.shields.io/badge/laboratório-semântico-12324d)
![Licença MIT](https://img.shields.io/badge/licença-MIT-23845b)

O **Mentor de Dados** é um aplicativo web independente com **20 aulas, quatro semanas e sessões de 60 minutos**. A trilha usa SQL como ponto de partida e constrói, passo a passo, o vocabulário necessário para compreender DataFrames, PySpark, Spark SQL, execução distribuída e pipelines de dados.

### [Abrir o app no GitHub Pages](https://jvvtr.github.io/mentor-de-dados/)

Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. Este projeto não é oficial, afiliado, patrocinado nem endossado pela Apache Software Foundation ou pela Databricks. “Mentor de Dados” é a identidade própria do aplicativo; marcas de terceiros aparecem somente para identificar as tecnologias estudadas.

## Para quem é

O ponto de partida esperado é simples:

- você entende `SELECT`, `WHERE`, `GROUP BY` e `JOIN`;
- talvez já use CTEs, funções de janela e tratamento de `NULL`;
- você **não precisa conhecer Python**;
- você **não precisa saber o que são Spark, cluster, driver, executor ou partition**;
- você quer relacionar operações SQL conhecidas à API DataFrame do PySpark;
- você aceita praticar primeiro com dados pequenos e depois confirmar o comportamento no Spark real.

Python é introduzido somente no necessário para ler e escrever transformações PySpark. O objetivo não é ensinar programação Python de propósito geral antes de começar Spark.

## Como a experiência funciona

Cada aula segue seis etapas:

| Etapa | Tempo | Atividade |
| --- | ---: | --- |
| Retomada SQL | 5 min | Recuperar o conteúdo anterior e ativar um conceito SQL conhecido. |
| Conceito Spark | 10 min | Aprender uma ideia de Spark com linguagem introdutória e analogias. |
| Solução SQL | 10 min | Resolver primeiro com a linguagem que o estudante já conhece. |
| Tradução PySpark | 15 min | Relacionar a solução SQL à API DataFrame, incluindo o Python mínimo necessário. |
| Prática avaliada | 15 min | Escrever código, executar no laboratório compatível e interpretar o resultado. |
| Quiz e registro | 5 min | Verificar a compreensão e registrar dúvidas e progresso. |

A interface inclui cronômetro, navegação por etapas, editor com numeração de linhas, autosave, dicas progressivas, solução sugerida, quiz, glossário, tutor local e caderno de bordo. Progresso, rascunhos e anotações permanecem no `localStorage` do navegador.

## Laboratório Semântico

O laboratório vai além de procurar palavras no texto. Para o subconjunto declarado de Spark SQL e PySpark, ele:

1. analisa a sintaxe;
2. reconhece o dialeto Spark SQL ou uma seleção segura da API DataFrame;
3. verifica tabelas, colunas, tipos e operações suportadas;
4. traduz o plano para SQL executável no navegador;
5. processa os dados de exemplo localmente;
6. mostra o resultado ou um erro explicativo;
7. compara a saída com testes do exercício.

A arquitetura combina tecnologias gratuitas e open source:

- **Pyodide**, que executa Python em WebAssembly;
- **SQLGlot 30.8**, que analisa e transpila o dialeto Spark SQL;
- **SQLFrame 4.3**, que converte um subconjunto da API PySpark DataFrame em SQL;
- **DuckDB 1.5.1 para Pyodide**, compilado para WebAssembly, que executa o plano analítico sobre os dados pequenos do exercício.

O runtime é carregado somente quando necessário. Dependendo do cache do navegador, a primeira inicialização pode ser mais demorada que as seguintes.

Os quatro componentes rodam dentro de um único Web Worker Pyodide, carregado sob demanda para manter a interface responsiva. Leia a explicação técnica em [docs/LABORATORIO_SEMANTICO.md](docs/LABORATORIO_SEMANTICO.md) e consulte a [matriz de compatibilidade](docs/COMPATIBILIDADE.md).

### O laboratório não é Apache Spark

O navegador não inicia uma JVM, um driver Spark, executores ou um cluster. DuckDB dentro do Pyodide executa as transformações sobre dados pequenos em uma única máquina; ele não reproduz shuffle, particionamento físico, Catalyst, Adaptive Query Execution, Spark UI, tolerância a falhas ou desempenho distribuído.

Por isso, o app usa quatro classificações:

| Classificação | Significado |
| --- | --- |
| **Executado no laboratório** | A sintaxe suportada foi analisada e o resultado foi calculado localmente. |
| **Compatível com ressalvas** | A intenção é equivalente para o exercício, mas podem existir diferenças de dialeto, tipos ou `NULL`. |
| **Simulado com aviso** | A chamada é reconhecida, mas seu efeito de I/O, partição, cache ou plano Spark não é reproduzido. |
| **Exige Spark real** | O conceito depende do runtime Spark e deve ser testado localmente ou em uma plataforma Spark. |

Uma resposta aprovada pelo laboratório ainda deve ser confirmada no ambiente de destino antes de uso profissional. A documentação nunca chama esse runtime de “Spark no navegador”.

## Onde executar Spark real

### Opção sem instalação: Databricks Free Edition

O [Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition) oferece notebooks no navegador para aprendizado. É gratuito, serverless, sujeito a cotas e possui [limitações específicas](https://docs.databricks.com/aws/en/compute/serverless/limitations), incluindo restrições a RDD, cache e Spark UI clássica.

Use apenas dados sintéticos, públicos ou não sensíveis em ambientes de estudo.

### Opção gratuita e open source: PySpark local

O repositório inclui [`starter/`](starter/) com um verificador de ambiente e um laboratório introdutório. A configuração de referência é:

- Apache Spark/PySpark 4.2.0;
- Python 3.10 ou superior;
- JDK 17 ou superior, com JDK 17 recomendado;
- Windows 10 ou 11 no guia principal.

Comandos rápidos no PowerShell:

```powershell
cd starter
py --version
java -version
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe verificar_ambiente.py
.\.venv\Scripts\python.exe laboratorio_vendas.py
```

O verificador cria uma sessão `local[2]` e executa Spark SQL de verdade. O modo local usa duas threads da máquina, mas não representa um cluster distribuído. Veja o passo a passo completo, verificações e soluções de problemas em [docs/INSTALACAO_LOCAL.md](docs/INSTALACAO_LOCAL.md) e [`starter/README.md`](starter/README.md).

## Conteúdo das quatro semanas

| Semana | Tema | Principais assuntos |
| --- | --- | --- |
| 1 | De SQL para Spark | `SparkSession`, DataFrames, Python mínimo, seleção, filtros, schemas, tipos e `NULL`. |
| 2 | Transformações corretas | Leitura de dados, funções nativas, agregações, joins, datas, janelas e resultados verificáveis. |
| 3 | Como o Spark executa | Lazy evaluation, jobs, stages, partitions, shuffle, estratégias de join e planos físicos. |
| 4 | Código confiável e projeto | Contratos de qualidade, testes de DataFrame, saídas idempotentes e um pipeline completo; Delta Lake aparece apenas como próximo passo opcional. |

A trilha prioriza o que muda quando uma consulta SQL passa a ser executada por um mecanismo distribuído. Termos de Python são apresentados no momento em que aparecem no PySpark.

## Fontes de estudo

Afirmações sobre o Apache Spark devem ser verificadas primeiro na documentação da versão estudada. O projeto também indica complementos gratuitos e open source para aprofundamento, sem tratá-los como substitutos da fonte oficial.

- [Documentação do Apache Spark 4.2.0](https://spark.apache.org/docs/4.2.0/)
- [Guia inicial do PySpark](https://spark.apache.org/docs/4.2.0/api/python/getting_started/index.html)
- [Spark SQL Reference](https://spark.apache.org/docs/4.2.0/sql-ref.html)
- [Repositório oficial do Apache Spark](https://github.com/apache/spark)
- [The Internals of Spark SQL](https://books.japila.pl/spark-sql-internals/), complemento open source Apache-2.0
- [SQLGlot](https://github.com/tobymao/sqlglot), [SQLFrame](https://github.com/eakmanrq/sqlframe), [DuckDB](https://github.com/duckdb/duckdb) e [Pyodide](https://github.com/pyodide/pyodide), usados pelo laboratório

A curadoria completa e a ordem sugerida estão em [docs/FONTES_E_ESTUDOS.md](docs/FONTES_E_ESTUDOS.md). As referências primárias históricas do projeto permanecem em [REFERENCES.md](REFERENCES.md).

## Executar o site

### GitHub Pages

Acesse [jvvtr.github.io/mentor-de-dados](https://jvvtr.github.io/mentor-de-dados/). O progresso é salvo somente no navegador e no dispositivo utilizados.

### Diretamente do repositório

1. Baixe ou clone o repositório.
2. Abra a pasta do projeto.
3. Para consultar o conteúdo estático, abra `index.html` em um navegador moderno.

Recursos WebAssembly e Workers funcionam de maneira mais consistente por HTTP. Para usar o Laboratório Semântico, prefira o servidor local abaixo.

### Servidor local

Na raiz do repositório:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

O app publicado é estático: não possui backend, cadastro ou telemetria. O conteúdo principal funciona sem conta. A primeira carga de componentes do laboratório pode exigir internet quando os artefatos ainda não estiverem no cache.

### Testes de integridade

O comando padrão verifica o currículo, os contratos do laboratório, os arquivos, as áreas principais e o cliente do Web Worker:

```bash
npm test
```

Para validar também a política AST, o isolamento do DuckDB, o motor Python e as 38 soluções oficiais SQL/PySpark com as dependências nativas de desenvolvimento:

```bash
python -m pip install -r runtime/requirements-dev.txt
npm run test:python
```

Não há etapa de build obrigatória para servir a versão atual do site.

## Compatibilidade e privacidade

| Item | Escopo |
| --- | --- |
| Navegador | Versões modernas de Chrome, Edge, Firefox e Safari com JavaScript, WebAssembly, Web Workers e `localStorage`. |
| Conteúdo Spark | Baseado no Apache Spark/PySpark 4.2.0; ambientes de outras versões podem apresentar diferenças. |
| Laboratório | Subconjunto educacional de Spark SQL e PySpark executado em um Worker Pyodide por SQLGlot, SQLFrame e DuckDB. |
| PySpark local | Kit para Windows, Python 3.10+ e Java 17+. |
| Dados do estudante | Rascunhos e progresso ficam no navegador; o app não os envia a um backend ou modelo de IA. |

Limpar os dados do site no navegador também apaga progresso, preferências e rascunhos. Não use o app como armazenamento definitivo de anotações importantes.

## Tecnologias e estrutura

- HTML5 e CSS responsivo;
- JavaScript para a interface existente;
- Python no navegador por meio do Pyodide;
- SQLGlot e SQLFrame para análise e compilação do subconjunto;
- DuckDB 1.5.1 compilado para WebAssembly dentro do Pyodide para execução local;
- Web Workers para não bloquear a interface;
- `localStorage` para persistência;
- GitHub Pages para hospedagem estática;
- PySpark 4.2.0 no kit opcional de execução real.

```text
.
├── index.html                 # estrutura do aplicativo
├── styles.css                 # interface e responsividade
├── app.js                     # navegação, estado e interações
├── curriculum.js              # aulas, quizzes e referências rápidas
├── runtime/                   # componentes do Laboratório Semântico
├── docs/                      # arquitetura, compatibilidade e guias
├── assets/                    # ativos visuais e atribuições
├── starter/                   # verificador e laboratório PySpark real
├── tests/                     # testes automatizados
└── package.json               # comando de teste
```

## Documentação complementar

- [Laboratório Semântico](docs/LABORATORIO_SEMANTICO.md)
- [Matriz de compatibilidade](docs/COMPATIBILIDADE.md)
- [Instalação local gratuita](docs/INSTALACAO_LOCAL.md)
- [Fontes e plano de aprofundamento](docs/FONTES_E_ESTUDOS.md)
- [Licenças e atribuições](docs/LICENCAS_E_ATRIBUICOES.md)

## Projeto 100% feito com IA

Este projeto educacional foi **100% desenvolvido com inteligência artificial**, a partir da necessidade, das restrições e dos objetivos definidos por uma pessoa. Agentes de IA produziram a arquitetura, o código, o design, a estrutura pedagógica, os textos, os exercícios, os quizzes, a documentação e os testes.

Isso não torna o material infalível. Conteúdo gerado por IA pode conter simplificações, omissões ou erros. Execute os exemplos, confira a versão utilizada e trate a documentação oficial como autoridade. Leia [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

Os logotipos oficiais incluídos em `assets/` não foram gerados por IA. Suas origens estão registradas em [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md).

## Licença, marcas e contribuições

O código próprio é distribuído sob a [licença MIT](LICENSE). Dependências mantêm suas próprias licenças; consulte [docs/LICENCAS_E_ATRIBUICOES.md](docs/LICENCAS_E_ATRIBUICOES.md).

Os ativos oficiais do Apache Spark são exibidos sem alteração apenas como referência à tecnologia. Consulte as [diretrizes de marcas do Apache Spark](https://spark.apache.org/trademarks.html). A licença MIT do projeto não concede direitos sobre nomes, marcas ou logotipos de terceiros.

Correções fundamentadas, melhorias pedagógicas e ajustes de acessibilidade são bem-vindos. Veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

Feito para reduzir a distância entre **“eu sei SQL”** e **“agora entendo como o Apache Spark processa dados”**.
