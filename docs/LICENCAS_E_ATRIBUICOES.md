# Licenças e atribuições

Este documento resume as licenças dos componentes centrais e separa três assuntos diferentes: código do Mentor de Dados, software de terceiros e marcas/ativos visuais.

Ele é um registro técnico de atribuição, não aconselhamento jurídico. Ao redistribuir uma versão com dependências empacotadas, confira os arquivos de licença da versão efetivamente distribuída.

## Código e conteúdo próprios

O software e a documentação próprios deste repositório são disponibilizados sob a [licença MIT](../LICENSE), com o aviso de copyright ali indicado.

A licença permite uso, cópia, modificação, distribuição, sublicenciamento e venda, desde que o aviso de copyright e o texto da licença sejam mantidos nas cópias ou partes substanciais. O material é fornecido sem garantia.

Essa licença não concede direitos sobre marcas, logotipos ou conteúdo de terceiros.

## Componentes centrais

| Componente | Versão de referência | Licença | Origem |
| --- | ---: | --- | --- |
| Apache Spark / PySpark | 4.2.0 | Apache-2.0 | [apache/spark](https://github.com/apache/spark) |
| Pyodide | 314.0.2 | MPL-2.0 | [pyodide/pyodide](https://github.com/pyodide/pyodide) |
| SQLGlot | 30.8.0 | MIT | [tobymao/sqlglot](https://github.com/tobymao/sqlglot) |
| SQLFrame | 4.3.0 | MIT | [eakmanrq/sqlframe](https://github.com/eakmanrq/sqlframe) |
| DuckDB, pacote para Pyodide | 1.5.1 | MIT | [duckdb/duckdb](https://github.com/duckdb/duckdb) |

O Laboratório Semântico carrega Pyodide e instala wheels fixados de SQLGlot e SQLFrame. O pacote oficial `duckdb` disponível na distribuição Pyodide executa dentro do mesmo Web Worker; a arquitetura atual usa apenas esse motor analítico.

Dependências transitivas conservam suas próprias licenças. Se esses artefatos forem copiados para o repositório para uso offline, mantenha os avisos exigidos e gere um inventário a partir dos pacotes realmente empacotados.

## Materiais complementares citados

| Projeto ou material | Licença declarada | Uso neste projeto |
| --- | --- | --- |
| [The Internals of Spark SQL](https://github.com/japila-books/spark-sql-internals) | Apache-2.0 | Referência avançada externa. |
| [Delta Lake](https://github.com/delta-io/delta) | Apache-2.0 | Referência externa sobre formatos de tabela. |
| [Apache Arrow](https://github.com/apache/arrow) | Apache-2.0 | Referência externa sobre dados colunares e interoperabilidade. |
| [JupyterLite](https://github.com/jupyterlite/jupyterlite) | BSD-3-Clause | Alternativa externa para praticar Python no navegador; não é dependência. |

Links para documentação não incorporam automaticamente o conteúdo desses sites ao projeto. Trechos e exemplos eventualmente reutilizados devem respeitar a licença e a atribuição da fonte específica.

## Apache Spark e Apache Software Foundation

Apache Spark, Spark e o logotipo Apache Spark são marcas da Apache Software Foundation. O Mentor de Dados é independente e não é afiliado, patrocinado nem endossado pela Apache Software Foundation.

Os ativos em [`assets/`](../assets/) vieram do diretório oficial de imagens do projeto Apache Spark e são usados apenas para identificar a tecnologia estudada. Arquivo, origem e finalidade estão registrados em [`assets/ATTRIBUTION.md`](../assets/ATTRIBUTION.md).

Consulte:

- [diretrizes de marcas do Apache Spark](https://spark.apache.org/trademarks.html);
- [política de marcas da Apache Software Foundation](https://www.apache.org/foundation/marks/);
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

O logotipo Apache Spark não deve ser usado como identidade do Mentor de Dados nem de forma que sugira certificação, associação ou endosso. A identidade visual própria do app deve continuar distinta.

## Serviços e distribuição

O GitHub Pages e CDNs podem hospedar ou entregar arquivos, mas são serviços sujeitos a termos, políticas e limites próprios. Ser gratuito ou open source não garante disponibilidade permanente de um endpoint de terceiros.

Para uma implantação reproduzível:

- fixe versões, sem usar aliases como `latest`;
- registre a URL e o hash dos artefatos distribuídos;
- avalie hospedar os arquivos no mesmo domínio;
- mantenha textos de licença junto de cópias redistribuídas;
- teste novamente antes de atualizar qualquer dependência.

O Databricks Free Edition é apenas uma opção externa de execução. Ele não é componente open source do app e segue termos próprios.

## Projeto 100% feito com IA

O Mentor de Dados é um projeto educacional **100% desenvolvido com inteligência artificial**, sob necessidade, objetivos e restrições definidos por uma pessoa. Agentes de IA produziram o código próprio, a arquitetura, o design, o currículo, os textos, os exercícios, a documentação e os testes.

Essa declaração se aplica ao trabalho original do Mentor de Dados. Ela **não** afirma que Apache Spark, Pyodide, SQLGlot, SQLFrame, DuckDB, os materiais externos ou os logotipos oficiais foram criados por IA. Esses componentes pertencem a seus autores e titulares e são reconhecidos separadamente acima.

Conteúdo gerado por IA pode conter erros convincentes. Fontes oficiais, execução na versão indicada e revisão humana continuam necessárias. Consulte [AI_DISCLOSURE.md](../AI_DISCLOSURE.md) para a política completa de transparência.

## Checklist antes de uma release

- [ ] O arquivo `LICENSE` acompanha o código próprio.
- [ ] As versões documentadas correspondem aos artefatos realmente carregados.
- [ ] Licenças e avisos de dependências empacotadas foram preservados.
- [ ] Novos ativos têm origem, titular e uso registrados.
- [ ] Nenhum logotipo de terceiro é apresentado como identidade do app.
- [ ] A declaração de projeto feito com IA continua visível e precisa.
- [ ] Links e nomes de marcas foram revisados.
- [ ] O inventário foi atualizado após qualquer troca de runtime.

Inventário revisado em 15 de julho de 2026.
