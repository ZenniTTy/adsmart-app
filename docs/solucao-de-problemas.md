# Solução de problemas

Comece sempre pedindo ao Claude: **"Rode o diagnóstico do AdSmart"**. Ele identifica a maioria dos problemas abaixo automaticamente.

## `CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION`

O projeto do Google Cloud ainda está no nível **Teste** (*Test*, na interface em inglês) e só acessa contas de teste. Solicite o nível Explorer ([passo 3](configuracao.md#3-solicitar-acesso-às-contas-reais-explorer)).

## Pedido de Explorer ou Basic recusado

O Google recusa solicitações de projetos em período de avaliação gratuita (Free Trial) ou com faturamento suspenso. Remova a conta de faturamento do projeto ou crie um projeto novo sem faturamento e solicite novamente.

## `AUTHORIZATION_ERROR` logo após a aprovação do nível de acesso

Problema conhecido do Google em alguns projetos antigos. Crie um projeto novo, repita os passos 2 a 6 da [configuração](configuracao.md) e solicite o Explorer nele.

## `USER_PERMISSION_DENIED`

A conta de serviço não tem acesso à conta consultada. Verifique:

- Se o e-mail da conta de serviço foi adicionado em **Administrador > Acesso e segurança** ([passo 5](configuracao.md#5-dar-acesso-à-conta-do-google-ads)).
- Se, ao usar uma MCC, o ID dela foi informado nas configurações da extensão.

## `NOT_ADS_USER`

A conta de serviço não está vinculada a nenhuma conta do Google Ads. Refaça o [passo 5](configuracao.md#5-dar-acesso-à-conta-do-google-ads).

## "ID de conta inválido"

O ID da conta tem 10 dígitos e pode ser informado com ou sem traços: `123-456-7890` ou `1234567890`.

## "O limite diário de operações da API do Google Ads foi atingido"

O projeto do Google Cloud usou toda a cota do dia. Espere a cota renovar ou veja os níveis de acesso em [limites](limites.md#cota-diária-da-api).

## "Esta conta do Google Ads está desativada ou cancelada"

Contas canceladas continuam aparecendo na lista, mas não aceitam consultas. Reative a conta no Google Ads ou escolha outra.

## "O Google Ads teve uma falha temporária"

Falha do lado do Google. Tente novamente em alguns instantes. Se persistir, abra uma issue informando o código da requisição exibido na mensagem.

## "O arquivo selecionado não é uma chave JSON de conta de serviço"

O arquivo escolhido nas configurações da extensão não é a chave baixada no [passo 4](configuracao.md#4-criar-a-conta-de-serviço). Selecione o arquivo `.json` correto.

## `CUSTOMER_NOT_FOUND`

O ID informado não é o da conta. O número que aparece na barra de endereço do Google Ads (por exemplo, depois de `ocid=`) não é o ID da conta. Use o número de 10 dígitos exibido no canto superior da interface do Google Ads, ao lado do nome da conta, sem traços.

## Não consigo criar a chave da conta de serviço

Contas Google Workspace de empresas podem bloquear a criação de chaves por política da organização. Organizações criadas a partir de maio de 2024 vêm com esse bloqueio ativado por padrão. Peça ao administrador de TI para liberar a criação de chaves no projeto.

## A extensão não aparece no Claude

- Atualize o Claude Desktop para a versão mais recente.
- Reinstale o arquivo `.mcpb` em **Configurações > Extensões**.
- Se você usa o Claude Code no app desktop ou o Cowork, instale o Node.js 22 ou mais recente: nesses modos a extensão usa o Node.js do computador. Veja [onde funciona](instalacao.md#onde-funciona).
- Outros casos em [problemas na instalação](instalacao.md#problemas-na-instalação).

## Ainda com problemas?

Abra uma [issue](https://github.com/ZenniTTy/adsmart-app/issues/new/choose) com o resultado do diagnóstico. **Nunca inclua o arquivo de chave ou dados das suas contas.**
