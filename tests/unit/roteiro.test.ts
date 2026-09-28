import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadConfig } from "../../src/config.js";
import {
	coworkPrompt,
	guideStep,
	SETUP_GUIDE,
	type StepKey,
	USER_ACTION_LABEL,
} from "../../src/setup/roteiro.js";

const ROOT = join(import.meta.dir, "..", "..");
const GUIDE = readFileSync(join(ROOT, "docs", "configuracao.md"), "utf8");

function filesUnder(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? filesUnder(path) : [path];
	});
}

function anchorOf(heading: string): string {
	return heading
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s/g, "-");
}

const guideHeadings = [...GUIDE.matchAll(/^## (.+)$/gm)].map((match) => match[1] ?? "");

describe("GUI-02 roteiro e guia escrito não divergem", () => {
	test("cada passo tem o mesmo número e título de um `## N. título` do guia", () => {
		const numbered = guideHeadings.filter((heading) => /^\d+\. /.test(heading));
		expect(SETUP_GUIDE.passos.map((passo) => `${passo.numero}. ${passo.titulo}`)).toEqual(numbered);
	});

	test("todo link do roteiro aparece no guia", () => {
		for (const passo of SETUP_GUIDE.passos) {
			if (passo.link) {
				expect(GUIDE).toContain(passo.link);
			}
		}
	});

	test("toda âncora configuracao.md#... citada em docs/ existe no guia", () => {
		const anchors = new Set(guideHeadings.map(anchorOf));
		const broken = filesUnder(join(ROOT, "docs")).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/configuracao\.md#([^)\s]+)/g)]
				.map((match) => match[1] ?? "")
				.filter((anchor) => !anchors.has(decodeURIComponent(anchor)))
				.map((anchor) => `${relative(ROOT, file)}#${anchor}`),
		);
		expect(broken).toEqual([]);
	});
});

describe("GUI-04 regras fixas", () => {
	const rules = SETUP_GUIDE.regras.join(" ");

	test("a chave nunca passa pelo Claude", () => {
		expect(rules).toContain("A chave nunca passa pelo Claude");
		expect(rules).toContain("downloads");
	});

	test("o Claude nunca concede acesso a contas", () => {
		expect(rules).toContain("nunca concede acesso");
	});

	test("login, verificação em duas etapas, passkey e termos são sempre do usuário", () => {
		expect(rules).toMatch(/login.*duas etapas.*passkey.*termos/i);
	});
});

describe("GUI-05 passagem de bastão e modos", () => {
	const actionsOf = (key: StepKey) =>
		SETUP_GUIDE.passos.find((passo) => passo.chave === key)?.acoes ?? [];
	const byUser = (key: StepKey, fragment: string) =>
		actionsOf(key).some((acao) => acao.quem === "voce" && acao.texto.includes(fragment));

	test("pré-requisitos (login, 2FA, passkey) são do usuário", () => {
		expect(SETUP_GUIDE.antes_de_comecar.every((item) => item.quem === "voce")).toBe(true);
		expect(SETUP_GUIDE.antes_de_comecar.map((item) => item.texto).join(" ")).toMatch(
			/duas etapas.*passkey/,
		);
	});

	test.each<[StepKey, string]>([
		["projeto", "Termos de Serviço"],
		["explorer", "termos"],
		["conta_servico", "Criar"],
		["conta_servico", "Guardar o arquivo"],
		["acesso", "Adicionar conta"],
		["extensao", "Selecionar o arquivo"],
	])("passo %s: ação '%s' é do usuário", (key, fragment) => {
		expect(byUser(key, fragment)).toBe(true);
	});

	test("o passo de acesso no Google Ads é inteiramente do usuário", () => {
		expect(actionsOf("acesso").every((acao) => acao.quem === "voce")).toBe(true);
	});

	test("modos navegador e manual descritos", () => {
		expect(SETUP_GUIDE.modos.navegador).toContain("Claude in Chrome");
		expect(SETUP_GUIDE.modos.manual).toContain("a pessoa");
	});
});

describe("GUI-06 números de passo vêm do roteiro", () => {
	test("guideStep usa o número e o título do roteiro", () => {
		const acesso = SETUP_GUIDE.passos.find((passo) => passo.chave === "acesso");
		expect(guideStep("acesso")).toBe(`passo ${acesso?.numero} do guia de configuração`);
	});

	test("nenhum arquivo de src/ fora do roteiro escreve 'passo N' à mão", () => {
		const offenders = filesUnder(join(ROOT, "src"))
			.filter((file) => !file.endsWith(join("setup", "roteiro.ts")))
			.filter((file) => /passo \d/i.test(readFileSync(file, "utf8")))
			.map((file) => relative(ROOT, file));
		expect(offenders).toEqual([]);
	});

	test("mensagem de chave ausente cita o passo da extensão e o guia_configuracao", () => {
		const result = loadConfig({});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain(guideStep("extensao"));
			expect(result.message).toContain("guia_configuracao");
		}
	});
});

