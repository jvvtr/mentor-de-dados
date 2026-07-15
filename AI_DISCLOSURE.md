# Transparência sobre o uso de inteligência artificial

O Mentor de Dados é um projeto educacional **100% desenvolvido com inteligência artificial**.

## O que isso significa

A necessidade, o público e o objetivo foram definidos por uma pessoa: criar uma ferramenta gratuita que ajude iniciantes a entender Apache Spark, PySpark e Spark SQL com uma rotina de uma hora por dia.

A partir dessa direção, agentes de IA produziram:

- a arquitetura e o código do aplicativo;
- o design, a identidade própria e os textos da interface;
- a estrutura da trilha de estudos;
- as explicações, analogias e exemplos;
- os exercícios, critérios de verificação, dicas, soluções e quizzes;
- o glossário e as respostas do tutor local;
- o kit de início para PySpark local;
- a documentação e os testes do projeto.

Os ativos oficiais do Apache Spark incluídos em `assets/` não foram gerados pela IA. Eles foram obtidos do site oficial e são atribuídos em [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md).

## Limites do conteúdo gerado

Sistemas de IA podem produzir conteúdo convincente e ainda assim cometer erros, omitir exceções ou simplificar demais um conceito. Por isso:

- trate o material como apoio introdutório, não como documentação oficial;
- execute os exemplos no Databricks Free Edition ou no PySpark local;
- confira a versão e as limitações do ambiente utilizado;
- consulte as fontes primárias em [REFERENCES.md](REFERENCES.md) antes de decisões de produção;
- reporte correções fundamentadas para que o material possa melhorar.

## O laboratório é um compilador semântico educacional

No subconjunto declarado pela trilha, o laboratório analisa a sintaxe de Spark SQL ou a árvore do código PySpark, valida operações permitidas, compila a intenção para SQL, executa dados pequenos no navegador e compara o resultado com os testes do exercício. Essa execução usa Pyodide, SQLGlot, SQLFrame e DuckDB dentro de um Web Worker; não é uma simples busca por padrões de texto.

O laboratório **não executa Apache Spark**: não inicia JVM, driver, executors ou cluster e não reproduz Catalyst, shuffle, Spark UI ou desempenho distribuído. Operações fora do subconjunto são recusadas ou apresentadas como simulações explícitas. Consulte a [arquitetura](docs/LABORATORIO_SEMANTICO.md) e a [matriz de compatibilidade](docs/COMPATIBILIDADE.md), e confirme comportamento de produção em um ambiente Spark real.

## Tutor local e privacidade

Apesar de o projeto ter sido criado com IA, o app publicado **não consulta um modelo de IA**. O tutor é offline e responde a partir de conteúdo previamente definido.

Nome, respostas, rascunhos, anotações e progresso ficam no `localStorage` do navegador. O código dos exercícios é processado localmente pelo Web Worker. O aplicativo não possui backend, cadastro ou telemetria e não envia esses dados ao GitHub, a agentes de IA ou a terceiros. Na primeira execução, o navegador pode baixar os componentes open source fixados; links externos, ao serem abertos, passam a seguir as políticas do site de destino.

## Responsabilidade do estudante

O projeto não substitui formação oficial, revisão de um especialista ou testes no ambiente de destino. Código copiado do app deve ser revisado antes de uso com dados reais, especialmente em cenários de segurança, privacidade, custo ou produção.

## Independência e marcas

Este projeto é independente e não possui afiliação, patrocínio ou endosso da Apache Software Foundation, Databricks ou Microsoft.

Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. Databricks e demais nomes e marcas pertencem aos seus respectivos titulares. Os nomes são usados apenas de forma educacional e descritiva para identificar as tecnologias abordadas.
