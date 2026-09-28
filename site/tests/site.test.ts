import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOWNLOAD_URL } from "../scripts/conteudo.ts";

const SITE = join(import.meta.dir, "..");
const TEMPORARIO = mkdtempSync(join(tmpdir(), "adsmart-site-"));
const ANTES = join(TEMPORARIO, "antes");
const DEPOIS = join(TEMPORARIO, "depois");

function construir(saida: string, changelog?: string): void {
	const env = { ...process.env, ...(changelog ? { CHANGELOG_ARQUIVO: changelog } : {}) };
	for (const [comando, args] of [
		["bun", ["scripts/gerar-conteudo.ts"]],
		["bunx", ["astro", "build", "--outDir", saida]],
	] as const) {
		const resultado = spawnSync(comando, [...args], { cwd: SITE, env, encoding: "utf8" });
		if (resultado.status !== 0) {
			throw new Error(`Falhou: ${comando} ${args.join(" ")}\n${resultado.stderr}`);
		}
	}
}

function paginasHtml(dir: string): string[] {
	return readdirSync(dir).flatMap((nome) => {
		const caminho = join(dir, nome);
		if (statSync(caminho).isDirectory()) {
			return nome === "pagefind" || nome === "_astro" ? [] : paginasHtml(caminho);
		}
		return nome.endsWith(".html") ? [caminho] : [];
	});
}

beforeAll(() => {
	construir(ANTES);
	const fixture = join(TEMPORARIO, "CHANGELOG.md");
	writeFileSync(
		fixture,
		"# Changelog\n\n## [Não lançado]\n\n## [0.1.0] - 2026-10-01\n\n- Primeira versão.\n",
	);
	construir(DEPOIS, fixture);
	construir(join(SITE, "dist"));
}, 120_000);

afterAll(() => {
	rmSync(TEMPORARIO, { recursive: true, force: true });
});

describe("SITE-02 landing e download", () => {
	test("antes do lançamento: em breve, sem link de download", () => {
		const html = readFileSync(join(ANTES, "index.html"), "utf8");
		expect(html).toContain("data-em-breve");
		expect(html).not.toContain(DOWNLOAD_URL);
	});

	test("depois do lançamento: botão, comando que só baixa e abre, e conferência", () => {
		const html = readFileSync(join(DEPOIS, "index.html"), "utf8");
		expect(html).not.toContain("data-em-breve");
		expect(html).toContain(`href="${DOWNLOAD_URL}"`);
		expect(html).toContain("v0.1.0");
		expect(html).toContain("open ~/Downloads/adsmart.mcpb");
		expect(html).toContain("shasum -a 256 -c");
		expect(html).not.toMatch(/\|\s*(sh|bash|zsh)\b/);
	});

	test("landing tem GitHub, só macOS e o aviso de extensão não verificada", () => {
		const html = readFileSync(join(ANTES, "index.html"), "utf8");
		expect(html).toContain("https://github.com/ZenniTTy/adsmart-app");
		expect(html).toContain("macOS");
		expect(html).toContain("não foi verificada pela Anthropic");
	});
});

describe("SITE-03 documentação navegável e buscável", () => {
	test("toda página de docs/ existe no site", () => {
		for (const slug of ["instalacao", "configuracao", "uso", "limites", "solucao-de-problemas"]) {
			expect(existsSync(join(ANTES, "docs", slug, "index.html"))).toBe(true);
		}
	});

	test("todo link interno aponta para página e âncora que existem", () => {
		const quebrados: string[] = [];
		let conferidos = 0;
		for (const pagina of paginasHtml(ANTES)) {
			const html = readFileSync(pagina, "utf8");
			for (const [, caminho, ancora] of html.matchAll(/href="(\/[^"#]*?)(?:#([^"]*))?"/g)) {
				if (!caminho || caminho.startsWith("/_astro") || caminho.startsWith("/pagefind")) {
					continue;
				}
				conferidos++;
				const alvo = join(ANTES, caminho, caminho.endsWith("/") ? "index.html" : "");
				if (!existsSync(alvo)) {
					quebrados.push(`${caminho} (em ${pagina})`);
					continue;
				}
				if (ancora && statSync(alvo).isFile()) {
					const destino = readFileSync(alvo, "utf8");
					if (!destino.includes(`id="${decodeURIComponent(ancora)}"`)) {
						quebrados.push(`${caminho}#${ancora}`);
					}
				}
			}
		}
		expect(conferidos).toBeGreaterThanOrEqual(50);
		expect(quebrados).toEqual([]);
	});

	test("índice de busca local com todas as páginas de conteúdo", () => {
		const entrada = JSON.parse(
			readFileSync(join(ANTES, "pagefind", "pagefind-entry.json"), "utf8"),
		) as {
			languages: Record<string, { page_count: number }>;
		};
		expect(entrada.languages["pt-br"]?.page_count).toBeGreaterThanOrEqual(7);
	});
});

describe("SITE-04 versão e changelog", () => {
	test("página de novidades gerada do CHANGELOG", () => {
		const html = readFileSync(join(ANTES, "novidades", "index.html"), "utf8");
		expect(html).toContain("Versões e novidades");
		expect(html).toContain("Não lançado");
	});
});

describe("SITE-05 sem coleta de dados nem recursos externos", () => {
	test("nenhum script, estilo, fonte ou preconnect de outro domínio", () => {
		const externos = paginasHtml(ANTES).flatMap((pagina) =>
			[
				...readFileSync(pagina, "utf8").matchAll(
					/<(script|link|img|iframe)\b[^>]*?(?:src|href)="(https?:\/\/[^"]+)"[^>]*>/g,
				),
			]
				.filter(([tag]) => !/rel="(canonical|me|sitemap)"/.test(tag))
				.map(([, , url]) => url),
		);
		expect(externos).toEqual([]);
	});

	test("nenhum script de analytics", () => {
		for (const pagina of paginasHtml(ANTES)) {
			expect(readFileSync(pagina, "utf8")).not.toMatch(
				/vercel-insights|va\.vercel-scripts|googletagmanager|gtag\(/,
			);
		}
	});
});
