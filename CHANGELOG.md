# Changelog

Mudanças da AdSmart que afetam quem usa a extensão. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

## [0.1.1] - 2026-09-30

### Adicionado

- Suporte ao Claude Desktop no Windows: o mesmo pacote `.mcpb` instala no macOS e no Windows.

### Corrigido

- A consulta de palavras-chave negativas de campanha ignora as que já foram removidas.

## [0.1.0] - 2026-09-29

### Adicionado

- Consultas somente leitura com as ferramentas `diagnostico`, `listar_contas` e `consultar`, com suporte a conta de administrador (MCC).
- Alterações seguras com `preparar_alteracao`, `aplicar`, `desfazer` e `historico`: orçamento, status, lances, palavras-chave, negativas e textos de anúncios responsivos. Toda alteração tem prévia validada pelo Google, confirmação no chat, aplicação tudo ou nada, histórico local e desfazer.
- A prévia, o histórico e o desfazer mostram o nome da campanha e do grupo e o texto da palavra-chave, junto com o ID.
- Configuração assistida: a ferramenta `guia_configuracao` conduz o passo a passo no chat e oferece três caminhos (Claude Cowork, Claude in Chrome ou manual). A extensão pode ser instalada antes de a chave existir.
- Mensagens de erro do Google Ads em português, com o passo de correção e o código da requisição.
- Pacote `.mcpb` para o Claude Desktop no macOS, publicado com impressão digital SHA-256 e atestação de origem do GitHub.
- Site e documentação em [adsmart.digital](https://adsmart.digital). A extensão continua 100% local; o site usa o Google Tag Manager só para métricas de visita.

[0.1.1]: https://github.com/ZenniTTy/adsmart-app/releases/tag/v0.1.1
[0.1.0]: https://github.com/ZenniTTy/adsmart-app/releases/tag/v0.1.0
