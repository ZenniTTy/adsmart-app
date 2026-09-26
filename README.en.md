# AdSmart

**Manage your Google Ads campaigns by chatting with Claude.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ZenniTTy/adsmart-app/actions/workflows/ci.yml)

English · [Português](README.md)

> [!NOTE]
> Under active development. The first public version has not been released yet. Follow the [releases](https://github.com/ZenniTTy/adsmart-app/releases).

AdSmart is an open-source extension for **Claude Desktop** that connects Claude to your Google Ads accounts. Ask, analyze and change campaigns in plain language, right in the chat:

- *"How did my campaigns perform over the last 7 days?"*
- *"Which search terms are spending without converting?"*
- *"Pause the Black Friday campaign and raise the Brand budget to $80/day."*
- *"Undo the last change."*

## Why AdSmart

- **Fully local.** Runs on your computer. Your credentials never leave your machine and nothing goes through third-party servers.
- **Free.** The Google Ads API is free and AdSmart is open-source. You use your own Claude account.
- **Safe by default.** Every change is validated by Google and shown to you before it is applied. Nothing changes without your approval, and everything can be undone.
- **All your accounts.** Connect a manager account (MCC) and manage every linked account.

## Requirements

- [Claude Desktop](https://claude.ai/download) (macOS or Windows)
- A Google account with **admin** access to the Google Ads account (or MCC)
- A Google Cloud project (free, no credit card required)

## Installation

1. Download `adsmart.mcpb` from the [latest release](https://github.com/ZenniTTy/adsmart-app/releases/latest).
2. In Claude Desktop, open **Settings > Extensions** and drag the file into the window.
3. Follow the [setup guide](docs/configuracao.md) (Portuguese) to connect your Google Ads account. Claude can run the guide for you and will tell you when your action is needed, such as typing your password.

## Documentation

Guides are written in Portuguese: [setup](docs/configuracao.md), [usage](docs/uso.md), [limits](docs/limites.md) and [troubleshooting](docs/solucao-de-problemas.md).

## Contributing

Contributions are welcome. See the [contributing guide](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md). Please report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Eduardo Rodrigues

---

*AdSmart is an independent project and is not affiliated with, sponsored or endorsed by Google LLC or Anthropic. Google Ads is a trademark of Google LLC. Claude is a trademark of Anthropic.*
