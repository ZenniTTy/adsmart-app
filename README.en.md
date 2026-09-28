# AdSmart: manage Google Ads by chatting with Claude

**Open-source Claude Desktop extension that connects Claude to your Google Ads accounts.** Query metrics, analyze campaigns and make changes with preview, approval and undo, all running on your own computer.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml)

English · [Português](README.md)

> [!NOTE]
> Under active development. The first public version (v0.1.0) has not been released yet. Follow the [releases](https://github.com/ZenniTTy/adsmart-app/releases).

## What is AdSmart

AdSmart is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server packaged as a Claude Desktop extension (`.mcpb`). It gives Claude safe access to the **Google Ads API** through your own Google Cloud service account, so you can manage Google Ads campaigns in plain language:

- *"How did my campaigns perform over the last 7 days?"*
- *"Which search terms spent more than $50 without converting this month?"*
- *"How much impression share am I losing to budget?"*
- *"Pause the Black Friday campaign and raise the Brand budget to $80/day."*
- *"Add 'free' and 'online course' as negative keywords to the Search campaign."*
- *"Undo the last change."*

It is a local, free alternative to cloud-based Google Ads automation tools: no middleman server, no subscription, no data collection. The extension's replies and messages are in Brazilian Portuguese.

## Why AdSmart

- **Fully local.** Runs on your computer. The service account key never leaves your machine and nothing goes through third-party servers. The extension only talks to `googleads.googleapis.com` and `oauth2.googleapis.com`.
- **Free.** The Google Ads API is free at the Explorer access level, AdSmart is open-source (MIT) and you use your own Claude account.
- **Safe by default.** Every change is validated by Google and shown with before and after values. Nothing changes without your confirmation in the chat, and everything is logged and can be undone (except removals, which are always flagged as irreversible).
- **All your accounts.** Works with individual accounts and manager accounts (MCC), including their linked accounts.

## Features

### Queries and reports (read-only)

| Tool | What it does |
|---|---|
| `guia_configuracao` | Walks you through setup from scratch, step by step, saying what is yours to do and what Claude does; offers a ready-made prompt for Claude Cowork |
| `diagnostico` | Checks configuration, key file, authentication, reachable accounts and MCC, and says what to fix |
| `listar_contas` | Lists the Google Ads accounts the service account can reach, including through an MCC |
| `consultar` | Runs read-only GAQL (Google Ads Query Language) queries: metrics, search terms, disapproved ads, change history and more |

### Safe changes

| Tool | What it does |
|---|---|
| `preparar_alteracao` | Builds the preview: reads current values, validates with Google (`validateOnly`) and shows before and after, with learning-phase and recent-change warnings |
| `aplicar` | Applies the confirmed preview atomically (all or nothing) and records it in the local history |
| `desfazer` | Prepares the reversal of a change, which also goes through preview and confirmation |
| `historico` | Shows the changes AdSmart made on this computer |

Supported changes: daily budget, status of campaigns, ad groups, ads and keywords (enable or pause), ad group and keyword bids, adding or removing keywords, campaign and ad group negative keywords, and responsive search ad (RSA) text. Up to 100 items per batch, in one account.

## How it works

1. You ask something in the Claude Desktop chat.
2. Claude reads your data through the Google Ads REST API using your service account.
3. For changes, AdSmart builds a preview validated by Google, with before and after values and highlights such as increases above 50% and removals.
4. You confirm in the chat. AdSmart checks that nothing changed in the account since the preview, applies the change and records it on your computer.

A preview is valid for 15 minutes. If someone changes the item in the meantime, including in the Google Ads interface, AdSmart does not apply and asks for a new preview.

## Requirements

- [Claude Desktop](https://claude.ai/download) on macOS. Windows support will come in a future version. AdSmart does not run on claude.ai in the browser or on mobile apps, because it runs on your computer.
- A Google account with **admin** access to the Google Ads account (or MCC).
- A Google Cloud project with the Google Ads API enabled at the Explorer access level (free, no credit card required).

## Installation

Once the first version is released:

1. Download `adsmart-<version>.mcpb` from the [latest release](https://github.com/ZenniTTy/adsmart-app/releases/latest).
2. Double-click the file or drag it into the Claude Desktop window. Claude Desktop warns that the extension is not verified by Anthropic: this is expected, see the [installation guide](docs/instalacao.md) (Portuguese).
3. Ask in the chat: **"Me ajude a configurar o AdSmart"** ("Help me set up AdSmart"). Claude walks you through the [setup guide](docs/configuracao.md) (Portuguese) one step at a time and stops whenever an action is yours. On paid plans, it can also hand you a ready-made prompt so Claude Cowork does the browser work.

The extension does not update itself: for a new version, download and install the file from the latest release.

## Documentation

The documentation is also on [adsmart.digital](https://adsmart.digital) (Portuguese), with search.

Guides are written in Portuguese: [installation](docs/instalacao.md), [setup](docs/configuracao.md), [usage](docs/uso.md), [limits](docs/limites.md) and [troubleshooting](docs/solucao-de-problemas.md).

## FAQ

**Do I need a Google Ads developer token?**
No. Access is granted through your Google Cloud project's access level (Explorer). The [setup guide](docs/configuracao.md) shows how to request it.

**Can Claude change my account without me knowing?**
No. No tool changes the account in a single step: there is always a preview and your confirmation in the chat. If you choose "Always allow" for the `aplicar` tool in Claude Desktop, the extra permission window no longer appears, but the chat confirmation is still required.

**Does my data go to any server?**
No. AdSmart runs locally and only talks to the Google Ads API. The change history is a file on your computer.

**Does it work with an MCC (manager account)?**
Yes. Link the service account to the MCC and AdSmart reaches every linked account.

## Security

AdSmart handles credentials that can change ad spend. Read the [security policy](SECURITY.md) to learn how your data is protected and how to report vulnerabilities privately.

## Contributing

Contributions are welcome, including with AI coding agents: agent instructions live in [AGENTS.md](AGENTS.md). See the [contributing guide](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © Eduardo Rodrigues

---

*AdSmart is an independent project and is not affiliated with, sponsored or endorsed by Google LLC or Anthropic. Google Ads is a trademark of Google LLC. Claude is a trademark of Anthropic.*
