import { describe, expect, test } from "bun:test";
import { itemSchema, itemsSchema, MAX_ITEMS_PER_PLAN } from "../../src/changes/items.js";
import { formatMoney, toMicros } from "../../src/changes/money.js";
import { createPlanStore, PLAN_TTL_MS } from "../../src/changes/plan-store.js";

function firstError(
	value: unknown,
	schema: {
		safeParse(v: unknown): { success: boolean; error?: { issues: Array<{ message: string }> } };
	},
): string {
	const result = schema.safeParse(value);
	return result.success ? "" : (result.error?.issues[0]?.message ?? "");
}

describe("CHG-02 validação na borda", () => {
	test.each([
		[{ tipo: "orcamento", campanha_id: "12a", valor: 10 }, "só dígitos"],
		[{ tipo: "orcamento", campanha_id: "1", valor: 0 }, "maior que zero"],
		[{ tipo: "orcamento", campanha_id: "1", valor: 10.123 }, "2 casas"],
		[
			{ tipo: "adicionar_palavra_chave", grupo_id: "1", texto: "x", correspondencia: "TOTAL" },
			"AMPLA, FRASE ou EXATA",
		],
		[
			{ tipo: "adicionar_palavra_chave", grupo_id: "1", texto: "a'b", correspondencia: "EXATA" },
			"aspas",
		],
		[{ tipo: "status_grupo", grupo_id: "1", novo_status: "LIGADO" }, "ATIVO ou PAUSADO"],
		[
			{
				tipo: "editar_rsa",
				grupo_id: "1",
				anuncio_id: "2",
				titulos: [{ texto: "a" }],
				descricoes: [{ texto: "b" }, { texto: "c" }],
			},
			"pelo menos 3 títulos",
		],
		[
			{
				tipo: "editar_rsa",
				grupo_id: "1",
				anuncio_id: "2",
				titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
				descricoes: [{ texto: "b" }],
			},
			"pelo menos 2 descrições",
		],
		[{ tipo: "algo" }, "Tipo de alteração desconhecido"],
	])("recusa %p", (value, expected) => {
		expect(firstError(value, itemSchema)).toContain(expected);
	});

	test("aceita valor com 2 casas", () => {
		expect(itemSchema.safeParse({ tipo: "lance_grupo", grupo_id: "1", valor: 0.07 }).success).toBe(
			true,
		);
	});
});

describe("CHG-03 limite do plano", () => {
	const item = { tipo: "status_grupo", grupo_id: "1", novo_status: "ATIVO" };

	test("aceita 100 itens", () => {
		expect(
			itemsSchema.safeParse(Array.from({ length: MAX_ITEMS_PER_PLAN }, () => item)).success,
		).toBe(true);
	});

	test("recusa 101 itens e lista vazia", () => {
		expect(
			firstError(
				Array.from({ length: MAX_ITEMS_PER_PLAN + 1 }, () => item),
				itemsSchema,
			),
		).toContain("no máximo 100");
		expect(firstError([], itemsSchema)).toContain("pelo menos uma");
	});
});

describe("PLN-01 plano", () => {
	function store(start = 1000) {
		let now = start;
		let counter = 0;
		const plans = createPlanStore(
			() => now,
			() => `plano-${++counter}`,
		);
		return { plans, advance: (ms: number) => (now += ms) };
	}
	const draft = {
		customerId: "1234567890",
		loginCustomerId: undefined,
		items: [],
		changes: [],
		operations: [],
		undoOf: undefined,
	};

	test("expira em 15 minutos", () => {
		const { plans } = store();
		expect(plans.save(draft).expiresAt).toBe(1000 + PLAN_TTL_MS);
	});

	test("uso único", () => {
		const { plans } = store();
		const plan = plans.save(draft);
		expect(plans.take(plan.id).ok).toBe(true);
		expect(plans.take(plan.id)).toEqual({ ok: false, reason: "usado" });
	});

	test("expirado", () => {
		const { plans, advance } = store();
		const plan = plans.save(draft);
		advance(PLAN_TTL_MS + 1);
		expect(plans.take(plan.id)).toEqual({ ok: false, reason: "expirado" });
	});

	test("inexistente", () => {
		expect(store().plans.take("nao-existe")).toEqual({ ok: false, reason: "inexistente" });
	});

	test("id vem do gerador injetado (randomUUID em produção)", () => {
		const { plans } = store();
		expect(plans.save(draft).id).toBe("plano-1");
	});
});

describe("PRV-01 dinheiro", () => {
	test("conversão para micros sem erro de ponto flutuante", () => {
		expect(toMicros(0.07)).toBe("70000");
		expect(toMicros(12.5)).toBe("12500000");
	});

	test("formatação em outra moeda", () => {
		expect(formatMoney("1500000", "USD").replace(/\s/g, " ")).toBe("US$ 1,50");
	});
});
