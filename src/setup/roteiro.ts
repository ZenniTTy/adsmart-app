export type Actor = "voce" | "claude";

export type StepKey =
	| "projeto"
	| "api"
	| "explorer"
	| "conta_servico"
	| "acesso"
	| "extensao"
	| "teste";

export type SetupAction = { quem: Actor; texto: string };

export type SetupStep = {
	numero: number;
	chave: StepKey;
	titulo: string;
	onde: "navegador" | "chat";
	link: string | null;
	acoes: SetupAction[];
	como_saber: string;
	retomada: string;
};

export type SetupGuide = {
	antes_de_comecar: SetupAction[];
	passos: SetupStep[];
	regras: string[];
	regras_cowork: string[];
	modos: { cowork: string; navegador: string; manual: string };
	depois: string;
};

export const USER_ACTION_LABEL = "Eu faço (pare e espere eu avisar que concluí):";
export const CLAUDE_ACTION_LABEL = "Você faz:";
export const CHAT_STEP_NOTE =
	"Este passo acontece depois, no chat do AdSmart, e não é tarefa sua. Só me lembre dele no fim:";

const NUMERO: Record<StepKey, number> = {
	projeto: 1,
	api: 2,
	explorer: 3,
	conta_servico: 4,
	acesso: 5,
	extensao: 6,
	teste: 7,
};

