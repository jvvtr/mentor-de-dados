# Spark Mentor

> Uma trilha prática e gratuita para quem está começando a estudar Apache Spark, PySpark e Spark SQL.

![Projeto educacional](https://img.shields.io/badge/projeto-educacional-0c8f8b)
![Feito com IA](https://img.shields.io/badge/desenvolvimento-100%25%20com%20IA-f1693c)
![Sem dependências](https://img.shields.io/badge/dependências-nenhuma-12324d)
![Licença MIT](https://img.shields.io/badge/licença-MIT-23845b)

O **Spark Mentor** é um aplicativo web local de estudos criado para aproximar o Apache Spark de pessoas que já conhecem SQL, Power BI ou os primeiros recursos do Databricks, mas ainda não entendem processamento distribuído.

O projeto transforma esse começo em uma rotina clara: **20 aulas, quatro semanas e uma hora de estudo por dia**, sempre conectando conceitos novos ao repertório que o estudante já possui.

## Acesse o app

### [Abrir o Spark Mentor no navegador](https://jvvtr.github.io/spark-mentor/)

A versão online é publicada diretamente pelo GitHub Pages. O progresso continua sendo salvo somente no navegador utilizado.

## Objetivo

Ao final da trilha, o estudante deverá conseguir:

- explicar o que são Spark, driver, executors, partitions e shuffle;
- criar e transformar DataFrames com PySpark;
- alternar entre Spark SQL e a DataFrame API;
- ler CSV e Parquet e gravar dados em Parquet ou Delta;
- reconhecer problemas comuns de joins, cache e performance;
- montar um pipeline simples em camadas Bronze, Silver e Gold no Databricks.

## Para quem é

O conteúdo foi pensado especialmente para quem:

- já escreve consultas SQL;
- conhece Power BI ou ferramentas de análise;
- teve algum contato inicial com notebooks do Databricks;
- nunca estudou Spark formalmente;
- prefere aprender com exemplos pequenos e prática progressiva.

Não é necessário conhecer Python avançado. A trilha apresenta apenas o necessário para começar a trabalhar com DataFrames PySpark.

## Como funciona

O app organiza o estudo em seis áreas:

| Área | O que oferece |
| --- | --- |
| **Estudo de hoje** | Microaula, comparação de código, exercício, quiz e cronômetro. |
| **Trilha de 4 semanas** | Visão das 20 aulas e do progresso em cada semana. |
| **SQL ↔ PySpark** | Referência rápida para traduzir operações SQL para a DataFrame API. |
| **Tutor Spark** | Assistente conceitual local e offline para os principais termos da trilha. |
| **Glossário** | Definições pesquisáveis de conceitos como driver, partition e shuffle. |
| **Meu progresso** | Tempo focado, aulas concluídas, acertos, sequência e caderno de bordo. |

O progresso é salvo com `localStorage` no próprio navegador. Não existe cadastro, backend, telemetria ou envio de dados.

### Rotina diária de 60 minutos

| Bloco | Duração | Atividade |
| --- | ---: | --- |
| Retomada | 5 min | Recordar o conteúdo anterior e ativar o conhecimento existente. |
| Microaula | 15 min | Aprender um conceito com linguagem direta e analogias. |
| SQL ↔ PySpark | 15 min | Comparar a mesma lógica nas duas sintaxes. |
| Prática | 20 min | Resolver o exercício em um notebook ou no rascunho do app. |
| Quiz e registro | 5 min | Verificar a compreensão e anotar dúvidas. |

### Conteúdo das quatro semanas

| Semana | Tema | Principais assuntos |
| --- | --- | --- |
| 1 | Fundamentos e DataFrames | Arquitetura, PySpark, seleção, filtros, tipos, nulos e lazy evaluation. |
| 2 | Spark SQL e análise | Leitura de arquivos, views, agregações, joins, datas e janelas. |
| 3 | Execução e performance | Partitions, shuffle, cache, broadcast e planos de execução. |
| 4 | Pipeline no Databricks | Qualidade, deduplicação, Delta e projeto Bronze/Silver/Gold. |

## Como usar

### Opção 1 — usar online

Acesse [jvvtr.github.io/spark-mentor](https://jvvtr.github.io/spark-mentor/) e comece pela primeira aula.

### Opção 2 — abrir diretamente

1. Baixe ou clone este repositório.
2. Abra a pasta do projeto.
3. Dê dois cliques em `index.html`.

O Spark Mentor funciona sem instalação e sem internet. Para manter seu progresso, abra sempre o mesmo arquivo no mesmo navegador.

### Opção 3 — servidor local

Se preferir servir o projeto localmente:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

### Prática no Databricks

O Spark Mentor **não executa um cluster Spark**. Copie os exemplos e exercícios para um notebook do Databricks, execute-os e volte ao app para responder ao quiz e registrar o aprendizado.

Uma boa rotina é:

1. executar o exemplo original;
2. alterar uma condição ou coluna;
3. tentar o exercício sem abrir a solução;
4. comparar o resultado com a resposta sugerida;
5. usar `explain()` para começar a observar o plano.

## Tecnologias

- HTML5 semântico;
- CSS responsivo;
- JavaScript puro;
- `localStorage` para persistência;
- nenhuma biblioteca, framework, API ou processo de build.

A ausência de dependências permite abrir o app diretamente e mantê-lo simples para estudo, contribuição e publicação no GitHub Pages.

## Transparência: projeto 100% feito com IA

Este é um projeto educacional **100% desenvolvido com inteligência artificial**. O código, o design da interface, a estrutura pedagógica, as aulas, os exercícios, os quizzes, a documentação e os testes foram produzidos por agentes de IA a partir de uma solicitação e de objetivos definidos por uma pessoa.

Essa informação é apresentada de forma explícita porque transparência importa. Conteúdo gerado por IA pode conter imprecisões; por isso, o Spark Mentor deve ser usado como material de apoio e não como documentação oficial ou única fonte de estudo.

Leia a declaração completa em [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Fontes e revisão do conteúdo

Os principais conceitos devem ser conferidos nas fontes oficiais listadas em [REFERENCES.md](REFERENCES.md). Como o conteúdo inicial foi gerado por IA e ainda não passou por revisão formal de um especialista independente, correções fundamentadas são especialmente bem-vindas.

## Limitações e aviso educacional

- O tutor do app é local e baseado em respostas previamente definidas; ele não interpreta qualquer pergunta como um modelo conectado a uma IA.
- O app não executa PySpark nem cria um cluster local.
- O conteúdo é introdutório e pode simplificar detalhes de arquitetura.
- Apache Spark, PySpark, Databricks e Power BI pertencem aos seus respectivos titulares.
- O projeto é independente e não possui afiliação oficial com Apache Software Foundation, Databricks ou Microsoft.

Para decisões técnicas e ambientes de produção, confirme os detalhes na documentação oficial das tecnologias utilizadas.

## Contribuições

Correções de conteúdo, exemplos melhores, sugestões pedagógicas e melhorias de acessibilidade são bem-vindas. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir uma issue ou pull request.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).

---

Feito para reduzir a distância entre **“eu sei SQL”** e **“agora entendo como o Spark pensa”**.
