# Política de segurança

O Mentor de Dados é um aplicativo estático e não possui backend, autenticação, banco de dados remoto ou telemetria. O Laboratório Semântico baixa componentes open source com versões fixadas quando necessário e os executa localmente em um Web Worker.

## Relatar uma vulnerabilidade

Se encontrar um problema de segurança, evite incluir tokens, dados pessoais ou informações sensíveis em uma issue pública. Use o recurso **Security → Report a vulnerability** do repositório no GitHub, quando disponível.

Para problemas que não envolvam dados sensíveis, como falhas de interface ou conteúdo, abra uma issue comum.

## Dados armazenados

Nome, progresso, respostas, rascunhos e anotações são armazenados apenas no `localStorage` do navegador. Limpar os dados do site ou usar **Meu progresso → Reiniciar progresso** remove essas informações.

O código digitado no laboratório é enviado apenas ao Worker da própria página. A política de execução permite um subconjunto restrito de PySpark educacional, bloqueia APIs de sistema, rede, arquivos e introspecção e aplica limites de tamanho e tempo. Mesmo assim, não use dados pessoais, segredos ou código confidencial em ambientes de estudo.

O DuckDB nasce com acesso externo, extensões automáticas e extensões comunitárias desativados, limite de memória de 256 MB e uma thread. A configuração é travada antes das fixtures e do código do estudante. Funções SQL de tabela e de leitura externa também são recusadas durante a análise, oferecendo duas camadas independentes de proteção.

## Escopo

O app não executa Apache Spark nem recebe código em um servidor. O resultado local vem de uma tradução educacional executada pelo DuckDB e não deve ser tratado como uma garantia de segurança, desempenho ou compatibilidade de produção. Exemplos copiados para ambientes externos ficam sujeitos às políticas desses ambientes, incluindo Databricks, clusters locais e armazenamento em nuvem.
