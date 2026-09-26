# Política de Segurança

## Como o AdSmart protege seus dados

- **Tudo roda no seu computador.** O AdSmart se comunica apenas com os servidores do Google (`googleads.googleapis.com` e `oauth2.googleapis.com`). Não há servidores intermediários nem coleta de dados.
- **Credenciais protegidas.** O arquivo de chave da conta de serviço fica em uma pasta do seu computador e é lido apenas pelo AdSmart. A chave nunca é registrada em logs nem enviada ao Claude.
- **Nenhuma alteração sem aprovação.** Toda alteração é validada pelo Google e exibida para você antes de ser aplicada.
- **Acesso revogável a qualquer momento.** Remova o e-mail da conta de serviço em **Administrador > Acesso e segurança** no Google Ads, ou exclua a chave no Google Cloud.

## Boas práticas para usuários

- Guarde o arquivo de chave JSON em uma pasta privada e nunca o compartilhe.
- Conceda à conta de serviço o nível **Padrão**, e não Administrador, salvo quando necessário.
- Se suspeitar que a chave vazou, exclua-a imediatamente no Google Cloud e gere uma nova.

## Versões suportadas

Correções de segurança são publicadas apenas para a versão mais recente.

## Reportar uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades.**

Use o [reporte privado de vulnerabilidades do GitHub](https://github.com/ZenniTTy/adsmart-app/security/advisories/new). Inclua a descrição do problema, os passos para reproduzir e o impacto potencial.

Você receberá uma resposta em até 7 dias. Após a correção, o problema será divulgado com os devidos créditos, se você desejar.