describe("GUI-08 roteiro em pt-BR", () => {
	const texts = [
		...SETUP_GUIDE.antes_de_comecar.map((item) => item.texto),
		...SETUP_GUIDE.passos.flatMap((passo) => [
			passo.titulo,
			passo.como_saber,
			passo.retomada,
			...passo.acoes.map((acao) => acao.texto),
		]),
		...SETUP_GUIDE.regras,
		SETUP_GUIDE.modos.navegador,
		SETUP_GUIDE.modos.manual,
		SETUP_GUIDE.modos.cowork,
		...SETUP_GUIDE.regras_cowork,
		SETUP_GUIDE.depois,
		...coworkPrompt(SETUP_GUIDE).split("\n"),
	];
	const englishMarkers = /\b(the|your|with|and|for|this|file|account|key|click|open)\b/i;

	test.each(texts.filter((text) => text.trim()))("%p não tem marcadores de inglês", (text) => {
		expect(text).not.toMatch(englishMarkers);
	});
});

describe("GUI-09 prompt do Cowork gerado do roteiro", () => {
	const prompt = coworkPrompt(SETUP_GUIDE);

	test("cada passo entra com número, título, link e todas as ações", () => {
		for (const passo of SETUP_GUIDE.passos) {
			expect(prompt).toContain(`Passo ${passo.numero} — ${passo.titulo}`);
			if (passo.link) {
				expect(prompt).toContain(passo.link);
			}
			for (const acao of passo.acoes) {
				expect(prompt).toContain(acao.texto);
			}
		}
	});

	test("pré-requisitos, regras gerais e regras do Cowork entram inteiros", () => {
		for (const text of [
			...SETUP_GUIDE.antes_de_comecar.map((item) => item.texto),
			...SETUP_GUIDE.regras,
			...SETUP_GUIDE.regras_cowork,
		]) {
			expect(prompt).toContain(text);
		}
	});

	test("toda ação da pessoa manda parar e esperar", () => {
		const userActions = SETUP_GUIDE.passos.flatMap((passo) =>
			passo.acoes.filter((acao) => acao.quem === "voce"),
		);
		for (const acao of userActions) {
			expect(prompt).toContain(`${USER_ACTION_LABEL} ${acao.texto}`);
		}
	});

	test("mudar um passo numa cópia do roteiro muda o prompt", () => {
		const changed = {
			...SETUP_GUIDE,
			passos: SETUP_GUIDE.passos.map((passo) =>
				passo.chave === "api" ? { ...passo, titulo: "Título alterado no teste" } : passo,
			),
		};
		expect(coworkPrompt(changed)).toContain("Passo 2 — Título alterado no teste");
		expect(coworkPrompt(changed)).not.toContain("Passo 2 — Ativar a Google Ads API");
	});
});

describe("GUI-10 regras próprias do Cowork", () => {
	const rules = SETUP_GUIDE.regras_cowork.join(" ");

	test.each([
		"Manually approve",
		"Skip all approvals",
		"pasta de downloads",
		"não mova",
		"Criar",
		"senhas",
		"voltar ao chat do AdSmart",
	])("cita %p", (fragment) => {
		expect(rules).toContain(fragment);
	});
});

describe("GUI-11 três caminhos", () => {
	test("modos cowork, navegador e manual, com plano pago nos dois primeiros", () => {
		expect(Object.keys(SETUP_GUIDE.modos).sort()).toEqual(["cowork", "manual", "navegador"]);
		expect(SETUP_GUIDE.modos.cowork).toContain("planos pagos");
		expect(SETUP_GUIDE.modos.navegador).toContain("planos pagos");
	});
});
