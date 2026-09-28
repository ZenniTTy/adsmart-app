# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Servidor MCP somente leitura com as ferramentas `diagnostico`, `listar_contas` e `consultar`, com suporte a conta de administrador (MCC).
- Mensagens de erro do Google Ads em português, com o passo de correção e o código da requisição.
- Alterações seguras com as ferramentas `preparar_alteracao`, `aplicar`, `desfazer` e `historico`: orçamento, status, lances, palavras-chave, negativas e textos de anúncios responsivos, com prévia validada pelo Google, confirmação no chat, aplicação tudo ou nada, histórico local e desfazer.
- Pacote `.mcpb` para o Claude Desktop no macOS, gerado com `bun run pack`, e releases em rascunho com impressão digital SHA-256 e atestação de origem do GitHub.
- Guia de instalação: formas de instalar, aviso de extensão não verificada, conferência do arquivo e atualização manual.
- A prévia, o histórico e o desfazer mostram o nome da campanha e do grupo e o texto da palavra-chave, junto com o ID.

### Alterado

- Guia de configuração: como encontrar o ID da conta, nome do arquivo de chave baixado e aviso sobre a exigência de chave de acesso (passkey) para adicionar usuários.
- Solução de problemas: nova seção `CUSTOMER_NOT_FOUND` e bloqueio de chaves em organizações Workspace criadas a partir de maio de 2024.
