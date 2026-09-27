import { describe, expect, test } from "bun:test";
import type { Item } from "../../src/changes/items.js";
import { buildChange, type Names, readCurrent } from "../../src/changes/kinds.js";

const CID = "1234567890";

const NAMES: Names = {
	campaign: "Black Friday",
	adGroup: "Faxina residencial",
	keyword: { text: "faxina", matchType: "EXACT" },
};

function describeWith(item: Item, names: Names, value: string | null = "ENABLED"): string {
	return buildChange(item, CID, { value, campaignId: "111", budgetResource: "b", names }, "BRL")
		.descricao;
}

describe("NOM-01 campanha com nome e ID", () => {
	test.each<[Item, string]>([
		[
			{ tipo: "orcamento", campanha_id: "111", valor: 90 },
			'Orçamento diário da campanha "Black Friday" (111)',
		],
		[
			{ tipo: "status_campanha", campanha_id: "111", novo_status: "PAUSADO" },
			'Status da campanha "Black Friday" (111)',
		],
		[
			{
				tipo: "adicionar_negativa_campanha",
				campanha_id: "111",
				texto: "vaga",
				correspondencia: "EXATA",
			},
			'Nova negativa "vaga" (correspondência exata) na campanha "Black Friday" (111)',
		],
	])("%p", (item, expected) => {
		expect(describeWith(item, NAMES, "100000000")).toBe(expected);
	});
});

describe("NOM-02 grupo com nome e ID; anúncio pelo ID e pelo grupo", () => {
	test.each<[Item, string]>([
		[
			{ tipo: "status_grupo", grupo_id: "222", novo_status: "PAUSADO" },
			'Status do grupo "Faxina residencial" (222)',
		],
		[
			{ tipo: "lance_grupo", grupo_id: "222", valor: 2 },
			'Lance máximo de CPC do grupo "Faxina residencial" (222)',
		],
		[
			{ tipo: "status_anuncio", grupo_id: "222", anuncio_id: "333", novo_status: "PAUSADO" },
			'Status do anúncio 333 do grupo "Faxina residencial" (222)',
		],
		[
			{
				tipo: "editar_rsa",
				grupo_id: "222",
				anuncio_id: "333",
				titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
				descricoes: [{ texto: "d" }, { texto: "e" }],
			},
			'Títulos e descrições do anúncio 333 do grupo "Faxina residencial" (222)',
		],
		[
			{
				tipo: "adicionar_palavra_chave",
				grupo_id: "222",
				texto: "diarista",
				correspondencia: "FRASE",
			},
			'Nova palavra-chave "diarista" (correspondência de frase) no grupo "Faxina residencial" (222)',
		],
		[
			{
				tipo: "adicionar_negativa_grupo",
				grupo_id: "222",
				texto: "vaga",
				correspondencia: "AMPLA",
			},
			'Nova negativa "vaga" (correspondência ampla) no grupo "Faxina residencial" (222)',
		],
	])("%p", (item, expected) => {
		expect(describeWith(item, NAMES, null)).toBe(expected);
	});
});

describe("NOM-03 palavra-chave pelo texto e pela correspondência", () => {
	test.each<[Item, string]>([
		[
			{ tipo: "status_palavra_chave", grupo_id: "222", criterio_id: "444", novo_status: "PAUSADO" },
			'Status da palavra-chave "faxina" (444, correspondência exata)',
		],
		[
			{ tipo: "lance_palavra_chave", grupo_id: "222", criterio_id: "444", valor: 2 },
			'Lance máximo de CPC da palavra-chave "faxina" (444, correspondência exata)',
		],
		[
			{ tipo: "remover_palavra_chave", grupo_id: "222", criterio_id: "444" },
			'Remover a palavra-chave "faxina" (444, correspondência exata)',
		],
		[
			{ tipo: "remover_negativa_grupo", grupo_id: "222", criterio_id: "444" },
			'Remover a negativa "faxina" (444, correspondência exata)',
		],
		[
			{ tipo: "remover_negativa_campanha", campanha_id: "111", criterio_id: "444" },
			'Remover a negativa "faxina" (444, correspondência exata)',
		],
	])("%p", (item, expected) => {
		expect(describeWith(item, NAMES)).toBe(expected);
	});

	test("correspondência desconhecida aparece só com o texto", () => {
		expect(
			describeWith(
				{ tipo: "remover_palavra_chave", grupo_id: "222", criterio_id: "444" },
				{ keyword: { text: "faxina", matchType: "UNKNOWN" } },
			),
		).toBe('Remover a palavra-chave "faxina" (444)');
	});
});

describe("NOM-05 sem nome, a descrição cai no formato só com ID", () => {
	test.each<[Item, Names, string]>([
		[{ tipo: "orcamento", campanha_id: "111", valor: 90 }, {}, "Orçamento diário da campanha 111"],
		[
			{ tipo: "status_grupo", grupo_id: "222", novo_status: "PAUSADO" },
			{ adGroup: "" },
			"Status do grupo 222",
		],
		[
			{ tipo: "status_anuncio", grupo_id: "222", anuncio_id: "333", novo_status: "PAUSADO" },
			{},
			"Status do anúncio 333 do grupo 222",
		],
		[
			{ tipo: "status_palavra_chave", grupo_id: "222", criterio_id: "444", novo_status: "PAUSADO" },
			{ keyword: { text: "", matchType: "EXACT" } },
			"Status da palavra-chave 444",
		],
	])("%p", (item, names, expected) => {
		expect(describeWith(item, names, "100000000")).toBe(expected);
	});
});

