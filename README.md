# Mentor de Dados — trilha para Apache Spark™

> Uma rotina prática e gratuita para quem já conhece SQL e quer começar em Apache Spark, PySpark e Spark SQL estudando uma hora por dia.

[![Projeto educacional](https://img.shields.io/badge/projeto-educacional-0c8f8b)](https://jvvtr.github.io/mentor-de-dados/)
![Feito com IA](https://img.shields.io/badge/desenvolvimento-100%25%20com%20IA-f1693c)
![Web sem build](https://img.shields.io/badge/web-sem%20build-12324d)
![Licença MIT](https://img.shields.io/badge/licença-MIT-23845b)

O **Mentor de Dados** é um aplicativo web independente que transforma o início dos estudos em uma trilha guiada de **20 aulas, quatro semanas e 60 minutos por dia**. O conteúdo parte de conceitos familiares a quem usa SQL, Power BI ou os primeiros recursos do Databricks e avança até DataFrames, Spark SQL, performance e um pipeline em camadas.

### [Abrir o app no GitHub Pages](https://jvvtr.github.io/mentor-de-dados/)

Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. Este projeto não é oficial, afiliado, patrocinado nem endossado pela Apache Software Foundation, Databricks ou Microsoft. “Mentor de Dados” é a identidade própria do aplicativo; as marcas de terceiros aparecem somente para identificar as tecnologias estudadas.

## Para quem é

O conteúdo foi pensado para quem:

- já escreve consultas SQL;
- conhece Power BI ou alguma ferramenta de análise;
- teve contato inicial com notebooks do Databricks;
- ainda não estudou processamento distribuído formalmente;
- quer praticar sem precisar conhecer Python avançado.

## Como a experiência funciona

Cada aula é apresentada como uma sessão guiada em cinco etapas:

| Etapa | Tempo | Atividade |
| --- | ---: | --- |
| Retomada | 5 min | Recordar o conteúdo anterior e conectar o tema ao que você já sabe. |
| Conceito | 15 min | Ler uma microaula com objetivo, analogia e conceitos centrais. |
| SQL ↔ PySpark | 15 min | Comparar a mesma intenção nas duas interfaces. |
| Prática | 20 min | Escrever, revisar e levar o código a um ambiente Spark real. |
| Quiz e registro | 5 min | Verificar a compreensão e registrar o progresso. |

A interface inclui cronômetro compacto, navegação por etapas, editor de rascunho com numeração de linhas, autosave, cópia e download do código, dicas progressivas, solução sugerida e quiz. O progresso, os rascunhos e o caderno de bordo ficam no `localStorage` do navegador.

As áreas do app são:

| Área | O que oferece |
| --- | --- |
| **Estudo de hoje** | Sessão de 60 minutos, exercício, quiz e cronômetro. |
| **Trilha de 4 semanas** | Visão das 20 aulas e do andamento de cada semana. |
| **SQL ↔ PySpark** | Referência copiável para traduzir operações conhecidas. |
| **Primeiros passos** | Escolha e configuração do Databricks Free Edition ou PySpark local. |
| **Tutor local** | Respostas offline e previamente definidas sobre os conceitos da trilha. |
| **Glossário** | Definições pesquisáveis de termos como driver, partition e shuffle. |
| **Meu progresso** | Tempo focado, aulas concluídas, acertos, sequência e anotações. |

## Onde os exercícios são executados

O editor do app é um **rascunho local**. A ação “Verificar estrutura” procura elementos esperados no texto, como chamadas de funções e nomes de operações. Ela ajuda a revisar uma tentativa, mas:

- não interpreta a sintaxe completa de Python ou SQL;
- não compila nem executa PySpark;
- não inicia uma JVM, uma `SparkSession` ou um cluster;
- não lê dados nem confirma o resultado da transformação.

Essa separação é intencional. Um executor Python leve no navegador não reproduziria com fidelidade o planejamento, a JVM e o runtime do Apache Spark. Para aprender com o comportamento real da tecnologia, copie ou baixe o rascunho e execute-o em um dos ambientes abaixo.

### Opção recomendada: Databricks Free Edition

O [Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition) funciona no navegador, não exige instalar Python ou Java e oferece notebooks adequados para DataFrames, Spark SQL e tabelas Delta gerenciadas.

É um ambiente gratuito para aprendizado e experimentação, mas é **serverless e sujeito a cotas**. Entre as limitações atuais do compute serverless:

- APIs RDD não são suportadas;
- `df.cache()`, `df.persist()` e APIs equivalentes de cache SQL não são suportadas;
- o acesso ao DBFS é limitado e fontes externas devem respeitar o Unity Catalog;
- a Spark UI clássica não está disponível.

A trilha evita RDDs nas práticas compatíveis com o Free Edition. A aula de cache deve ser estudada conceitualmente nesse ambiente ou executada no PySpark local. Consulte sempre as [limitações oficiais do compute serverless](https://docs.databricks.com/aws/en/compute/serverless/limitations).

> Use somente dados sintéticos, públicos ou não sensíveis em contas e ambientes de estudo.

### Opção open source: PySpark local no Windows

O projeto inclui um ambiente mínimo em [`starter/`](starter/) para executar PySpark e Spark SQL no próprio computador. A configuração de referência, revisada em **15 de julho de 2026**, é:

- PySpark 4.2.0, fixado em `starter/requirements.txt`;
- Python 3.10 ou superior;
- Java 17 ou superior, com JDK 17 recomendado para a trilha;
- Windows 10 ou 11.

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

O verificador cria uma sessão `local[2]` e executa uma pequena consulta Spark SQL. O laboratório demonstra DataFrame com schema explícito, filtro, coluna calculada, agregação, partições e cache local. Consulte as instruções e soluções de problemas em [`starter/README.md`](starter/README.md).

O modo `local[2]` usa duas threads da máquina e **não simula um cluster distribuído real**. Delta Lake e Jupyter também não fazem parte do kit mínimo.

## Conteúdo das quatro semanas

| Semana | Tema | Principais assuntos |
| --- | --- | --- |
| 1 | Fundamentos e DataFrames | Arquitetura, PySpark, seleção, filtros, tipos, nulos e lazy evaluation. |
| 2 | Spark SQL e análise | Leitura de arquivos, views, agregações, joins, datas e janelas. |
| 3 | Execução e performance | Partitions, shuffle, cache, broadcast e planos de execução. |
| 4 | Pipeline no Databricks | Qualidade, deduplicação, Delta e projeto Bronze/Silver/Gold. |

## Executar o site

### GitHub Pages

Acesse [jvvtr.github.io/mentor-de-dados](https://jvvtr.github.io/mentor-de-dados/). O progresso é salvo somente no navegador e no dispositivo utilizados.

### Diretamente do repositório

1. Baixe ou clone o repositório.
2. Abra a pasta do projeto.
3. Abra `index.html` em um navegador moderno.

### Servidor local

Para reproduzir o comportamento do GitHub Pages:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

O site não possui processo de build, backend, cadastro, telemetria ou dependência JavaScript externa. Internet é necessária apenas para abrir links externos; o conteúdo principal funciona localmente.

### Testes de integridade

Os testes não instalam dependências e verificam currículo, arquivos, compatibilidade das práticas e renderização de todas as áreas e etapas:

```bash
npm test
```

## Compatibilidade e privacidade

| Item | Escopo |
| --- | --- |
| Navegador | Versões modernas de Chrome, Edge, Firefox e Safari com JavaScript e `localStorage`. |
| Conteúdo Spark | Revisado para Apache Spark/PySpark 4.2.0; outros ambientes podem apresentar diferenças. |
| Databricks | Free Edition com compute serverless; recursos e cotas podem mudar. |
| PySpark local | Kit validado para Windows, Python 3.10+ e Java 17+. |
| Dados do estudante | Permanecem no `localStorage`; não são enviados ao GitHub, a um servidor ou a um modelo de IA. |

Limpar os dados do site no navegador também apaga o progresso e os rascunhos. Não use o app como armazenamento definitivo de anotações importantes.

## Tecnologias e estrutura

- HTML5 semântico;
- CSS responsivo, sem framework;
- JavaScript puro;
- `localStorage` para persistência;
- GitHub Pages para hospedagem estática;
- PySpark somente no kit opcional de execução local.

```text
.
├── index.html            # estrutura do aplicativo
├── styles.css            # interface e responsividade
├── app.js                # navegação, estado, editor e interações
├── curriculum.js         # 20 aulas, quizzes e referências rápidas
├── package.json          # comando de teste, sem dependências
├── assets/               # ativos visuais e atribuições
├── starter/              # verificador e laboratório PySpark local
└── tests/                # smoke test de conteúdo e renderização
```

## Projeto 100% feito com IA

Este projeto educacional foi **100% desenvolvido com inteligência artificial** a partir da necessidade e dos objetivos definidos por uma pessoa. Agentes de IA produziram o código, o design, a estrutura pedagógica, os textos, os exercícios, os quizzes, a documentação e os testes.

Isso não significa que o conteúdo seja infalível. Sistemas de IA podem gerar imprecisões ou simplificações. Use o app como apoio introdutório, execute os exemplos e confira decisões técnicas na documentação oficial. Leia a declaração completa em [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Marcas, imagens e independência

Os ativos oficiais do Apache Spark são exibidos sem alteração apenas para referência visual à tecnologia estudada. Eles não constituem a identidade do aplicativo e não indicam endosso. A origem e as condições de uso estão documentadas em [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md).

Consulte também as [diretrizes de marcas do Apache Spark](https://spark.apache.org/trademarks.html). Databricks, Power BI e demais nomes e marcas pertencem aos seus respectivos titulares.

## Fontes, contribuições e licença

As fontes primárias usadas para revisão estão em [REFERENCES.md](REFERENCES.md). Correções fundamentadas, melhorias pedagógicas e ajustes de acessibilidade são bem-vindos; consulte [CONTRIBUTING.md](CONTRIBUTING.md).

O código do projeto é distribuído sob a [licença MIT](LICENSE). Essa licença não concede direitos sobre marcas, logotipos ou ativos de terceiros.

---

Feito para reduzir a distância entre **“eu sei SQL”** e **“agora entendo como o Apache Spark processa dados”**.
