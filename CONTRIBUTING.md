# Contribuindo com a AdSmart

Obrigado pelo interesse em contribuir. Este guia explica como preparar o ambiente e enviar mudanças.

## Formas de contribuir

- Reportar bugs e sugerir melhorias pelas [issues](https://github.com/ZenniTTy/adsmart-app/issues/new/choose)
- Melhorar a documentação
- Corrigir bugs ou implementar funcionalidades
- Traduzir guias

Antes de começar algo grande, abra uma issue para alinhar a proposta.

## Ambiente de desenvolvimento

Requisitos: [Bun](https://bun.sh) na versão de `.bun-version`, Node.js 22+ (versão de `.nvmrc`).

```bash
git clone https://github.com/ZenniTTy/adsmart-app.git
cd adsmart-app
bun install
bunx lefthook install
bun run check
```

O `bunx lefthook install` ativa os hooks de git uma vez por clone: antes de cada commit rodam Biome e verificação de tipos, e a mensagem do commit é conferida pelo commitlint.

| Comando | O que faz |
|---|---|
| `bun run lint` | Verifica formatação e lint com Biome |
| `bun run format` | Corrige formatação e organiza imports |
| `bun run typecheck` | Verifica tipos com TypeScript |
| `bun run test` | Roda os testes unitários com piso de cobertura |
| `bun run e2e` | Compila o servidor e roda os testes de ponta a ponta |
| `bun run check` | Roda todas as verificações acima |

## Testes e contas do Google Ads

- Os testes automatizados não acessam a Google Ads API real. Os testes de ponta a ponta usam um servidor HTTP falso.
- Para testes manuais, use uma [conta de teste do Google Ads](https://developers.google.com/google-ads/api/docs/best-practices/test-accounts), que não veicula anúncios.
- Nunca faça commit de arquivos de chave, tokens ou dados de contas reais.

## Fluxo de trabalho

1. Faça um fork e crie uma branch a partir de `develop`:
   `feat/nome-curto`, `fix/nome-curto` ou `docs/nome-curto`.
2. Faça commits pequenos seguindo o [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` documentação
   - `refactor:` mudança de código sem alterar comportamento
   - `test:` testes
   - `chore:` manutenção, dependências, configuração
   - `style:` formatação sem mudança de código
   - `ci:` integração contínua
3. Para funcionalidades novas, proponha na issue ou no PR critérios de aceite com ID (por exemplo `ALT-01`) e cite os IDs nos nomes dos testes.
4. Garanta que `bun run check` passa.
5. Abra um pull request para `develop` preenchendo o template. O merge é feito pelo mantenedor depois da revisão e do CI verde.

A branch `main` recebe apenas versões lançadas.

## Padrões de código

- TypeScript estrito, sem `any`. Entradas externas são validadas com zod.
- Código sem comentários: nomes claros de funções e variáveis explicam a intenção.
- Toda funcionalidade que altera contas deve passar pelo fluxo de prévia e aprovação.
- Campanhas, grupos e anúncios novos nascem pausados. Prefira pausar a remover; remoções são sinalizadas como irreversíveis.
- IDs de conta são enviados sem hifens.
- Testes nunca chamam a Google Ads API real: o HTTP é simulado na fronteira.
- Credenciais e tokens nunca podem aparecer em logs, mensagens de erro ou respostas ao Claude.
- O servidor nunca escreve no stdout, que é o canal do protocolo MCP.
- A rede só acessa `googleads.googleapis.com` e `oauth2.googleapis.com`.
- Textos para o usuário ficam em português do Brasil.

## Código de conduta

Ao participar, você concorda em seguir o [código de conduta](CODE_OF_CONDUCT.md).
