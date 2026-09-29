# Instalação

A AdSmart é uma extensão do Claude Desktop (arquivo `.mcpb`). Ela roda no seu computador e só conversa com o Google.

## Onde funciona

- **Chat do Claude Desktop no macOS.** É o uso suportado. O suporte a Windows virá numa versão futura; até lá, o Claude Desktop no Windows recusa a instalação. O Claude Desktop já traz o Node.js que a extensão precisa: você não instala nada além dela.
- **Claude Code no app desktop e Cowork:** nesses modos, o Claude Desktop usa o Node.js instalado no seu computador, e não o que vem com o app. Sem Node.js 22 ou mais recente instalado, a extensão não inicia.
- **claude.ai no navegador e apps de celular:** não funciona, porque a extensão precisa rodar no seu computador.

## Baixar

1. Abra o [último release](https://github.com/ZenniTTy/adsmart-app/releases/latest).
2. Baixe `adsmart.mcpb` (o mesmo pacote, com nome fixo) ou `adsmart-<versão>.mcpb`.

### Conferir o arquivo (opcional)

Cada release traz o arquivo `.sha256` com a impressão digital do pacote. Para conferir se o arquivo que você baixou é exatamente o publicado:

No Terminal: `shasum -a 256 -c adsmart.mcpb.sha256`

O comando vale para o arquivo de nome fixo. Para o pacote com a versão no nome, use `shasum -a 256 adsmart-<versão>.mcpb` e compare com o `.sha256` correspondente. Quem usa o GitHub CLI também pode confirmar que o pacote foi gerado pelo build deste repositório:

```bash
gh attestation verify adsmart.mcpb --repo ZenniTTy/adsmart-app
```

## Instalar

Use um destes caminhos:

- dê dois cliques no arquivo `.mcpb`;
- arraste o arquivo para a janela do Claude Desktop;
- no Claude Desktop, abra **Configurações > Extensões**, clique em **Configurações avançadas** e, na seção de desenvolvedor de extensões, em **Instalar extensão…**; escolha o arquivo. Os nomes dos menus podem aparecer em inglês (**Settings > Extensions > Advanced settings > Install Extension…**), conforme o idioma do app.

O Claude Desktop mostra os detalhes da extensão e as permissões antes de instalar.

### Aviso de extensão não verificada

O Claude Desktop avisa que a extensão não foi verificada pela Anthropic e que ela terá acesso ao seu computador. Esse aviso é esperado: a Anthropic não verifica extensões distribuídas fora do diretório dela, e o diretório não aceita mais extensões desse tipo. Para confiar no arquivo, baixe só do release oficial e, se quiser, confira a impressão digital como mostrado acima. O código é aberto e pode ser revisto neste repositório.

## Configurar

Depois de instalar, abra **Configurações > Extensões > AdSmart** e preencha:

- **Arquivo de chave da conta de serviço:** o arquivo JSON baixado no Google Cloud.
- **ID da conta de administrador (MCC):** só se você acessa as contas por uma MCC.

Se você ainda não tem a conta de serviço, instale a extensão assim mesmo e peça no chat: **"Me ajude a configurar a AdSmart"**. O Claude conduz o [guia de configuração](configuracao.md) com você, passo a passo.

## Testar

No chat, peça: **"Rode o diagnóstico da AdSmart"**. Cada etapa aparece como OK ou FALHA, com o passo do guia para corrigir.

## Atualizar

A extensão não se atualiza sozinha: extensões instaladas por arquivo precisam ser atualizadas à mão. Para usar uma versão nova, baixe o `.mcpb` do release mais recente e instale-o. O histórico de alterações fica na pasta `.adsmart` do seu usuário, fora da extensão, e não se perde ao trocar de versão.

## Problemas na instalação

- **Nada acontece ao abrir o arquivo:** tente o caminho pelo menu de extensões descrito em [Instalar](#instalar) e reinicie o Claude Desktop depois de instalar.
- **A extensão aparece, mas não responde:** feche o Claude Desktop por completo e abra de novo. Se continuar, veja o status e o registro da extensão no painel de extensões e nas configurações de desenvolvedor do Claude Desktop (no macOS, os registros também ficam em `~/Library/Logs/Claude/`, no arquivo `mcp-server-AdSmart.log`), e abra um [issue](https://github.com/ZenniTTy/adsmart-app/issues) contando o que aparece. Não cole o conteúdo do arquivo de chave.
- Veja também a [solução de problemas](solucao-de-problemas.md).
