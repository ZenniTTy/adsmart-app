import type { LocaleId } from "./locale.ts";
import { pathComLocale } from "./locale.ts";
import { type LinkNav, linksCabecalho } from "./traducoes.ts";

export type { LinkNav };

export function linkAtivo(href: string, pathname: string, locale: LocaleId): boolean {
	const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
	if (href.startsWith("/#")) {
		const inicio = pathComLocale(locale, "/");
		const inicioNorm = inicio.endsWith("/") ? inicio : `${inicio}/`;
		return path === inicioNorm;
	}
	const alvo = href.endsWith("/") ? href : `${href}/`;
	const inicio = pathComLocale(locale, "/");
	const inicioNorm = inicio.endsWith("/") ? inicio : `${inicio}/`;
	if (alvo === inicioNorm) {
		return path === inicioNorm;
	}
	return path === alvo || path.startsWith(alvo);
}

export { linksCabecalho };
