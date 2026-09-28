# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Site em [adsmart.digital](https://adsmart.digital), com a apresentação da AdSmart, o download, a documentação e as novidades de cada versão. O site é estático e não coleta dados.
- Servidor MCP somente leitura com as ferramentas `diagnostico`, `listar_contas` e `consultar`, com suporte a conta de administrador (MCC).
- Mensagens de erro do Google Ads em português, com o passo de correção e o código da requisição.
- Alterações seguras com as ferramentas `preparar_alteracao`, `aplicar`, `desfazer` e `historico`: orçamento, status, lances, palavras-chave, negativas e textos de anúncios responsivos, com prévia validada pelo Google, confirmação no chat, aplicação tudo ou nada, histórico local e desfazer.
- Configuração assistida: a ferramenta `guia_configuracao` conduz o setup no chat, passo a passo, indicando o que é seu e o que o Claude faz, e oferece três caminhos: um texto pronto para o Claude Cowork (com aprovação automática do Cowork, navegador logado no Google e regras para proteger a chave), o Claude in Chrome no próprio chat ou o passo a passo manual. A extensão pode ser instalada antes de a chave existir.
- Pacote `.mcpb` para o Claude Desktop no macOS, gerado com `bun run pack`, e releases em rascunho com impressão digital SHA-256 e atestação de origem do GitHub.
- Guia de instalação: formas de instalar, aviso de extensão não verificada, conferência do arquivo e atualização manual.
- A prévia, o histórico e o desfazer mostram o nome da campanha e do grupo e o texto da palavra-chave, junto com o ID.

### Alterado

- Títulos das ferramentas em forma de ação (por exemplo, "Configurar a AdSmart" e "Verificar a conexão da AdSmart"), e a AdSmart passa a ser tratada no feminino em todos os textos.
- Guia de configuração: link oficial de ativação da API, pedido do nível Explorer, passkey criada antes de começar e bloqueio de chave em contas Workspace.
- Guia de configuração: como encontrar o ID da conta, nome do arquivo de chave baixado e aviso sobre a exigência de chave de acesso (passkey) para adicionar usuários.
- Solução de problemas: nova seção `CUSTOMER_NOT_FOUND` e bloqueio de chaves em organizações Workspace criadas a partir de maio de 2024.
- Release do GitHub: além do pacote com a versão no nome, publica `adsmart.mcpb` com o mesmo conteúdo, para o link estável do site e do terminal.
