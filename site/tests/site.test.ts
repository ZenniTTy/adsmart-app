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
import { urlDownload } from "../scripts/conteudo.ts";
import { GTM_ID } from "../scripts/gtm.ts";

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
	const preLancamento = join(TEMPORARIO, "CHANGELOG-pre.md");
	writeFileSync(preLancamento, "# Changelog\n\n## [Não lançado]\n\n- Em desenvolvimento.\n");
	construir(ANTES, preLancamento);
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
		expect(html).not.toContain("releases/latest/download/adsmart-");
	});

	test("depois do lançamento: botão, comando que só baixa e abre, e conferência", () => {
		const html = readFileSync(join(DEPOIS, "index.html"), "utf8");
		expect(html).not.toContain("data-em-breve");
		const url = urlDownload("0.1.0");
		expect(html).toContain(`href="${url}"`);
		expect(html).toContain("v0.1.0");
		expect(html).toContain("open ~/Downloads/adsmart-0.1.0.mcpb");
		expect(html).toContain("shasum -a 256 -c adsmart-0.1.0.mcpb.sha256");
		expect(html).not.toMatch(/\|\s*(sh|bash|zsh)\b/);
	});

	test("landing tem GitHub, só macOS e o aviso de extensão não verificada", () => {
		const html = readFileSync(join(ANTES, "index.html"), "utf8");
		expect(html).toContain("https://github.com/ZenniTTy/adsmart-app");
		expect(html).toContain("macOS");
		expect(html).toContain("não foi verificada pela Anthropic");
	});

	test("header traz links principais na landing e nas docs", () => {
		for (const html of [
			readFileSync(join(DEPOIS, "index.html"), "utf8"),
			readFileSync(join(DEPOIS, "docs", "instalacao", "index.html"), "utf8"),
		]) {
			expect(html).toContain('aria-label="Principal"');
			expect(html).toContain('href="/docs/configuracao/"');
			expect(html).toContain('href="/novidades/"');
			expect(html).toContain('href="/#baixar"');
		}
	});
});

describe("SITE-03 documentação navegável e buscável", () => {
	test("docs mostram título, busca e menu", () => {
		const html = readFileSync(join(ANTES, "docs", "instalacao", "index.html"), "utf8");
		expect(html).toContain("site-title");
		expect(html).toContain("site-search");
		expect(html).toMatch(/<nav[^>]*class="[^"]*sidebar/);
		expect(html).toContain('href="/docs/uso/"');
		expect(html).toContain("Feito por");
		expect(html).toContain('href="https://github.com/ZenniTTy"');
	});

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

const GTM_NS = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;

describe("SITE-05 site estático e Tag Manager", () => {
	test("só o Google Tag Manager como recurso externo de script ou iframe", () => {
		const externos = paginasHtml(ANTES).flatMap((pagina) =>
			[
				...readFileSync(pagina, "utf8").matchAll(
					/<(script|link|img|iframe)\b[^>]*?(?:src|href)="(https?:\/\/[^"]+)"[^>]*>/g,
				),
			]
				.filter(([tag]) => !/rel="(canonical|me|sitemap)"/.test(tag))
				.map(([, , url]) => url),
		);
		expect(new Set(externos)).toEqual(new Set([GTM_NS]));
	});

	test("script inline carrega gtm.js do container oficial", () => {
		const html = readFileSync(join(ANTES, "index.html"), "utf8");
		expect(html).toContain("googletagmanager.com/gtm.js?id=");
		expect(html).toContain(GTM_ID);
	});

	test("sem analytics da Vercel", () => {
		for (const pagina of paginasHtml(ANTES)) {
			expect(readFileSync(pagina, "utf8")).not.toMatch(/vercel-insights|va\.vercel-scripts/);
		}
	});

	test("Google Tag Manager em todas as páginas", () => {
		for (const pagina of paginasHtml(ANTES)) {
			const html = readFileSync(pagina, "utf8");
			expect(html).toContain(GTM_ID);
			expect(html).toContain("googletagmanager.com/gtm.js");
			expect(html).toContain("googletagmanager.com/ns.html");
		}
	});
});

describe("SEO-01 metadados por página", () => {
	test("cada página tem descrição própria, canonical no domínio sem www e imagem social", () => {
		const descricoes = new Set<string>();
		for (const pagina of paginasHtml(ANTES).filter((p) => !p.endsWith("404.html"))) {
			const html = readFileSync(pagina, "utf8");
			const descricao = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
			expect(descricao).toBeDefined();
			descricoes.add(descricao ?? "");
			expect(html).toMatch(/<link rel="canonical" href="https:\/\/adsmart\.digital\//);
			expect(html).toContain('property="og:image" content="https://adsmart.digital/og.png"');
		}
		expect(descricoes.size).toBe(paginasHtml(ANTES).length - 1);
	});

	test("a landing tem título próprio, sem repetir o nome", () => {
		const html = readFileSync(join(ANTES, "index.html"), "utf8");
		expect(html).toContain("<title>AdSmart · Google Ads pelo chat do Claude</title>");
	});
});

describe("SEO-02 rastreamento", () => {
	test("robots.txt libera tudo e aponta o sitemap", () => {
		const robots = readFileSync(join(ANTES, "robots.txt"), "utf8");
		expect(robots).toContain("Allow: /");
		expect(robots).toContain("Sitemap: https://adsmart.digital/sitemap-index.xml");
	});

	test("sitemap só com endereços do domínio oficial", () => {
		const sitemap = readFileSync(join(ANTES, "sitemap-0.xml"), "utf8");
		const enderecos = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? "");
		expect(enderecos.length).toBeGreaterThanOrEqual(7);
		expect(enderecos.every((e) => e.startsWith("https://adsmart.digital/"))).toBe(true);
	});
});

describe("SEO-03 dados estruturados", () => {
	function dados(dir: string): { "@graph": Record<string, unknown>[] } {
		const html = readFileSync(join(dir, "index.html"), "utf8");
		const json = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/)?.[1];
		return JSON.parse(json ?? "{}");
	}

	test("app gratuito para macOS, sem avaliações inventadas", () => {
		const app = dados(ANTES)["@graph"].find((item) => item["@type"] === "SoftwareApplication");
		expect(app?.operatingSystem).toBe("macOS");
		expect(app?.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "BRL" });
		expect(app).not.toHaveProperty("aggregateRating");
		expect(app).not.toHaveProperty("softwareVersion");
		expect(app?.author).toEqual({
			"@type": "Person",
			name: "ZenniTTy",
			url: "https://github.com/ZenniTTy",
		});
	});

	test("depois do lançamento: versão e link de download", () => {
		const app = dados(DEPOIS)["@graph"].find((item) => item["@type"] === "SoftwareApplication");
		expect(app?.softwareVersion).toBe("0.1.0");
		expect(app?.downloadUrl).toBe(urlDownload("0.1.0"));
	});
});

describe("SITE-08 Windows em breve", () => {
	test("antes e depois do lançamento, Windows aparece desativado", () => {
		for (const dir of [ANTES, DEPOIS]) {
			const html = readFileSync(join(dir, "index.html"), "utf8");
			expect(html).toMatch(/aria-disabled="true"[^>]*data-windows[^>]*>\s*Windows · em breve/);
		}
	});
});
