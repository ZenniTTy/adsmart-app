import { describe, expect, test } from "bun:test";
import { pathComLocale } from "../scripts/locale.ts";
import { linkAtivo } from "../scripts/navegacao.ts";

describe("navegação do header", () => {
	test("início só na landing e âncoras nunca ativas", () => {
		expect(linkAtivo("/", "/", "root")).toBe(true);
		expect(linkAtivo("/", "/docs/uso/", "root")).toBe(false);
		expect(linkAtivo("/#baixar", "/", "root")).toBe(false);
		expect(linkAtivo("/#baixar", "/docs/instalacao/", "root")).toBe(false);
	});

	test("páginas de docs", () => {
		expect(linkAtivo("/docs/uso/", "/docs/uso/", "root")).toBe(true);
		expect(linkAtivo("/docs/instalacao/", "/docs/configuracao/", "root")).toBe(false);
	});

	test("paths com locale", () => {
		expect(pathComLocale("en", "/docs/uso/")).toBe("/en/docs/uso/");
		expect(pathComLocale("en", "/#baixar")).toBe("/en/#baixar");
		expect(linkAtivo("/en/", "/en/", "en")).toBe(true);
	});
});
