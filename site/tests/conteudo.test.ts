import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	converterAvisos,
	converterLinks,
	extrairTitulo,
	linksComIdioma,
	ORDEM_DOCS,
	paginaDeChangelog,
	paginaDeDoc,
	versaoLancada,
} from "../scripts/conteudo.ts";

const RAIZ = join(import.meta.dir, "..", "..");

describe("SITE-03 conversão de docs/", () => {
	test("o título vem do # e sai do corpo", () => {
		expect(extrairTitulo("# Uso\n\nTexto.")).toEqual({ titulo: "Uso", corpo: "Texto." });
	});

	test("documento sem # é recusado", () => {
		expect(() => extrairTitulo("Texto sem título")).toThrow();
	});

	test("aviso no estilo GitHub vira aviso do Starlight, com todas as linhas", () => {
		const entrada = "> [!TIP]\n> Primeira linha.\n>\n> - item\n\nDepois.";
		expect(converterAvisos(entrada)).toBe(":::tip\nPrimeira linha.\n\n- item\n:::\n\nDepois.");
	});

	test("citação comum não é tocada", () => {
		expect(converterAvisos("> só uma citação")).toBe("> só uma citação");
	});

	test("links entre documentos viram rotas do site, com âncora", () => {
		expect(converterLinks("[passo 3](configuracao.md#3-solicitar-acesso)")).toBe(
			"[passo 3](/docs/configuracao/#3-solicitar-acesso)",
		);
		expect(converterLinks("[guia](instalacao.md)")).toBe("[guia](/docs/instalacao/)");
		expect(converterLinks("[site](https://exemplo.com/a.md)")).toBe(
			"[site](https://exemplo.com/a.md)",
		);
	});

	test("links internos ganham o prefixo do idioma", () => {
		expect(linksComIdioma("[a](/docs/uso/#x) e [b](/novidades/)", "en")).toBe(
			"[a](/en/docs/uso/#x) e [b](/en/novidades/)",
		);
		expect(linksComIdioma("[c](https://exemplo.com/docs/)", "es")).toBe(
			"[c](https://exemplo.com/docs/)",
		);
	});

	test("todo arquivo real de docs/ converte, na ordem do menu", () => {
		const arquivos = readdirSync(join(RAIZ, "docs")).filter((nome) => nome.endsWith(".md"));
		expect(arquivos.map((nome) => nome.replace(/\.md$/, "")).sort()).toEqual(
			[...ORDEM_DOCS].sort(),
		);
		for (const arquivo of arquivos) {
			const pagina = paginaDeDoc(arquivo, readFileSync(join(RAIZ, "docs", arquivo), "utf8"));
			expect(pagina.conteudo).toMatch(
				/^---\ntitle: ".+"\ndescription: ".{80,170}"\nsidebar:\n {2}order: \d\n---\n/,
			);
			expect(pagina.conteudo).not.toContain("[!TIP]");
			expect(pagina.conteudo).not.toMatch(/\]\([a-z0-9-]+\.md/);
		}
	});
});

describe("SITE-04 versão e changelog", () => {
	test("sem versão lançada, só [Não lançado]", () => {
		expect(versaoLancada("# Changelog\n\n## [Não lançado]\n\n- item")).toBeNull();
	});

	test("pré-lançamento não conta como versão lançada", () => {
		expect(versaoLancada("# Changelog\n\n## [0.1.0-rc.2] - 2026-10-01\n")).toBeNull();
	});

	test("a primeira versão numerada é a lançada", () => {
		expect(
			versaoLancada(
				"# Changelog\n\n## [Não lançado]\n\n## [0.2.0] - 2026-11-01\n\n## [0.1.0] - 2026-10-01",
			),
		).toBe("0.2.0");
	});

	test("a página de novidades usa o CHANGELOG real, sem o título original", () => {
		const pagina = paginaDeChangelog(readFileSync(join(RAIZ, "CHANGELOG.md"), "utf8"));
		expect(pagina.slug).toBe("novidades");
		expect(pagina.conteudo).toContain('title: "Versões e novidades"');
		expect(pagina.conteudo).toContain("## [Não lançado]");
		expect(pagina.conteudo).not.toContain("# Changelog");
	});
});
