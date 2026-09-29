export const REPOSITORIO = "https://github.com/ZenniTTy/adsmart-app";

export function nomePacote(versao: string): string {
	return `adsmart-${versao}.mcpb`;
}

export function urlDownload(versao: string): string {
	return `${REPOSITORIO}/releases/latest/download/${nomePacote(versao)}`;
}

export const ORDEM_DOCS = ["instalacao", "configuracao", "uso", "limites", "solucao-de-problemas"];

export const DESCRICOES: Record<string, string> = {
	instalacao:
		"Como instalar a AdSmart no Claude Desktop para macOS: baixe o arquivo .mcpb, abra com dois cliques e confira a impressão digital.",
	configuracao:
		"Conecte a AdSmart ao Google Ads em cerca de 15 minutos: projeto no Google Cloud, Google Ads API, acesso Explorer, conta de serviço e acesso à conta.",
	uso: "Exemplos de perguntas e alterações no Google Ads pelo chat do Claude, com prévia validada pelo Google, confirmação, desfazer e histórico.",
	limites:
		"Limites da AdSmart: onde funciona, cota diária da Google Ads API, recursos indisponíveis no nível Explorer e permissões da conta de serviço.",
	"solucao-de-problemas":
		"Resolva erros comuns da AdSmart: acesso à Google Ads API, permissões da conta de serviço, chave JSON, cota diária e diagnóstico automático.",
};

export const DESCRICAO_NOVIDADES =
	"Histórico de versões da AdSmart: novidades, correções e mudanças de cada lançamento da extensão para o Claude Desktop.";

const TIPOS_DE_AVISO: Record<string, string> = {
	NOTE: "note",
	TIP: "tip",
	IMPORTANT: "note",
	WARNING: "caution",
	CAUTION: "danger",
};

export type Pagina = { slug: string; conteudo: string };

export function extrairTitulo(markdown: string): { titulo: string; corpo: string } {
	const linhas = markdown.split("\n");
	const indice = linhas.findIndex((linha) => linha.startsWith("# "));
	if (indice === -1) {
		throw new Error("Documento sem título de nível 1 (# Título).");
	}
	const titulo = (linhas[indice] ?? "").slice(2).trim();
	const corpo = [...linhas.slice(0, indice), ...linhas.slice(indice + 1)].join("\n").trim();
	return { titulo, corpo };
}

export function converterAvisos(markdown: string): string {
	const linhas = markdown.split("\n");
	const saida: string[] = [];
	for (let i = 0; i < linhas.length; i++) {
		const abertura = /^> \[!([A-Z]+)\]\s*$/.exec(linhas[i] ?? "");
		const tipo = abertura ? TIPOS_DE_AVISO[abertura[1] ?? ""] : undefined;
		if (!tipo) {
			saida.push(linhas[i] ?? "");
			continue;
		}
		const conteudo: string[] = [];
		while (i + 1 < linhas.length && (linhas[i + 1] ?? "").startsWith(">")) {
			i++;
			conteudo.push((linhas[i] ?? "").replace(/^> ?/, ""));
		}
		saida.push(`:::${tipo}`, ...conteudo, ":::");
	}
	return saida.join("\n");
}

export function converterLinks(markdown: string): string {
	return markdown.replace(
		/\]\(([a-z0-9-]+)\.md(#[^)]*)?\)/g,
		(_, arquivo: string, ancora?: string) => `](/docs/${arquivo}/${ancora ?? ""})`,
	);
}

export function paginaDeDoc(nomeArquivo: string, markdown: string): Pagina {
	const slug = nomeArquivo.replace(/\.md$/, "");
	const { titulo, corpo } = extrairTitulo(markdown);
	const ordem = ORDEM_DOCS.indexOf(slug);
	const menu = ordem >= 0 ? `sidebar:\n  order: ${ordem + 1}\n` : "";
	const descricao = DESCRICOES[slug];
	const linhaDescricao = descricao ? `description: ${JSON.stringify(descricao)}\n` : "";
	const cabecalho = `---\ntitle: ${JSON.stringify(titulo)}\n${linhaDescricao}${menu}---\n`;
	return { slug, conteudo: `${cabecalho}\n${converterLinks(converterAvisos(corpo))}\n` };
}

export function versaoLancada(changelog: string): string | null {
	const cabecalhos = [...changelog.matchAll(/^## \[([^\]]+)\]/gm)].map((m) => m[1] ?? "");
	return cabecalhos.find((cabecalho) => /^\d+\.\d+\.\d+$/.test(cabecalho)) ?? null;
}

export function paginaDeChangelog(changelog: string): Pagina {
	const { corpo } = extrairTitulo(changelog);
	return {
		slug: "novidades",
		conteudo: `---\ntitle: "Versões e novidades"\ndescription: ${JSON.stringify(DESCRICAO_NOVIDADES)}\n---\n\n${corpo}\n`,
	};
}
