export type LinkNav = { texto: string; href: string };

export const LINKS_CABECALHO: LinkNav[] = [
	{ texto: "Início", href: "/" },
	{ texto: "Baixar", href: "/#baixar" },
	{ texto: "Instalação", href: "/docs/instalacao/" },
	{ texto: "Configuração", href: "/docs/configuracao/" },
	{ texto: "Uso", href: "/docs/uso/" },
	{ texto: "Novidades", href: "/novidades/" },
];

export function linkAtivo(href: string, pathname: string): boolean {
	if (href === "/") {
		return pathname === "/" || pathname === "";
	}
	if (href.startsWith("/#")) {
		return pathname === "/";
	}
	return pathname === href || pathname.startsWith(`${href.replace(/\/$/, "")}/`);
}
