import { describe, expect, test } from "bun:test";
import { prepareQuery } from "../../src/tools/gaql.js";

describe("TOOL-04 trava de GAQL", () => {
	test("sem LIMIT aplica LIMIT 100", () => {
		expect(prepareQuery("SELECT campaign.id FROM campaign")).toEqual({
			ok: true,
			query: "SELECT campaign.id FROM campaign LIMIT 100",
			limit: 100,
		});
	});

	test("LIMIT entra antes de PARAMETERS", () => {
		const result = prepareQuery("SELECT campaign.id FROM campaign PARAMETERS include_drafts=true");
		expect(result).toEqual({
			ok: true,
			query: "SELECT campaign.id FROM campaign LIMIT 100 PARAMETERS include_drafts=true",
			limit: 100,
		});
	});

	test("LIMIT informado dentro do teto é mantido", () => {
		expect(prepareQuery("select campaign.id from campaign limit 1000")).toEqual({
			ok: true,
			query: "select campaign.id from campaign limit 1000",
			limit: 1000,
		});
	});

	test("ponto e vírgula final é removido", () => {
		expect(prepareQuery("  SELECT customer.id FROM customer LIMIT 5;  ")).toEqual({
			ok: true,
			query: "SELECT customer.id FROM customer LIMIT 5",
			limit: 5,
		});
	});

	test.each([
		["SELECT campaign.id FROM campaign LIMIT 1001", "entre 1 e 1000"],
		["SELECT campaign.id FROM campaign LIMIT 0", "entre 1 e 1000"],
		["UPDATE campaign SET x = 1", "começar com SELECT"],
		["  selectcampaign", "começar com SELECT"],
		["SELECT a FROM b; SELECT c FROM d", "única consulta"],
	])("recusa %p", (query, expected) => {
		const result = prepareQuery(query);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain(expected);
		}
	});
});
