# AdSmart

**Gerencie suas campanhas do Google Ads conversando com o Claude.**

[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml)

[English](README.en.md) · Português

> [!NOTE]
> Projeto em desenvolvimento ativo. A primeira versão pública ainda não foi lançada. Acompanhe os [releases](https://github.com/ZenniTTy/adsmart-app/releases).

O AdSmart é uma extensão open-source para o **Claude Desktop** que conecta o Claude às suas contas do Google Ads. Você pergunta, analisa e altera campanhas em linguagem natural, direto no chat:

- *"Como foram minhas campanhas nos últimos 7 dias?"*
- *"Quais termos de pesquisa estão gastando sem converter?"*
- *"Pausa a campanha Black Friday e sobe o orçamento da Institucional para R$ 80/dia."*
- *"Desfaz a última alteração."*

## Por que usar

- **100% local.** Roda no seu computador. Suas credenciais nunca saem da sua máquina e nada passa por servidores de terceiros.
- **Sem custo.** A Google Ads API é gratuita e o AdSmart é open-source. Você usa a sua própria conta do Claude.
- **Seguro por padrão.** Toda alteração é validada pelo Google e mostrada para você antes de ser aplicada. Nada muda sem a sua aprovação, e tudo pode ser desfeito.
- **Todas as suas contas.** Conecte uma conta de administrador (MCC) e gerencie todas as contas vinculadas.

## Como funciona

1. Você pede algo no chat do Claude Desktop.
2. O Claude consulta seus dados pela Google Ads API.
3. Para alterações, o AdSmart gera uma prévia com o antes e depois.
4. Você aprova, a alteração é aplicada e fica registrada no seu computador.

## Requisitos

- [Claude Desktop](https://claude.ai/download) (macOS ou Windows)
- Uma conta Google com acesso de **administrador** à conta do Google Ads (ou à MCC)
- Um projeto no Google Cloud (gratuito, sem cartão de crédito)

## Instalação

1. Baixe o arquivo `adsmart.mcpb` do [último release](https://github.com/ZenniTTy/adsmart-app/releases/latest).
2. No Claude Desktop, abra **Configurações > Extensões** e arraste o arquivo para a janela.
3. Siga o [guia de configuração](docs/configuracao.md) para conectar sua conta do Google Ads.

O guia pode ser executado pelo próprio Claude: ele abre as páginas certas, faz os passos por você e avisa quando precisar da sua ação (como digitar sua senha).

## Documentação

| Guia | Conteúdo |
|---|---|
| [Configuração](docs/configuracao.md) | Conectar sua conta do Google Ads passo a passo |
| [Uso](docs/uso.md) | O que pedir ao Claude e como as alterações funcionam |
| [Limites](docs/limites.md) | O que a API permite e cotas diárias |
| [Solução de problemas](docs/solucao-de-problemas.md) | Erros comuns e como resolver |

## Segurança

O AdSmart lida com credenciais que podem alterar gastos com anúncios. Leia a [política de segurança](SECURITY.md) para entender como seus dados são protegidos e como reportar vulnerabilidades.

## Contribuindo

Contribuições são bem-vindas. Veja o [guia de contribuição](CONTRIBUTING.md) e o [código de conduta](CODE_OF_CONDUCT.md).

## Licença

[MIT](LICENSE) © Eduardo Rodrigues

---

*O AdSmart é um projeto independente e não é afiliado, patrocinado ou endossado pelo Google LLC ou pela Anthropic. Google Ads é marca registrada do Google LLC. Claude é marca registrada da Anthropic.*
