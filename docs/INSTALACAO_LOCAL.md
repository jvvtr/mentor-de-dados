# Instalação local gratuita do PySpark

Este guia cria um ambiente pequeno, gratuito e reproduzível para executar **Apache Spark real em modo local**. Ele é indicado quando o Laboratório Semântico marcar um exercício como “Exige Spark real” ou quando você quiser confirmar que uma transformação também funciona no runtime oficial.

O caminho principal foi preparado para Windows 10 ou 11 com PowerShell. No final há comandos equivalentes para Linux e macOS.

## O que será instalado

| Componente | Versão de referência | Para que serve |
| --- | --- | --- |
| Python | 3.10 ou superior | Executa a API PySpark. |
| JDK | 17 ou superior | Executa a JVM usada pelo Spark; JDK 17 é a recomendação deste projeto. |
| PySpark | 4.2.0 | Distribuição Python oficial do Apache Spark. |
| Ambiente virtual | módulo `venv` do Python | Isola os pacotes deste projeto. |

O [guia oficial de instalação do PySpark 4.2.0](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html) é a autoridade para requisitos da versão. Este repositório fixa `pyspark==4.2.0` em [`starter/requirements.txt`](../starter/requirements.txt).

## 1. Instale o Python

Baixe o instalador em [python.org](https://www.python.org/downloads/windows/). Durante a instalação, habilite a opção que adiciona o Python ao `PATH`, quando oferecida.

Abra um **novo** PowerShell e confira:

```powershell
py --version
py -0p
```

O primeiro comando deve mostrar Python 3.10 ou superior. O segundo lista as instalações encontradas pelo launcher do Windows.

## 2. Instale o JDK 17

Uma distribuição gratuita do OpenJDK é o [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17). Escolha o JDK, não apenas um JRE, e o instalador correspondente à arquitetura do computador.

Abra outro PowerShell e confira:

```powershell
java -version
where.exe java
```

O comando deve encontrar Java 17 ou superior. Se o instalador oferecer opções para configurar `JAVA_HOME` e adicionar Java ao `PATH`, habilite-as.

## 3. Prepare o starter

No PowerShell, entre na pasta `starter` deste repositório:

```powershell
cd starter
```

Crie um ambiente virtual. Os comandos abaixo chamam o Python do ambiente diretamente, por isso a ativação é opcional:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

O download do PySpark é grande e a instalação pode levar alguns minutos. Não interrompa o comando enquanto houver atividade.

Não instale Hadoop ou `winutils.exe` de sites desconhecidos. O starter não precisa desses downloads paralelos para os exemplos incluídos.

## 4. Verifique o ambiente

Execute:

```powershell
.\.venv\Scripts\python.exe verificar_ambiente.py
```

O script:

1. confere a versão do Python;
2. localiza o comando `java`;
3. importa PySpark;
4. cria uma `SparkSession` com master `local[2]`;
5. cria um DataFrame pequeno;
6. executa uma consulta Spark SQL;
7. encerra a sessão.

Ao final, a saída esperada inclui:

```text
Spark SQL: OK (total = 350.0)
Ambiente pronto para estudar.
```

Mensagens de log da JVM antes dessas linhas são normais. O processo deve terminar com código zero.

## 5. Execute o primeiro laboratório

```powershell
.\.venv\Scripts\python.exe laboratorio_vendas.py
```

O exemplo demonstra DataFrame com schema explícito, coluna calculada, filtro, agregação equivalente em Spark SQL, número de partições, `cache()` e `unpersist()`.

Leia o código em [`starter/laboratorio_vendas.py`](../starter/laboratorio_vendas.py), altere um filtro e execute novamente. O ciclo “ler, prever, executar e explicar” é mais útil que apenas copiar a saída.

## 6. Trabalhe em um terminal ativado, se preferir

A ativação encurta os comandos durante uma sessão:

```powershell
.\.venv\Scripts\Activate.ps1
python verificar_ambiente.py
python laboratorio_vendas.py
```

Para sair:

```powershell
deactivate
```

Se a política do PowerShell bloquear o script de ativação, continue usando `.\.venv\Scripts\python.exe`; não é necessário mudar a política do sistema para estudar.

## Configurar `JAVA_HOME` manualmente

Se `java -version` falhar, localize a pasta real do JDK e teste a configuração somente na janela atual:

```powershell
$env:JAVA_HOME = "C:\caminho\real\para\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

Troque o exemplo por uma pasta existente, como a pasta mostrada pelo instalador. `JAVA_HOME` deve apontar para a raiz do JDK, que contém o diretório `bin`, e não diretamente para `java.exe`.

Depois que funcionar, você pode tornar as variáveis permanentes nas configurações de **Variáveis de Ambiente** do Windows e abrir um terminal novo.

## Diagnóstico rápido

### `py` não foi encontrado

- Reabra o terminal após instalar o Python.
- Confirme a instalação com `where.exe py`.
- Reexecute o instalador oficial e habilite o launcher para todos os usuários, quando apropriado.

### `java` não foi encontrado

- Execute `where.exe java`.
- Confirme que instalou o JDK, não apenas baixou um arquivo compactado.
- Configure `JAVA_HOME` e acrescente `%JAVA_HOME%\bin` ao `PATH`.
- Feche e reabra PowerShell e editor depois de mudar variáveis.

### PySpark não foi encontrado

Use exatamente o mesmo interpretador empregado para executar o script:

```powershell
.\.venv\Scripts\python.exe -m pip show pyspark
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Evite `pip` sem `python -m`, pois ele pode apontar para outra instalação.

### A versão instalada não é 4.2.0

```powershell
.\.venv\Scripts\python.exe -c "import pyspark; print(pyspark.__version__)"
```

O resultado esperado para este repositório é `4.2.0`. Reinstale a partir de `requirements.txt` se necessário.

### O Spark inicia lentamente

A primeira criação da JVM e da `SparkSession` é mais lenta que uma consulta no Laboratório Semântico. Isso é esperado. Antivírus, pouco espaço em disco e máquinas com pouca memória também podem aumentar o tempo.

### A porta 4040 está ocupada

Enquanto uma aplicação Spark está ativa, a Spark UI costuma usar `http://localhost:4040`; outra sessão pode usar 4041 ou a porta seguinte. Encerre sessões que não estiver usando com `spark.stop()`.

### O erro continua

Registre, sem informações sensíveis:

```powershell
py --version
java -version
where.exe java
$env:JAVA_HOME
.\.venv\Scripts\python.exe -m pip show pyspark
```

Inclua também a mensagem completa e informe em qual comando ela ocorreu.

## Linux e macOS

Instale Python 3.10+ e OpenJDK 17 pelo gerenciador oficial do sistema ou pela distribuição [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=17). Depois, na pasta `starter`:

```bash
python3 --version
java -version
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python verificar_ambiente.py
.venv/bin/python laboratorio_vendas.py
```

O starter é testado prioritariamente no Windows; caminhos e configuração do JDK variam entre distribuições Linux e versões do macOS.

## Limites do modo local

`local[2]` é Apache Spark real usando duas threads, mas não é um cluster com várias máquinas. Ele permite estudar APIs, lazy evaluation, planos, ações e a Spark UI local. Não reproduz falhas de executor, tráfego de rede, armazenamento distribuído, autenticação ou escalabilidade de produção.

Este starter também não inclui Jupyter, pandas, MLlib ou Delta Lake. Mantenha o primeiro ambiente pequeno; adicione ferramentas somente quando uma aula realmente precisar delas.

## Alternativa sem instalação

O [Databricks Free Edition](https://docs.databricks.com/aws/en/getting-started/free-edition) disponibiliza notebooks Spark no navegador. É um serviço gratuito, não uma dependência open source deste projeto, possui cotas e [limitações serverless](https://docs.databricks.com/aws/en/compute/serverless/limitations). Não envie dados confidenciais para um ambiente de estudo.

## Referências oficiais

- [Apache Spark 4.2.0](https://spark.apache.org/docs/4.2.0/)
- [Instalação do PySpark 4.2.0](https://spark.apache.org/docs/4.2.0/api/python/getting_started/install.html)
- [Quickstart de DataFrames](https://spark.apache.org/docs/4.2.0/api/python/getting_started/quickstart_df.html)
- [Ambientes virtuais do Python](https://docs.python.org/3/library/venv.html)
- [Downloads oficiais do Python para Windows](https://www.python.org/downloads/windows/)

Requisitos revisados em 15 de julho de 2026.

