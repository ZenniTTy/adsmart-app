# AdSmart: gerencie o Google Ads pelo chat do Claude

**Extensão open-source para o Claude Desktop que conecta o Claude às suas contas do Google Ads.** Consulte métricas, analise campanhas e faça alterações com prévia, aprovação e desfazer, tudo em português e rodando no seu computador.

[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml)

[English](README.en.md) · Português

> [!NOTE]
> Projeto em desenvolvimento ativo. A primeira versão pública (v0.1.0) ainda não foi lançada. Acompanhe os [releases](https://github.com/ZenniTTy/adsmart-app/releases).

## O que é o AdSmart

O AdSmart é um servidor [MCP (Model Context Protocol)](https://modelcontextprotocol.io) empacotado como extensão do Claude Desktop (`.mcpb`). Ele dá ao Claude acesso seguro à **Google Ads API** usando a sua própria conta de serviço do Google Cloud, para que você gerencie campanhas de Google Ads conversando em linguagem natural:

- *"Como foram minhas campanhas nos últimos 7 dias?"*
- *"Quais termos de pesquisa gastaram mais de R$ 50 sem converter este mês?"*
- *"Quanto de parcela de impressões estou perdendo por orçamento?"*
- *"Pausa a campanha Black Friday e sobe o orçamento da Institucional para R$ 80/dia."*
- *"Adiciona 'grátis' e 'curso online' como palavras-chave negativas na campanha Pesquisa."*
- *"Desfaz a última alteração."*

É uma alternativa local e gratuita a ferramentas de automação de Google Ads na nuvem: não há servidor intermediário, assinatura nem coleta de dados.

## Por que usar

- **100% local.** Roda no seu computador. A chave da conta de serviço nunca sai da sua máquina e nada passa por servidores de terceiros. A extensão só fala com `googleads.googleapis.com` e `oauth2.googleapis.com`.
- **Sem custo.** A Google Ads API é gratuita no nível Explorer, o AdSmart é open-source (MIT) e você usa a sua própria conta do Claude.
- **Seguro por padrão.** Toda alteração é validada pelo Google e mostrada com o antes e depois. Nada muda sem a sua confirmação no chat, e tudo fica registrado e pode ser desfeito (exceto remoções, que são sempre sinalizadas como irreversíveis).
- **Todas as suas contas.** Funciona com contas individuais e com contas de administrador (MCC), incluindo as contas vinculadas a elas.
- **Em português.** Respostas, prévias e mensagens de erro do Google Ads traduzidas, com o passo de correção.

## Funcionalidades

### Consultas e relatórios (somente leitura)

| Ferramenta | O que faz |
|---|---|
| `diagnostico` | Confere configuração, arquivo de chave, autenticação, contas acessíveis e MCC, dizendo o que corrigir |
| `listar_contas` | Lista as contas do Google Ads que a conta de serviço acessa, inclusive via MCC |
| `consultar` | Executa consultas GAQL (Google Ads Query Language) somente leitura: métricas, termos de pesquisa, anúncios reprovados, histórico de mudanças e mais |

### Alterações seguras

| Ferramenta | O que faz |
|---|---|
| `preparar_alteracao` | Monta a prévia: lê os valores atuais, valida com o Google (`validateOnly`) e mostra o antes e depois, com avisos de fase de aprendizado e mudanças recentes |
| `aplicar` | Aplica a prévia confirmada de uma vez só (tudo ou nada) e registra no histórico local |
| `desfazer` | Prepara a reversão de uma alteração, que também passa por prévia e confirmação |
| `historico` | Mostra as alterações feitas pelo AdSmart neste computador |

Tipos de alteração suportados: orçamento diário, status de campanhas, grupos, anúncios e palavras-chave (ativar ou pausar), lances de grupos e de palavras-chave, adicionar ou remover palavras-chave, palavras-chave negativas de campanha e de grupo, e textos de anúncios responsivos de pesquisa (RSA). Até 100 itens por lote, na mesma conta.

## Como funciona

1. Você pede algo no chat do Claude Desktop.
2. O Claude consulta seus dados pela Google Ads API (REST) usando a sua conta de serviço.
3. Para alterações, o AdSmart gera uma prévia validada pelo Google, com o antes e depois e destaques como aumentos acima de 50% e remoções.
4. Você confirma no chat. O AdSmart confere se nada mudou na conta desde a prévia, aplica e registra no seu computador.

A prévia vale por 15 minutos. Se alguém alterar o item nesse meio tempo, inclusive pela interface do Google Ads, o AdSmart não aplica e pede uma nova prévia.

## Requisitos

- [Claude Desktop](https://claude.ai/download) no macOS. O suporte a Windows virá numa versão futura. O AdSmart não funciona no claude.ai pelo navegador nem nos apps de celular, porque roda no seu computador.
- Uma conta Google com acesso de **administrador** à conta do Google Ads (ou à MCC).
- Um projeto no Google Cloud com a Google Ads API ativada no nível Explorer (gratuito, sem cartão de crédito).

## Instalação

Quando a primeira versão for lançada:

1. Baixe o arquivo `adsmart-<versão>.mcpb` do [último release](https://github.com/ZenniTTy/adsmart-app/releases/latest).
2. Dê dois cliques no arquivo ou arraste-o para a janela do Claude Desktop. O Claude Desktop avisa que a extensão não foi verificada pela Anthropic: é esperado, veja o [guia de instalação](docs/instalacao.md).
3. Peça no chat: **"Me ajude a configurar o AdSmart"**. O Claude conduz o [guia de configuração](docs/configuracao.md) com você, passo a passo, e para sempre que a ação for sua. Em planos pagos, ele também pode entregar um texto pronto para o Claude Cowork fazer o trabalho no navegador.

A extensão não se atualiza sozinha: para uma versão nova, baixe e instale o arquivo do release mais recente.

## Documentação

| Guia | Conteúdo |
|---|---|
| [Instalação](docs/instalacao.md) | Baixar, conferir e instalar a extensão, o aviso de extensão não verificada e como atualizar |
| [Configuração](docs/configuracao.md) | Criar o projeto no Google Cloud, a conta de serviço e conectar o Google Ads passo a passo |
| [Uso](docs/uso.md) | O que pedir ao Claude, como funcionam prévia, confirmação, desfazer e histórico |
| [Limites](docs/limites.md) | Cotas diárias da API, recursos indisponíveis e permissões |
| [Solução de problemas](docs/solucao-de-problemas.md) | Erros comuns do Google Ads e como resolver |

## Perguntas frequentes

**Preciso de developer token do Google Ads?**
Não. O acesso é liberado pelo nível de acesso do seu projeto no Google Cloud (Explorer). O [guia de configuração](docs/configuracao.md) mostra como solicitar.

**O Claude pode alterar minha conta sem eu saber?**
Não. Nenhuma ferramenta altera a conta em uma única etapa: sempre há prévia e sua confirmação no chat. Se você escolher "Sempre permitir" para a ferramenta `aplicar` no Claude Desktop, a janela extra de permissão deixa de aparecer, mas a confirmação no chat continua obrigatória.

**Meus dados vão para algum servidor?**
Não. O AdSmart roda localmente e fala apenas com a Google Ads API. O histórico de alterações fica em um arquivo no seu computador.

**Funciona com MCC (conta de administrador)?**
Sim. Conecte a conta de serviço à MCC e o AdSmart acessa todas as contas vinculadas.

**Quanto da cota diária eu uso?**
Cada consulta conta como 1 operação e cada item alterado como 1 operação. O nível Explorer permite 2.880 operações por dia. Veja [Limites](docs/limites.md).

## Segurança

O AdSmart lida com credenciais que podem alterar gastos com anúncios. Leia a [política de segurança](SECURITY.md) para entender como seus dados são protegidos e como reportar vulnerabilidades de forma privada.

## Contribuindo

Contribuições são bem-vindas, inclusive com agentes de IA: as instruções para agentes estão em [AGENTS.md](AGENTS.md). Veja o [guia de contribuição](CONTRIBUTING.md) e o [código de conduta](CODE_OF_CONDUCT.md).

## Licença

[MIT](LICENSE) © Eduardo Rodrigues

---

*O AdSmart é um projeto independente e não é afiliado, patrocinado ou endossado pelo Google LLC ou pela Anthropic. Google Ads é marca registrada do Google LLC. Claude é marca registrada da Anthropic.*
