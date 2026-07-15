# Mentor de Dados — starter local para Windows

Este diretório contém um ambiente mínimo para executar os primeiros exemplos de PySpark e Spark SQL no próprio computador. Ele é complementar ao app: o **Databricks Free Edition continua sendo o ambiente recomendado** para seguir a trilha completa.

## Requisitos

- Windows 10 ou 11;
- Python 3.10 ou superior;
- Java 17 ou superior, disponível no `PATH` ou indicado por `JAVA_HOME`;
- conexão com a internet somente durante a instalação dos pacotes.

O arquivo `requirements.txt` fixa o PySpark 4.2.0. A instalação via `pip` já traz a distribuição necessária para o laboratório; não instale Hadoop ou `winutils.exe` de fontes não oficiais.

## Instalação no PowerShell

Entre neste diretório e confira as versões disponíveis:

```powershell
py --version
java -version
```

Crie um ambiente virtual e instale as dependências. Os comandos usam o executável do ambiente diretamente, portanto não exigem ativá-lo:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Verificação

```powershell
.\.venv\Scripts\python.exe verificar_ambiente.py
```

O verificador confirma Python, Java e PySpark e executa uma pequena consulta Spark SQL. Ao final, deve aparecer `Ambiente pronto para estudar`.

## Laboratório de vendas

```powershell
.\.venv\Scripts\python.exe laboratorio_vendas.py
```

O laboratório demonstra:

- criação de DataFrame com schema explícito;
- coluna calculada e filtro em PySpark;
- agregação equivalente em Spark SQL;
- observação de partições sem usar APIs de RDD;
- uso local de `cache()` e `unpersist()`.

## Se Java não for encontrado

Aponte temporariamente `JAVA_HOME` para sua instalação real e abra novamente o teste:

```powershell
$env:JAVA_HOME = "C:\caminho\para\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

Troque o caminho de exemplo pelo diretório existente no computador. Para tornar a configuração permanente, ajuste as variáveis de ambiente do Windows.

## Limites deste starter

- `local[2]` usa duas threads do computador; não representa um cluster distribuído real.
- A prática de cache da aula 13 é local. No Databricks Free Edition, essa aula deve ser estudada conceitualmente.
- Delta Lake não faz parte deste starter mínimo. A aula 18 deve ser executada no Databricks Free Edition, usando tabelas Delta gerenciadas.
- O ambiente não inclui Jupyter, pandas ou bibliotecas de machine learning.

## Referências oficiais

- [Apache Spark 4.2.0](https://spark.apache.org/docs/latest/)
- [Instalação oficial do PySpark](https://spark.apache.org/docs/latest/api/python/getting_started/install.html)
- [Quickstart de DataFrames e Spark SQL](https://spark.apache.org/docs/latest/api/python/getting_started/quickstart_df.html)
- [Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition)

Requisitos revisados em 15 de julho de 2026.
