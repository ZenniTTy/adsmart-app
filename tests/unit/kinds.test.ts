import { describe, expect, test } from "bun:test";
import type { Item } from "../../src/changes/items.js";
import { buildChange, inverseItem, readCurrent } from "../../src/changes/kinds.js";
import type { MutateOperation } from "../../src/google/ads-client.js";

const CID = "1234567890";
const base = `customers/${CID}`;

function current(value: string | null, extra: Record<string, unknown> = {}) {
	return { value, campaignId: "111", names: {}, ...extra };
}

describe("CHG-01 operação por tipo no formato validado na V6", () => {
	const cases: Array<[string, Item, string | null, MutateOperation]> = [
		[
			"orçamento",
			{ tipo: "orcamento", campanha_id: "111", valor: 90 },
			"100000000",
			{
				campaignBudgetOperation: {
					update: { resourceName: `${base}/campaignBudgets/555`, amountMicros: "90000000" },
					updateMask: "amountMicros",
				},
			},
		],
		[
			"status da campanha",
			{ tipo: "status_campanha", campanha_id: "111", novo_status: "PAUSADO" },
			"ENABLED",
			{
				campaignOperation: {
					update: { resourceName: `${base}/campaigns/111`, status: "PAUSED" },
					updateMask: "status",
				},
			},
		],
		[
			"status do grupo",
			{ tipo: "status_grupo", grupo_id: "222", novo_status: "ATIVO" },
			"PAUSED",
			{
				adGroupOperation: {
					update: { resourceName: `${base}/adGroups/222`, status: "ENABLED" },
					updateMask: "status",
				},
			},
		],
		[
			"status do anúncio",
			{ tipo: "status_anuncio", grupo_id: "222", anuncio_id: "333", novo_status: "PAUSADO" },
			"ENABLED",
			{
				adGroupAdOperation: {
					update: { resourceName: `${base}/adGroupAds/222~333`, status: "PAUSED" },
					updateMask: "status",
				},
			},
		],
		[
			"status da palavra-chave",
			{ tipo: "status_palavra_chave", grupo_id: "222", criterio_id: "444", novo_status: "PAUSADO" },
			"ENABLED",
			{
				adGroupCriterionOperation: {
					update: { resourceName: `${base}/adGroupCriteria/222~444`, status: "PAUSED" },
					updateMask: "status",
				},
			},
		],
		[
			"lance do grupo",
			{ tipo: "lance_grupo", grupo_id: "222", valor: 11 },
			"12000000",
			{
				adGroupOperation: {
					update: { resourceName: `${base}/adGroups/222`, cpcBidMicros: "11000000" },
					updateMask: "cpcBidMicros",
				},
			},
		],
		[
			"lance da palavra-chave",
			{ tipo: "lance_palavra_chave", grupo_id: "222", criterio_id: "444", valor: 1.25 },
			"1000000",
			{
				adGroupCriterionOperation: {
					update: { resourceName: `${base}/adGroupCriteria/222~444`, cpcBidMicros: "1250000" },
					updateMask: "cpcBidMicros",
				},
			},
		],
		[
			"nova palavra-chave (SEC-06: nasce ativa)",
			{
				tipo: "adicionar_palavra_chave",
				grupo_id: "222",
				texto: "faxina",
				correspondencia: "EXATA",
			},
			null,
			{
				adGroupCriterionOperation: {
					create: {
						adGroup: `${base}/adGroups/222`,
						status: "ENABLED",
						keyword: { text: "faxina", matchType: "EXACT" },
					},
				},
			},
		],
		[
			"negativa de campanha",
			{
				tipo: "adicionar_negativa_campanha",
				campanha_id: "111",
				texto: "gratis",
				correspondencia: "FRASE",
			},
			null,
			{
				campaignCriterionOperation: {
					create: {
						campaign: `${base}/campaigns/111`,
						negative: true,
						keyword: { text: "gratis", matchType: "PHRASE" },
					},
				},
			},
		],
		[
			"negativa de grupo",
			{
				tipo: "adicionar_negativa_grupo",
				grupo_id: "222",
				texto: "emprego",
				correspondencia: "AMPLA",
			},
			null,
			{
				adGroupCriterionOperation: {
					create: {
						adGroup: `${base}/adGroups/222`,
						negative: true,
						keyword: { text: "emprego", matchType: "BROAD" },
					},
				},
			},
		],
		[
			"remover palavra-chave",
			{ tipo: "remover_palavra_chave", grupo_id: "222", criterio_id: "444" },
			"ENABLED",
			{ adGroupCriterionOperation: { remove: `${base}/adGroupCriteria/222~444` } },
		],
		[
			"remover negativa de campanha",
			{ tipo: "remover_negativa_campanha", campanha_id: "111", criterio_id: "555" },
			"ENABLED",
			{ campaignCriterionOperation: { remove: `${base}/campaignCriteria/111~555` } },
		],
		[
			"editar RSA com fixação",
			{
				tipo: "editar_rsa",
				grupo_id: "222",
				anuncio_id: "333",
				titulos: [{ texto: "A", fixado: 1 }, { texto: "B" }, { texto: "C" }],
				descricoes: [{ texto: "D", fixado: 2 }, { texto: "E" }],
			},
			JSON.stringify({
				titulos: [{ texto: "X" }, { texto: "Y" }, { texto: "Z" }],
				descricoes: [{ texto: "W" }, { texto: "V" }],
			}),
			{
				adOperation: {
					update: {
						resourceName: `${base}/ads/333`,
						responsiveSearchAd: {
							headlines: [{ text: "A", pinnedField: "HEADLINE_1" }, { text: "B" }, { text: "C" }],
							descriptions: [{ text: "D", pinnedField: "DESCRIPTION_2" }, { text: "E" }],
						},
					},
					updateMask: "responsiveSearchAd.headlines,responsiveSearchAd.descriptions",
				},
			},
		],
	];

	test.each(cases)("%s", (_name, item, before, expected) => {
		const change = buildChange(
			item,
			CID,
			current(before, { budgetResource: `${base}/campaignBudgets/555` }),
			"BRL",
		);
		expect(change.operation).toEqual(expected);
	});
});