describe("NOM-06 nome com caracteres especiais", () => {
	test("aparece como está", () => {
		expect(
			describeWith(
				{ tipo: "status_campanha", campanha_id: "111", novo_status: "PAUSADO" },
				{ campaign: `Promo "Verão" 50% \\ ação` },
			),
		).toBe(`Status da campanha "Promo "Verão" 50% \\ ação" (111)`);
	});

	test("nome lido não entra em nenhuma consulta seguinte", async () => {
		const queries: string[] = [];
		const hostile = "x' OR '1'='1";
		await readCurrent(
			{
				tipo: "adicionar_palavra_chave",
				grupo_id: "222",
				texto: "faxina",
				correspondencia: "EXATA",
			},
			async (query) => {
				queries.push(query);
				return queries.length === 1
					? [{ campaign: { id: "111", name: hostile }, adGroup: { name: hostile } }]
					: [];
			},
		);
		expect(queries).toHaveLength(2);
		expect(queries.some((q) => q.includes(hostile))).toBe(false);
	});

	test("o corpo da operação não muda com o nome", () => {
		const item: Item = { tipo: "status_campanha", campanha_id: "111", novo_status: "PAUSADO" };
		const withName = buildChange(
			item,
			CID,
			{ value: "ENABLED", campaignId: "111", names: NAMES },
			"BRL",
		);
		const withoutName = buildChange(
			item,
			CID,
			{ value: "ENABLED", campaignId: "111", names: {} },
			"BRL",
		);
		expect(withName.operation).toEqual(withoutName.operation);
	});
});

describe("NOM-04 e NOM-08 nomes selecionados na mesma consulta do valor atual", () => {
	const cases: Array<[Item, string[], Record<string, unknown>, Names]> = [
		[
			{ tipo: "orcamento", campanha_id: "111", valor: 1 },
			["campaign.name"],
			{
				campaign: { id: "111", name: "Black Friday" },
				campaignBudget: { resourceName: "b", amountMicros: "1" },
			},
			{ campaign: "Black Friday" },
		],
		[
			{ tipo: "status_campanha", campanha_id: "111", novo_status: "ATIVO" },
			["campaign.name"],
			{ campaign: { id: "111", name: "Black Friday", status: "PAUSED" } },
			{ campaign: "Black Friday" },
		],
		[
			{ tipo: "lance_grupo", grupo_id: "222", valor: 1 },
			["campaign.name", "ad_group.name"],
			{ campaign: { id: "111", name: "Black Friday" }, adGroup: { name: "Faxina residencial" } },
			{ campaign: "Black Friday", adGroup: "Faxina residencial" },
		],
		[
			{ tipo: "status_anuncio", grupo_id: "222", anuncio_id: "333", novo_status: "PAUSADO" },
			["campaign.name", "ad_group.name"],
			{
				campaign: { id: "111", name: "Black Friday" },
				adGroup: { name: "Faxina residencial" },
				adGroupAd: { status: "ENABLED" },
			},
			{ campaign: "Black Friday", adGroup: "Faxina residencial" },
		],
		[
			{ tipo: "status_palavra_chave", grupo_id: "222", criterio_id: "444", novo_status: "PAUSADO" },
			[
				"campaign.name",
				"ad_group.name",
				"ad_group_criterion.keyword.text",
				"ad_group_criterion.keyword.match_type",
			],
			{
				campaign: { id: "111", name: "Black Friday" },
				adGroup: { name: "Faxina residencial" },
				adGroupCriterion: { status: "ENABLED", keyword: { text: "faxina", matchType: "EXACT" } },
			},
			NAMES,
		],
		[
			{ tipo: "remover_negativa_campanha", campanha_id: "111", criterio_id: "444" },
			["campaign.name", "campaign_criterion.keyword.text", "campaign_criterion.keyword.match_type"],
			{
				campaign: { id: "111", name: "Black Friday" },
				campaignCriterion: { keyword: { text: "faxina", matchType: "EXACT" } },
			},
			{ campaign: "Black Friday", keyword: { text: "faxina", matchType: "EXACT" } },
		],
		[
			{
				tipo: "adicionar_negativa_campanha",
				campanha_id: "111",
				texto: "vaga",
				correspondencia: "EXATA",
			},
			["campaign.name"],
			{ campaign: { id: "111", name: "Black Friday" } },
			{ campaign: "Black Friday" },
		],
	];

	test.each(cases)("%p", async (item, fields, row, names) => {
		const queries: string[] = [];
		const result = await readCurrent(item, async (query) => {
			queries.push(query);
			return queries.length === 1 ? [row] : [];
		});
		const select = queries[0]?.split(" FROM ")[0] ?? "";
		for (const field of fields) {
			expect(select).toContain(field);
		}
		expect(result.names).toEqual(names);
	});
});
