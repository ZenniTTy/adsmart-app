---
title: "Limites"
description: "Limites da AdSmart: onde funciona, cota diária da Google Ads API, recursos indisponíveis no nível Explorer e permissões da conta de serviço."
sidebar:
  order: 4
---

## Onde funciona

A AdSmart funciona no **Claude Desktop** no macOS. O suporte a Windows virá numa versão futura; até lá, o Claude Desktop no Windows recusa a instalação. Ela não está disponível no claude.ai pelo navegador nem nos apps de celular, porque roda no seu computador.

## Cota diária da API

O nível de acesso do seu projeto no Google Cloud define quanto você pode usar por dia:

| Nível | Operações por dia | Como obter |
|---|---|---|
| Explorer | 2.880 | Pedido no console; a aprovação pode ser automática ([configuração](/docs/configuracao/#3-solicitar-acesso-às-contas-reais-explorer)) |
| Basic | 15.000 | Requer verificação de marca do projeto no Google Cloud |

Como a cota é contada:

- Cada consulta ou relatório conta como **1 operação**, independentemente do número de linhas.
- Em alterações, **cada item alterado** conta como 1 operação. Alterar 200 palavras-chave consome 200 operações.
- A prévia e a conferência antes de aplicar também fazem consultas: conte com algumas operações a mais por lote, além dos itens alterados.

Para o uso diário de gestão e análise, o nível Explorer costuma ser suficiente.

## Recursos indisponíveis no nível Explorer

- Planejador de palavras-chave (ideias, volumes e previsões)
- Planejador de alcance e insights de público
- Criação de contas e gestão de usuários
- Faturamento e pagamentos

Para usar o Planejador de palavras-chave, solicite o nível **Basic** na [visão geral da Google Ads API](https://console.cloud.google.com/google/ads-apis/overview).

## Permissões da conta de serviço

Com o nível **Padrão** no Google Ads, a AdSmart gerencia campanhas, grupos de anúncios, anúncios, palavras-chave, orçamentos, lances e segmentação. Algumas operações exigem nível **Administrador**, que precisa ser concedido manualmente em **Administrador > Acesso e segurança**.

## O que continua sendo feito no Google Ads

Alguns fluxos só existem na interface do Google Ads, como verificação de anunciante, recursos de políticas e configuração de pagamento.
