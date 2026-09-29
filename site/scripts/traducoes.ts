import type { LocaleId } from "./locale.ts";
import { pathComLocale } from "./locale.ts";

export type LinkNav = { texto: string; href: string };

type Bloco = {
	navAria: string;
	nav: {
		inicio: string;
		baixar: string;
		instalacao: string;
		configuracao: string;
		uso: string;
		novidades: string;
	};
	heroSelo: string;
	download: {
		botao: string;
		windows: string;
		terminalIntro: string;
		conferenciaTitulo: string;
		emBreve: string;
		github: string;
	};
	rodape: {
		tagline: string;
		produto: string;
		documentacao: string;
		projeto: string;
		baixar: string;
		novidades: string;
		releases: string;
		instalacao: string;
		configuracao: string;
		uso: string;
		limites: string;
		solucao: string;
		github: string;
		seguranca: string;
		contribuir: string;
		conduta: string;
		licenca: string;
		feitoPor: string;
	};
};

const PT: Bloco = {
	navAria: "Principal",
	nav: {
		inicio: "Início",
		baixar: "Baixar",
		instalacao: "Instalação",
		configuracao: "Configuração",
		uso: "Uso",
		novidades: "Novidades",
	},
	heroSelo: "Extensão open source para o Claude Desktop",
	download: {
		botao: "Baixar para macOS",
		windows: "Windows · em breve",
		terminalIntro:
			"Ou pelo Terminal: o comando baixa o arquivo e abre o instalador do Claude Desktop.",
		conferenciaTitulo: "Conferir a impressão digital (opcional)",
		emBreve: "Lançamento em breve. Acompanhe no GitHub.",
		github: "Ver no GitHub",
	},
	rodape: {
		tagline: "Google Ads pelo chat do Claude. Local, open source e sem custo.",
		produto: "Produto",
		documentacao: "Documentação",
		projeto: "Projeto",
		baixar: "Baixar",
		novidades: "Versões e novidades",
		releases: "Releases no GitHub",
		instalacao: "Instalação",
		configuracao: "Configuração",
		uso: "Uso",
		limites: "Limites",
		solucao: "Solução de problemas",
		github: "GitHub",
		seguranca: "Segurança",
		contribuir: "Como contribuir",
		conduta: "Código de conduta",
		licenca: "Open source sob licença",
		feitoPor: "Feito por",
	},
};

const EN: Bloco = {
	navAria: "Main",
	nav: {
		inicio: "Home",
		baixar: "Download",
		instalacao: "Installation",
		configuracao: "Setup",
		uso: "Usage",
		novidades: "Release notes",
	},
	heroSelo: "Open-source extension for Claude Desktop",
	download: {
		botao: "Download for macOS",
		windows: "Windows · coming soon",
		terminalIntro:
			"Or in Terminal: the command downloads the file and opens the Claude Desktop installer.",
		conferenciaTitulo: "Verify checksum (optional)",
		emBreve: "Coming soon. Follow on GitHub.",
		github: "View on GitHub",
	},
	rodape: {
		tagline: "Google Ads in Claude chat. Local, open source, and free.",
		produto: "Product",
		documentacao: "Documentation",
		projeto: "Project",
		baixar: "Download",
		novidades: "Release notes",
		releases: "GitHub releases",
		instalacao: "Installation",
		configuracao: "Setup",
		uso: "Usage",
		limites: "Limits",
		solucao: "Troubleshooting",
		github: "GitHub",
		seguranca: "Security",
		contribuir: "Contributing",
		conduta: "Code of conduct",
		licenca: "Open source under the",
		feitoPor: "Made by",
	},
};

const ES: Bloco = {
	navAria: "Principal",
	nav: {
		inicio: "Inicio",
		baixar: "Descargar",
		instalacao: "Instalación",
		configuracao: "Configuración",
		uso: "Uso",
		novidades: "Novedades",
	},
	heroSelo: "Extensión open source para Claude Desktop",
	download: {
		botao: "Descargar para macOS",
		windows: "Windows · próximamente",
		terminalIntro:
			"O en la Terminal: el comando descarga el archivo y abre el instalador de Claude Desktop.",
		conferenciaTitulo: "Comprobar la huella digital (opcional)",
		emBreve: "Próximamente. Sigue en GitHub.",
		github: "Ver en GitHub",
	},
	rodape: {
		tagline: "Google Ads en el chat de Claude. Local, open source y sin costo.",
		produto: "Producto",
		documentacao: "Documentación",
		projeto: "Proyecto",
		baixar: "Descargar",
		novidades: "Novedades de versión",
		releases: "Releases en GitHub",
		instalacao: "Instalación",
		configuracao: "Configuración",
		uso: "Uso",
		limites: "Límites",
		solucao: "Solución de problemas",
		github: "GitHub",
		seguranca: "Seguridad",
		contribuir: "Cómo contribuir",
		conduta: "Código de conducta",
		licenca: "Open source bajo licencia",
		feitoPor: "Hecho por",
	},
};

const BLOCOS: Record<LocaleId, Bloco> = { root: PT, en: EN, es: ES };

export function traducoes(locale: LocaleId): Bloco {
	return BLOCOS[locale];
}

export function linksCabecalho(locale: LocaleId): LinkNav[] {
	const t = traducoes(locale).nav;
	return [
		{ texto: t.inicio, href: pathComLocale(locale, "/") },
		{ texto: t.baixar, href: pathComLocale(locale, "/#baixar") },
		{ texto: t.instalacao, href: pathComLocale(locale, "/docs/instalacao/") },
		{ texto: t.configuracao, href: pathComLocale(locale, "/docs/configuracao/") },
		{ texto: t.uso, href: pathComLocale(locale, "/docs/uso/") },
		{ texto: t.novidades, href: pathComLocale(locale, "/novidades/") },
	];
}
