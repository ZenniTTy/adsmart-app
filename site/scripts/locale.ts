export type LocaleId = "root" | "en" | "es";

export function localeFromStarlight(id: string | undefined): LocaleId {
	if (id === "en" || id === "es") return id;
	return "root";
}

export function pathComLocale(locale: LocaleId, path: string): string {
	if (path.startsWith("/#")) {
		return locale === "root" ? path : `/${locale}${path}`;
	}
	const limpo = path.startsWith("/") ? path : `/${path}`;
	if (locale === "root") return limpo;
	if (limpo === "/") return `/${locale}/`;
	return `/${locale}${limpo}`;
}