describe("CHG-04 item sem mudança efetiva", () => {
	test.each<[string, Item, string | null]>([
		["orçamento igual", { tipo: "orcamento", campanha_id: "111", valor: 100 }, "100000000"],
		[
			"status já aplicado",
			{ tipo: "status_grupo", grupo_id: "222", novo_status: "PAUSADO" },
			"PAUSED",
		],
		[
			"palavra-chave já existe",
			{ tipo: "adicionar_palavra_chave", grupo_id: "222", texto: "a", correspondencia: "EXATA" },
			`${base}/adGroupCriteria/222~9`,
		],
		[
			"já removido",
			{ tipo: "remover_palavra_chave", grupo_id: "222", criterio_id: "9" },
			"REMOVED",
		],
	])("%s não gera operação", (_name, item, before) => {
		expect(
			buildChange(item, CID, current(before, { budgetResource: "x" }), "BRL").operation,
		).toBeNull();
	});
});

describe("PRV-01 valores em pt-BR na moeda da conta", () => {
	test("orçamento em reais", () => {
		const change = buildChange(
			{ tipo: "orcamento", campanha_id: "111", valor: 12.5 },
			CID,
			current("10000000", { budgetResource: "x" }),
			"BRL",
		);
		expect(change.antes.replace(/\s/g, " ")).toBe("R$ 10,00");
		expect(change.depois.replace(/\s/g, " ")).toBe("R$ 12,50");
	});

	test("lance sem valor atual", () => {
		const change = buildChange(
			{ tipo: "lance_palavra_chave", grupo_id: "2", criterio_id: "3", valor: 1 },
			CID,
			current(null),
			"BRL",
		);
		expect(change.antes).toBe("sem valor");
	});

	test("status legível", () => {
		const change = buildChange(
			{ tipo: "status_campanha", campanha_id: "1", novo_status: "ATIVO" },
			CID,
			current("PAUSED"),
			"BRL",
		);
		expect([change.antes, change.depois]).toEqual(["pausado", "ativo"]);
	});
});

