# Configuração

Este guia conecta o AdSmart à sua conta do Google Ads. Leva cerca de 15 minutos e é feito uma única vez.

> [!TIP]
> Com a extensão instalada, peça no chat: **"Me ajude a configurar o AdSmart"**. Depois de conferir os pré-requisitos, o Claude oferece três caminhos:
>
> - **Claude Cowork** (planos pagos): o Claude entrega um texto pronto para você colar numa tarefa do [Cowork](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork). O Cowork conduz o navegador e para em toda ação que é sua. Depois você volta ao chat para escolher o arquivo de chave e rodar o diagnóstico.
> - **Claude in Chrome no chat** (planos pagos, navegador Chrome): com o [Claude in Chrome](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome) ligado na conversa, o Claude abre as páginas e faz os cliques que são dele.
> - **Manual**: o Claude explica um passo por vez, e você faz tudo.
>
> Você também pode seguir os passos abaixo sozinho.

### Se usar o Cowork

- Use o modo **Automatically approve**: o Claude revisa cada ação e bloqueia o que parecer inseguro, sem pedir sua aprovação a cada clique. **Não use Skip all approvals**, em que nada é checado. Se preferir aprovar cada ação, o modo **Manually approve** é o que a Anthropic recomenda para contas e sites sensíveis ([Use Claude Cowork safely](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely)).
- Use um navegador logado na sua conta Google. Com o Claude in Chrome ligado, o Cowork usa o seu Chrome; no navegador próprio do Cowork, ele abre a página de login e espera você entrar.
- Não conecte ao Cowork a pasta onde a chave vai ficar nem a pasta de downloads. O Cowork só enxerga as pastas que você conectar, e é isso que impede que ele abra a chave.
- No chat, o Claude não tem como abrir o arquivo de chave. No Cowork, a proteção depende dessas escolhas e das regras do texto pronto. Se preferir não correr esse risco, use o caminho manual.

## Antes de começar

- Entre na sua conta Google com a verificação em duas etapas ativa e **crie uma chave de acesso (passkey) antes de começar**: o Google Ads pede a passkey para adicionar usuários, e uma passkey nova leva de 1 a 2 dias para funcionar lá.
- Tenha acesso de **administrador** à conta do Google Ads (ou à conta de administrador/MCC que gerencia suas contas).
- Use a mesma conta Google para o Google Cloud e para o Google Ads.
- Nenhum cartão de crédito é necessário.

Algumas ações são sempre suas, mesmo com a ajuda do Claude: login, verificação em duas etapas e passkey; aceitar termos; criar e guardar a chave; dar acesso no Google Ads; escolher o arquivo na extensão. O Claude nunca abre nem lê o arquivo de chave e nunca concede acesso a contas em seu nome.

## 1. Criar um projeto no Google Cloud

1. Acesse [console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate).
2. Dê um nome ao projeto, por exemplo `adsmart`, e clique em **Criar**.
3. Se for seu primeiro acesso ao Google Cloud, aceite os Termos de Serviço.

Não vincule uma conta de faturamento ao projeto e não ative o período de avaliação gratuita (Free Trial) se ele for oferecido. Nenhum dos dois é necessário, e projetos em avaliação gratuita têm a solicitação do passo 3 recusada.

## 2. Ativar a Google Ads API

1. Acesse o [link de ativação da Google Ads API](https://console.cloud.google.com/flows/enableapi?apiid=googleads.googleapis.com).
2. Confira que o projeto `adsmart` está selecionado e confirme a ativação.

## 3. Solicitar acesso às contas reais (Explorer)

Projetos novos só acessam contas de teste. Para gerenciar suas contas reais:

1. Acesse a [visão geral da Google Ads API](https://console.cloud.google.com/google/ads-apis/overview).
2. Confira que o nível atual é **Teste** (*Test*, na interface em inglês), abra a seção **Fazer upgrade do nível de acesso** (*Upgrade access level*, em inglês) e envie o pedido do nível **Explorer** (**Exploração**, no console em português). Se o formulário pedir aceite de termos, o aceite é seu.

O Google pode aprovar na hora ou depois; quando aprovado, a página mostra o nível Explorer. Se o pedido for recusado, o único caminho oficial é passar o projeto para o nível pago do Google Cloud, o que exige cartão. Veja [pedido de Explorer recusado](solucao-de-problemas.md#pedido-de-explorer-ou-basic-recusado).

## 4. Criar a conta de serviço

A conta de serviço é a identidade que o AdSmart usa para acessar o Google Ads.

1. Acesse [Contas de serviço](https://console.cloud.google.com/iam-admin/serviceaccounts), escolha o projeto `adsmart` se o console pedir, e clique em **Criar conta de serviço**.
2. Dê o nome `adsmart` e conclua. Não é necessário atribuir papéis.
3. Abra a conta criada e copie o **e-mail** dela (termina em `.iam.gserviceaccount.com`).
4. Na aba **Chaves**, clique em **Adicionar chave > Criar nova chave > JSON**. O arquivo será baixado com um nome parecido com `adsmart-123456-a1b2c3d4e5f6.json`.
5. Mova o arquivo para uma pasta segura, por exemplo `~/.adsmart/`. **Não compartilhe este arquivo** com ninguém, nem o cole no chat.

O arquivo só pode ser baixado uma vez. Se ele se perder, crie outra chave na aba **Chaves** e apague a antiga. Em contas de empresa (Google Workspace) criadas a partir de maio de 2024, o Google pode recusar a criação da chave; nesse caso, só o administrador da organização pode liberar (veja [não consigo criar a chave](solucao-de-problemas.md#não-consigo-criar-a-chave-da-conta-de-serviço)).

## 5. Dar acesso à conta do Google Ads

1. Abra a [seleção de contas do Google Ads](https://ads.google.com/nav/selectaccount) e escolha a conta que deseja gerenciar. Se você usa uma MCC, escolha a MCC para dar acesso a todas as contas vinculadas. Se cair na página de divulgação do Google Ads, clique em **Acesse sua conta**.
2. Vá em **Administrador > Acesso e segurança**.
3. Clique em **+** na aba **Usuários**, cole o e-mail da conta de serviço e escolha o nível **Padrão**.
4. Clique em **Adicionar conta**.

Este passo é sempre feito por você: por segurança, o Claude não concede acesso a contas em seu nome. O Google Ads pode pedir sua passkey para adicionar o usuário; por isso ela deve ser criada antes de começar (veja [Antes de começar](#antes-de-começar)).

Anote o **ID da conta**: o número de 10 dígitos exibido no canto superior do Google Ads, ao lado do nome da conta. O número que aparece na barra de endereço não é o ID da conta.

## 6. Configurar a extensão

1. Instale a extensão, se ainda não instalou ([guia de instalação](instalacao.md)), e abra **Configurações > Extensões > AdSmart** no Claude Desktop.
2. Selecione o arquivo de chave JSON do passo 4.
3. Informe o ID da conta de administrador (MCC) sem traços, se você usar uma. Caso contrário, deixe em branco.

## 7. Testar

No chat, peça: **"Rode o diagnóstico do AdSmart"**. O Claude verifica cada etapa e confirma quais contas estão acessíveis. Se algo falhar, ele indica exatamente o passo a corrigir.

Veja também a [solução de problemas](solucao-de-problemas.md).
