import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as z from "zod/v4";
import { MAX_ITEMS_PER_PLAN } from "../../src/changes/items.js";
import { RECENT_CHANGE_DAYS } from "../../src/changes/limites.js";
import { HIGHLIGHT_INCREASE_RATIO } from "../../src/changes/money.js";
import { PLAN_TTL_MS } from "../../src/changes/plan-store.js";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../../src/tools/gaql.js";

const ROOT = join(import.meta.dir, "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const toolNames = z
	.object({ tools: z.array(z.object({ name: z.string() })) })
	.parse(JSON.parse(read("manifest.json")))
	.tools.map((tool) => tool.name);

const pt = (value: number) => value.toLocaleString("pt-BR");

describe("DOC-05 documentação bate com o código", () => {
	test.each(["README.md", "README.en.md"])("%s lista todas as ferramentas", (file) => {
		const text = read(file);
		for (const name of toolNames) {
			expect(text).toContain(`| \`${name}\` |`);
		}
	});

	test("limite de itens por lote", () => {
		expect(read("docs/uso.md")).toContain(`até ${MAX_ITEMS_PER_PLAN} por vez`);
	});

	test("linhas por consulta: padrão e máximo", () => {
		const uso = read("docs/uso.md");
		expect(uso).toContain(`até ${DEFAULT_LIMIT} linhas por padrão`);
		expect(uso).toContain(`no máximo ${pt(MAX_LIMIT)}`);
	});

	test("validade da prévia", () => {
		const minutes = PLAN_TTL_MS / 60_000;
		expect(read("docs/uso.md")).toContain(`${minutes} minutos`);
		expect(read("README.md")).toContain(`A prévia vale por ${minutes} minutos`);
	});

	test("destaque de aumento e janela de alterações recentes", () => {
		const percent = `${Math.round((HIGHLIGHT_INCREASE_RATIO - 1) * 100)}%`;
		const uso = read("docs/uso.md");
		expect(uso).toContain(percent);
		expect(uso).toContain(`${RECENT_CHANGE_DAYS} dias`);
		expect(read("README.md")).toContain(`acima de ${percent}`);
	});
});