const PASSOS: SetupStep[] = [
	{
		numero: NUMERO.projeto,
		chave: "projeto",
		titulo: "Criar um projeto no Google Cloud",
		onde: "navegador",
		link: "https://console.cloud.google.com/projectcreate",
		acoes: [
			{ quem: "claude", texto: "Abrir a página de criação de projeto e sugerir o nome `adsmart`." },
			{ quem: "voce", texto: "Aceitar os Termos de Serviço do Google Cloud, se aparecerem." },
			{ quem: "claude", texto: "Clicar em Criar e anotar o ID do projeto." },
			{
				quem: "voce",
				texto:
					"Não vincular faturamento nem ativar a avaliação gratuita, se o Google oferecer: projetos em avaliação gratuita têm o nível Explorer recusado.",
			},
		],
		como_saber: "O seletor de projetos, no topo do console, mostra o projeto novo.",
		retomada: "Abra o seletor de projetos no topo do console e escolha o projeto criado.",
	},
	{
		numero: NUMERO.api,
		chave: "api",
		titulo: "Ativar a Google Ads API",
		onde: "navegador",
		link: "https://console.cloud.google.com/flows/enableapi?apiid=googleads.googleapis.com",
		acoes: [
			{
				quem: "claude",
				texto:
					"Abrir o link, conferir que o projeto certo está selecionado e confirmar a ativação.",
			},
		],
		como_saber: "A página da Google Ads API no console mostra a API como ativada.",
		retomada:
			"Abra o link de novo: se a API já estiver ativa, o console mostra isso e basta seguir. Pelo menu: APIs e serviços > Biblioteca > Google Ads API.",
	},
	{
		numero: NUMERO.explorer,
		chave: "explorer",
		titulo: "Solicitar acesso às contas reais (Explorer)",
		onde: "navegador",
		link: "https://console.cloud.google.com/google/ads-apis/overview",
		acoes: [
			{
				quem: "claude",
				texto:
					"Abrir a visão geral da Google Ads API, conferir que o nível atual é Teste e abrir a seção de upgrade do nível de acesso.",
			},
			{
				quem: "voce",
				texto:
					"Preencher e enviar o pedido do nível Explorer e, se o formulário pedir, aceitar os termos.",
			},
		],
		como_saber:
			"A visão geral passa a mostrar o nível Explorer, com limite de 2.880 operações por dia.",
		retomada:
			"Abra a visão geral de novo. O Google pode aprovar na hora ou depois. Se recusar, o único caminho oficial é passar o projeto para o nível pago do Google Cloud, que exige cartão.",
	},
	{
		numero: NUMERO.conta_servico,
		chave: "conta_servico",
		titulo: "Criar a conta de serviço",
		onde: "navegador",
		link: "https://console.cloud.google.com/iam-admin/serviceaccounts",
		acoes: [
			{
				quem: "claude",
				texto:
					"Criar a conta de serviço com o nome `adsmart`, sem atribuir papéis, e mostrar o e-mail dela (termina em `.iam.gserviceaccount.com`).",
			},
			{
				quem: "claude",
				texto: "Abrir a aba Chaves da conta de serviço e chegar até a escolha do formato JSON.",
			},
			{
				quem: "voce",
				texto: "Clicar em Criar para gerar a chave JSON. O arquivo só pode ser baixado uma vez.",
			},
			{
				quem: "voce",
				texto:
					"Guardar o arquivo numa pasta segura, como `~/.adsmart/`, sem mostrar o conteúdo a ninguém.",
			},
		],
		como_saber: "A aba Chaves lista uma chave ativa, e o arquivo JSON está guardado pela pessoa.",
		retomada:
			"Se a chave se perdeu, crie outra na aba Chaves e apague a antiga. Se o Google recusar a criação da chave numa conta de empresa (Google Workspace), só o administrador da organização pode liberar.",
	},
	{
		numero: NUMERO.acesso,
		chave: "acesso",
		titulo: "Dar acesso à conta do Google Ads",
		onde: "navegador",
		link: "https://ads.google.com",
		acoes: [
			{
				quem: "voce",
				texto:
					"Abrir a conta do Google Ads (ou a MCC, para dar acesso a todas as contas vinculadas) e ir em Administrador > Acesso e segurança.",
			},
			{
				quem: "voce",
				texto:
					"Na aba Usuários, clicar em +, colar o e-mail da conta de serviço, escolher o nível Padrão e clicar em Adicionar conta. O Google pode pedir a passkey da pessoa.",
			},
			{
				quem: "voce",
				texto:
					"Anotar o ID da conta: os 10 dígitos ao lado do nome da conta, no topo do Google Ads (não o número da barra de endereço).",
			},
		],
		como_saber: "A aba Usuários lista o e-mail da conta de serviço com o nível Padrão.",
		retomada:
			"Abra Administrador > Acesso e segurança e confira se o e-mail da conta de serviço está na lista.",
	},
	{
		numero: NUMERO.extensao,
		chave: "extensao",
		titulo: "Configurar a extensão",
		onde: "chat",
		link: null,
		acoes: [
			{ quem: "voce", texto: "Abrir Configurações > Extensões > AdSmart no Claude Desktop." },
			{ quem: "voce", texto: "Selecionar o arquivo de chave JSON do passo anterior." },
			{
				quem: "voce",
				texto: "Informar o ID da MCC, se a pessoa usa uma. Caso contrário, deixar em branco.",
			},
		],
		como_saber: "O diagnóstico mostra a etapa Arquivo de chave como OK.",
		retomada: "Abra de novo as configurações da extensão e confira o arquivo escolhido.",
	},
	{
		numero: NUMERO.teste,
		chave: "teste",
		titulo: "Testar",
		onde: "chat",
		link: null,
		acoes: [
			{
				quem: "claude",
				texto: "Rodar o diagnóstico do AdSmart e mostrar o resultado de cada etapa.",
			},
		],
		como_saber: "Todas as etapas do diagnóstico aparecem como OK.",
		retomada: "Cada etapa em FALHA do diagnóstico indica o passo do guia a refazer.",
	},
];

