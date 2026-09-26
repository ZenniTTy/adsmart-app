# Contribuindo com o AdSmart

Obrigado pelo interesse em contribuir. Este guia explica como preparar o ambiente e enviar mudanças.

## Formas de contribuir

- Reportar bugs e sugerir melhorias pelas [issues](https://github.com/ZenniTTy/adsmart-app/issues/new/choose)
- Melhorar a documentação
- Corrigir bugs ou implementar funcionalidades
- Traduzir guias

Antes de começar algo grande, abra uma issue para alinhar a proposta.

## Ambiente de desenvolvimento

Requisitos: [Bun](https://bun.sh) 1.3+ e Node.js 20+.

```bash
git clone https://github.com/ZenniTTy/adsmart-app.git
cd adsmart-app
bun install
bun run check
```

| Comando | O que faz |
|---|---|
| `bun run lint` | Verifica formatação e lint com Biome |
| `bun run format` | Corrige formatação e organiza imports |
| `bun run typecheck` | Verifica tipos com TypeScript |
| `bun run test` | Roda os testes |
| `bun run check` | Roda todas as verificações acima |

## Testes e contas do Google Ads

- Os testes automatizados não acessam a Google Ads API real.
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
3. Garanta que `bun run check` passa.
4. Abra um pull request para `develop` preenchendo o template.

A branch `main` recebe apenas versões lançadas.

## Padrões de código

- TypeScript estrito, sem `any`.
- Código sem comentários: nomes claros de funções e variáveis explicam a intenção.
- Toda funcionalidade que altera contas deve passar pelo fluxo de prévia e aprovação.
- Credenciais e tokens nunca podem aparecer em logs, mensagens de erro ou respostas ao Claude.

## Código de conduta

Ao participar, você concorda em seguir o [código de conduta](CODE_OF_CONDUCT.md).
