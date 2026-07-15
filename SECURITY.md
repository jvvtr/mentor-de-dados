# Política de segurança

O Spark Mentor é um aplicativo estático e não possui backend, autenticação, banco de dados ou integração com APIs externas.

## Relatar uma vulnerabilidade

Se encontrar um problema de segurança, evite incluir tokens, dados pessoais ou informações sensíveis em uma issue pública. Use o recurso **Security → Report a vulnerability** do repositório no GitHub, quando disponível.

Para problemas que não envolvam dados sensíveis, como falhas de interface ou conteúdo, abra uma issue comum.

## Dados armazenados

Nome, progresso, respostas, rascunhos e anotações são armazenados apenas no `localStorage` do navegador. Limpar os dados do site ou usar **Meu progresso → Reiniciar progresso** remove essas informações.

## Escopo

Como o app não executa Spark nem recebe código em um servidor, exemplos PySpark copiados para ambientes externos ficam sujeitos às políticas de segurança desses ambientes, incluindo Databricks, clusters locais e armazenamento em nuvem.