export const SETUP_GUIDE: SetupGuide = {
	antes_de_comecar: [
		{
			quem: "voce",
			texto:
				"Entrar na conta Google, com verificação em duas etapas, e ter uma passkey já criada: o Google pede a passkey para adicionar usuários no Google Ads, e uma passkey nova leva de 1 a 2 dias para funcionar lá.",
		},
		{
			quem: "voce",
			texto:
				"Ter acesso de administrador à conta do Google Ads (ou à MCC) e usar a mesma conta Google no Google Cloud e no Google Ads.",
		},
	],
	passos: PASSOS,
	regras: [
		"A chave nunca passa pelo Claude: o Claude não abre, não lê, não cola e não envia o arquivo de chave, nem procura por ele na pasta de downloads.",
		"O Claude nunca concede acesso a contas do Google Ads em nome da pessoa.",
		"Login, verificação em duas etapas, passkey e aceite de termos são sempre da pessoa.",
		"Nas ações da pessoa, o Claude para, explica o que fazer e espera a pessoa avisar que concluiu.",
	],
	regras_cowork: [
		'Antes de começar, confirme que o Cowork está no modo "Manually approve" (aprovar cada ação manualmente). Se estiver em "Skip all approvals", pare e me peça para trocar.',
		"Não me peça para conectar a pasta onde a chave vai ficar nem a pasta de downloads, e não trabalhe em nenhuma das duas.",
		"Não abra, não leia, não mova, não copie e não liste o arquivo de chave JSON.",
		"Na criação da chave, pare antes do botão Criar: eu clico, baixo e guardo o arquivo.",
		"Nunca digite senhas, códigos de verificação nem passkeys; quando o Google pedir, pare e espere eu fazer.",
		"No fim, não configure a extensão: diga para eu voltar ao chat do AdSmart, escolher o arquivo de chave nas configurações e pedir o diagnóstico.",
	],
	modos: {
		cowork:
			'Com o Claude Cowork (planos pagos), a pessoa copia o prompt pronto (prompt_cowork) e cola numa tarefa do Cowork no modo "Manually approve": o Cowork conduz o navegador e para em toda ação da pessoa. Depois ela volta a este chat para escolher o arquivo de chave e rodar o diagnóstico.',
		navegador:
			"Com o Claude in Chrome ligado nesta conversa (planos pagos, no navegador Chrome), o Claude abre os links e faz as ações marcadas como dele, parando sempre que chegar uma ação da pessoa.",
		manual:
			"Sem o Claude in Chrome, a pessoa abre cada link e faz todas as ações; o Claude explica um passo por vez e espera a pessoa avisar que concluiu.",
	},
	depois:
		"Quando terminar, peça ao Claude para rodar o diagnóstico do AdSmart: cada etapa em FALHA indica o passo a refazer.",
};

export function guideStep(key: StepKey): string {
	return `passo ${NUMERO[key]} do guia de configuração`;
}

function bulletList(lines: string[]): string {
	return lines.map((line) => `- ${line}`).join("\n");
}

function promptStep(passo: SetupStep): string {
	if (passo.onde === "chat") {
		return [
			`Passo ${passo.numero} — ${passo.titulo}`,
			CHAT_STEP_NOTE,
			...passo.acoes.map((acao) => `- ${acao.texto}`),
		].join("\n");
	}
	const actions = passo.acoes.map(
		(acao) => `- ${acao.quem === "voce" ? USER_ACTION_LABEL : CLAUDE_ACTION_LABEL} ${acao.texto}`,
	);
	return [
		`Passo ${passo.numero} — ${passo.titulo}`,
		...(passo.link ? [`Link: ${passo.link}`] : []),
		...actions,
		`Como saber que deu certo: ${passo.como_saber}`,
		`Se precisar retomar: ${passo.retomada}`,
	].join("\n");
}

export function coworkPrompt(guide: SetupGuide): string {
	return [
		"Você vai me ajudar a configurar o AdSmart, uma extensão do Claude Desktop que conecta o Claude à minha conta do Google Ads. Siga o roteiro abaixo, um passo por vez, e respeite todas as regras. No roteiro, quando aparecer a pessoa, sou eu.",
		`Regras do Cowork:\n${bulletList(guide.regras_cowork)}`,
		`Regras gerais:\n${bulletList(guide.regras)}`,
		`Antes de começar (confirme comigo):\n${bulletList(guide.antes_de_comecar.map((item) => item.texto))}`,
		...guide.passos.map(promptStep),
		`Ao terminar: ${guide.depois}`,
	].join("\n\n");
}
