# Configuração

Este guia conecta o AdSmart à sua conta do Google Ads. Leva cerca de 15 minutos e é feito uma única vez.

> [!TIP]
> Em uma próxima versão, o próprio Claude poderá executar este guia no seu navegador, avisando sempre que precisar de você. Por enquanto, siga os passos abaixo.

## Antes de começar

- Tenha acesso de **administrador** à conta do Google Ads (ou à conta de administrador/MCC que gerencia suas contas).
- Use a mesma conta Google para o Google Cloud e para o Google Ads.
- Nenhum cartão de crédito é necessário.

## 1. Criar um projeto no Google Cloud

1. Acesse [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate).
2. Dê um nome ao projeto, por exemplo `adsmart`, e clique em **Criar**.
3. Se for seu primeiro acesso ao Google Cloud, aceite os Termos de Serviço.

Não vincule uma conta de faturamento ao projeto e não ative o período de avaliação gratuita (Free Trial) se ele for oferecido. Nenhum dos dois é necessário, e projetos em avaliação gratuita têm a solicitação do passo 3 recusada.

## 2. Ativar a Google Ads API

1. Acesse [a página da Google Ads API](https://console.cloud.google.com/apis/library/googleads.googleapis.com) com o projeto `adsmart` selecionado.
2. Clique em **Ativar**.

## 3. Solicitar acesso às contas reais (Explorer)

Projetos novos só acessam contas de teste. Para gerenciar suas contas reais:

1. Acesse a [visão geral da Google Ads API](https://console.cloud.google.com/google/ads-apis/overview).
2. Expanda **Upgrade access level** e solicite o nível **Explorer**.

Na maioria dos casos, a aprovação é automática em poucos minutos.

## 4. Criar a conta de serviço

A conta de serviço é a identidade que o AdSmart usa para acessar o Google Ads.

1. Acesse [Contas de serviço](https://console.cloud.google.com/iam-admin/serviceaccounts) e clique em **Criar conta de serviço**.
2. Dê o nome `adsmart` e conclua. Não é necessário atribuir papéis.
3. Abra a conta criada e copie o **e-mail** dela (termina em `.iam.gserviceaccount.com`).
4. Na aba **Chaves**, clique em **Adicionar chave > Criar nova chave > JSON**. O arquivo será baixado com um nome parecido com `adsmart-123456-a1b2c3d4e5f6.json`.
5. Mova o arquivo para uma pasta segura, por exemplo `~/.adsmart/`. **Não compartilhe este arquivo** com ninguém.

## 5. Dar acesso à conta do Google Ads

1. No [Google Ads](https://ads.google.com), abra a conta que deseja gerenciar. Se você usa uma MCC, abra a MCC para dar acesso a todas as contas vinculadas.
2. Vá em **Administrador > Acesso e segurança**.
3. Clique em **+** na aba **Usuários**, cole o e-mail da conta de serviço e escolha o nível **Padrão**.
4. Clique em **Adicionar conta**.

Este passo é sempre feito por você: por segurança, o Claude não concede acesso a contas em seu nome. A partir de 15 de outubro de 2026, o Google Ads exige uma chave de acesso (passkey) para adicionar usuários; se o Google pedir, crie a sua quando solicitado.

Anote o **ID da conta**: o número de 10 dígitos exibido no canto superior do Google Ads, ao lado do nome da conta. O número que aparece na barra de endereço não é o ID da conta.

## 6. Configurar a extensão

1. Instale a extensão, se ainda não instalou ([guia de instalação](instalacao.md)), e abra **Configurações > Extensões > AdSmart** no Claude Desktop.
2. Selecione o arquivo de chave JSON do passo 4.
3. Informe o ID da conta de administrador (MCC) sem traços, se você usar uma. Caso contrário, deixe em branco.

## 7. Testar

No chat, peça: **"Rode o diagnóstico do AdSmart"**. O Claude verifica cada etapa e confirma quais contas estão acessíveis. Se algo falhar, ele indica exatamente o passo a corrigir.

Veja também a [solução de problemas](solucao-de-problemas.md).