describe("PRV-03 destaques", () => {
	test("aumento acima de 50%", () => {
		const change = buildChange(
			{ tipo: "orcamento", campanha_id: "1", valor: 151 },
			CID,
			current("100000000", { budgetResource: "x" }),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("acima de 50%");
	});

	test("aumento de exatamente 50% não destaca", () => {
		const change = buildChange(
			{ tipo: "lance_grupo", grupo_id: "2", valor: 15 },
			CID,
			current("10000000"),
			"BRL",
		);
		expect(change.destaques).toEqual([]);
	});

	test("lance sem valor atual destaca", () => {
		const change = buildChange(
			{ tipo: "lance_grupo", grupo_id: "2", valor: 1 },
			CID,
			current(null),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("acima de 50%");
	});

	test("orçamento compartilhado", () => {
		const change = buildChange(
			{ tipo: "orcamento", campanha_id: "1", valor: 90 },
			CID,
			current("100000000", { budgetResource: "x", sharedBudget: true }),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("compartilhado");
	});

	test("remoção irreversível", () => {
		const change = buildChange(
			{ tipo: "remover_negativa_grupo", grupo_id: "2", criterio_id: "3" },
			CID,
			current("ENABLED"),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("irreversível");
	});

	test("RSA volta para revisão", () => {
		const change = buildChange(
			{
				tipo: "editar_rsa",
				grupo_id: "2",
				anuncio_id: "3",
				titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
				descricoes: [{ texto: "d" }, { texto: "e" }],
			},
			CID,
			current(null),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("revisão");
	});

	test("palavra-chave nova avisa que vai rodar", () => {
		const change = buildChange(
			{ tipo: "adicionar_palavra_chave", grupo_id: "2", texto: "a", correspondencia: "EXATA" },
			CID,
			current(null),
			"BRL",
		);
		expect(change.destaques.join(" ")).toContain("nasce ativa");
	});
});

describe("leitura do valor atual", () => {
	test("orçamento lê recurso, valor e compartilhamento", async () => {
		const read = async () => [
			{
				campaign: { id: "111" },
				campaignBudget: { resourceName: "b", amountMicros: "5000000", referenceCount: "2" },
			},
		];
		expect(await readCurrent({ tipo: "orcamento", campanha_id: "111", valor: 1 }, read)).toEqual({
			value: "5000000",
			campaignId: "111",
			budgetResource: "b",
			sharedBudget: true,
			names: {},
		});
	});

	test("item inexistente vira erro pt-BR", async () => {
		const read = async () => [];
		await expect(
			readCurrent({ tipo: "status_grupo", grupo_id: "9", novo_status: "ATIVO" }, read),
		).rejects.toThrow("não foi encontrado");
	});

	test("RSA lido e normalizado com fixação", async () => {
		const read = async () => [
			{
				campaign: { id: "1" },
				adGroupAd: {
					ad: {
						responsiveSearchAd: {
							headlines: [{ text: "A", pinnedField: "HEADLINE_2" }, { text: "B" }],
							descriptions: [{ text: "C" }],
						},
					},
				},
			},
		];
		const result = await readCurrent(
			{
				tipo: "editar_rsa",
				grupo_id: "2",
				anuncio_id: "3",
				titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
				descricoes: [{ texto: "d" }, { texto: "e" }],
			},
			read,
		);
		expect(JSON.parse(result.value ?? "")).toEqual({
			titulos: [{ texto: "A", fixado: 2 }, { texto: "B" }],
			descricoes: [{ texto: "C" }],
		});
	});
});

describe("UND-01 item inverso", () => {
	test("orçamento volta ao valor anterior", () => {
		expect(
			inverseItem({ tipo: "orcamento", campanha_id: "1", valor: 90 }, "100000000", ""),
		).toEqual({
			tipo: "orcamento",
			campanha_id: "1",
			valor: 100,
		});
	});

	test("status volta ao anterior", () => {
		expect(
			inverseItem({ tipo: "status_grupo", grupo_id: "2", novo_status: "PAUSADO" }, "ENABLED", ""),
		).toEqual({
			tipo: "status_grupo",
			grupo_id: "2",
			novo_status: "ATIVO",
		});
	});

	test("palavra-chave criada é desfeita por remoção", () => {
		expect(
			inverseItem(
				{ tipo: "adicionar_palavra_chave", grupo_id: "2", texto: "a", correspondencia: "EXATA" },
				null,
				`${base}/adGroupCriteria/2~77`,
			),
		).toEqual({ tipo: "remover_palavra_chave", grupo_id: "2", criterio_id: "77" });
	});

	test("remoção não tem inverso", () => {
		expect(
			inverseItem(
				{ tipo: "remover_palavra_chave", grupo_id: "2", criterio_id: "3" },
				"ENABLED",
				"",
			),
		).toBeNull();
	});
});

describe("leitura por tipo usa as consultas verificadas na V7", () => {
	const cases: Array<[Item, string, Record<string, unknown>[], string | null]> = [
		[
			{ tipo: "status_campanha", campanha_id: "111", novo_status: "ATIVO" },
			"SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.id = 111",
			[{ campaign: { id: "111", status: "PAUSED" } }],
			"PAUSED",
		],
		[
			{ tipo: "lance_grupo", grupo_id: "222", valor: 1 },
			"SELECT campaign.id, campaign.name, ad_group.name, ad_group.status, ad_group.cpc_bid_micros FROM ad_group WHERE ad_group.id = 222",
			[{ campaign: { id: "111" }, adGroup: { status: "ENABLED", cpcBidMicros: "900000" } }],
			"900000",
		],
		[
			{ tipo: "status_anuncio", grupo_id: "222", anuncio_id: "333", novo_status: "PAUSADO" },
			"SELECT campaign.id, campaign.name, ad_group.name, ad_group_ad.status, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions FROM ad_group_ad WHERE ad_group.id = 222 AND ad_group_ad.ad.id = 333",
			[{ campaign: { id: "111" }, adGroupAd: { status: "ENABLED" } }],
			"ENABLED",
		],
		[
			{ tipo: "lance_palavra_chave", grupo_id: "222", criterio_id: "444", valor: 1 },
			"SELECT campaign.id, campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros FROM ad_group_criterion WHERE ad_group.id = 222 AND ad_group_criterion.criterion_id = 444",
			[
				{
					campaign: { id: "111" },
					adGroupCriterion: { status: "ENABLED", cpcBidMicros: "700000" },
				},
			],
			"700000",
		],
		[
			{ tipo: "remover_negativa_campanha", campanha_id: "111", criterio_id: "555" },
			"SELECT campaign.id, campaign.name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type, campaign_criterion.status FROM campaign_criterion WHERE campaign.id = 111 AND campaign_criterion.criterion_id = 555",
			[{ campaign: { id: "111" }, campaignCriterion: {} }],
			"ENABLED",
		],
	];

	test.each(cases)("%p", async (item, expectedQuery, rows, expectedValue) => {
		const queries: string[] = [];
		const result = await readCurrent(item, async (query) => {
			queries.push(query);
			return rows;
		});
		expect(queries[0]).toBe(expectedQuery);
		expect(result.value).toBe(expectedValue);
	});

	test("nova palavra-chave procura duplicata com texto e correspondência", async () => {
		const queries: string[] = [];
		const result = await readCurrent(
			{
				tipo: "adicionar_palavra_chave",
				grupo_id: "222",
				texto: "faxina",
				correspondencia: "FRASE",
			},
			async (query) => {
				queries.push(query);
				return queries.length === 1
					? [{ campaign: { id: "111" }, adGroup: { status: "ENABLED" } }]
					: [];
			},
		);
		expect(queries[1]).toContain("ad_group_criterion.keyword.text = 'faxina'");
		expect(queries[1]).toContain("ad_group_criterion.keyword.match_type = 'PHRASE'");
		expect(queries[1]).toContain("ad_group_criterion.negative = FALSE");
		expect(queries[1]).toContain("ad_group_criterion.status != 'REMOVED'");
		expect(result).toEqual({ value: null, campaignId: "111", names: { adGroup: undefined } });
	});

	test("negativa de grupo procura duplicata negativa", async () => {
		const queries: string[] = [];
		const result = await readCurrent(
			{
				tipo: "adicionar_negativa_grupo",
				grupo_id: "222",
				texto: "vaga",
				correspondencia: "AMPLA",
			},
			async (query) => {
				queries.push(query);
				return queries.length === 1
					? [{ campaign: { id: "111" }, adGroup: {} }]
					: [{ adGroupCriterion: { resourceName: "customers/1234567890/adGroupCriteria/222~8" } }];
			},
		);
		expect(queries[1]).toContain("ad_group_criterion.negative = TRUE");
		expect(queries[1]).toContain("ad_group_criterion.status != 'REMOVED'");
		expect(result.value).toBe("customers/1234567890/adGroupCriteria/222~8");
	});

	test("negativa de campanha procura duplicata na campanha", async () => {
		const queries: string[] = [];
		const result = await readCurrent(
			{
				tipo: "adicionar_negativa_campanha",
				campanha_id: "111",
				texto: "vaga",
				correspondencia: "EXATA",
			},
			async (query) => {
				queries.push(query);
				return queries.length === 1 ? [{ campaign: { id: "111" } }] : [];
			},
		);
		expect(queries[1]).toContain("campaign_criterion.keyword.match_type = 'EXACT'");
		expect(queries[1]).toContain("campaign_criterion.status != 'REMOVED'");
		expect(result).toEqual({ value: null, campaignId: "111", names: {} });
	});

	test("anúncio que não é RSA gera erro pt-BR", async () => {
		await expect(
			readCurrent(
				{
					tipo: "editar_rsa",
					grupo_id: "2",
					anuncio_id: "3",
					titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
					descricoes: [{ texto: "d" }, { texto: "e" }],
				},
				async () => [{ campaign: { id: "1" }, adGroupAd: { status: "ENABLED", ad: {} } }],
			),
		).rejects.toThrow("não é um anúncio responsivo");
	});
});

describe("UND-01 inversos restantes", () => {
	test("lance volta ao anterior", () => {
		expect(
			inverseItem(
				{ tipo: "lance_palavra_chave", grupo_id: "2", criterio_id: "3", valor: 5 },
				"1500000",
				"",
			),
		).toEqual({
			tipo: "lance_palavra_chave",
			grupo_id: "2",
			criterio_id: "3",
			valor: 1.5,
		});
	});

	test("RSA volta à lista anterior", () => {
		const before = JSON.stringify({
			titulos: [{ texto: "X", fixado: 1 }, { texto: "Y" }, { texto: "Z" }],
			descricoes: [{ texto: "W" }, { texto: "V" }],
		});
		const result = inverseItem(
			{
				tipo: "editar_rsa",
				grupo_id: "2",
				anuncio_id: "3",
				titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
				descricoes: [{ texto: "d" }, { texto: "e" }],
			},
			before,
			"",
		);
		expect(result).toEqual({
			tipo: "editar_rsa",
			grupo_id: "2",
			anuncio_id: "3",
			...JSON.parse(before),
		});
	});

	test("negativas criadas viram remoção", () => {
		expect(
			inverseItem(
				{ tipo: "adicionar_negativa_grupo", grupo_id: "2", texto: "a", correspondencia: "EXATA" },
				null,
				"customers/1/adGroupCriteria/2~5",
			),
		).toEqual({ tipo: "remover_negativa_grupo", grupo_id: "2", criterio_id: "5" });
		expect(
			inverseItem(
				{
					tipo: "adicionar_negativa_campanha",
					campanha_id: "1",
					texto: "a",
					correspondencia: "EXATA",
				},
				null,
				"customers/1/campaignCriteria/1~6",
			),
		).toEqual({ tipo: "remover_negativa_campanha", campanha_id: "1", criterio_id: "6" });
	});

	test("sem valor anterior ou sem recurso criado não há inverso", () => {
		expect(inverseItem({ tipo: "orcamento", campanha_id: "1", valor: 1 }, null, "")).toBeNull();
		expect(
			inverseItem({ tipo: "status_grupo", grupo_id: "1", novo_status: "ATIVO" }, "REMOVED", ""),
		).toBeNull();
		expect(
			inverseItem(
				{ tipo: "adicionar_palavra_chave", grupo_id: "2", texto: "a", correspondencia: "EXATA" },
				null,
				"",
			),
		).toBeNull();
		expect(
			inverseItem(
				{
					tipo: "adicionar_negativa_campanha",
					campanha_id: "1",
					texto: "a",
					correspondencia: "EXATA",
				},
				null,
				"",
			),
		).toBeNull();
		expect(
			inverseItem(
				{
					tipo: "editar_rsa",
					grupo_id: "2",
					anuncio_id: "3",
					titulos: [{ texto: "a" }, { texto: "b" }, { texto: "c" }],
					descricoes: [{ texto: "d" }, { texto: "e" }],
				},
				null,
				"",
			),
		).toBeNull();
	});
});
