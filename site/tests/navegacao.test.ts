import { describe, expect, test } from "bun:test";
import { linkAtivo } from "../scripts/navegacao.ts";

describe("navegação do header", () => {
	test("início e baixar só na landing", () => {
		expect(linkAtivo("/", "/")).toBe(true);
		expect(linkAtivo("/", "/docs/uso/")).toBe(false);
		expect(linkAtivo("/#baixar", "/")).toBe(true);
		expect(linkAtivo("/#baixar", "/docs/instalacao/")).toBe(false);
	});

	test("páginas de docs", () => {
		expect(linkAtivo("/docs/uso/", "/docs/uso/")).toBe(true);
		expect(linkAtivo("/docs/instalacao/", "/docs/configuracao/")).toBe(false);
	});
});
