import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import {
	type FakeGoogle,
	type FakeResponse,
	googleFailure,
	type RecordedRequest,
	startFakeGoogle,
} from "./fake-google.js";
import { call, createSessions, createWorkDir, type ToolResult, text } from "./harness.js";

const DIRECT = "1234567890";
const VIA_MCC = "2345678901";
const MCC = "9876543210";
const CAMPAIGN = "111";
const GROUP = "222";
const work = createWorkDir();

type Keyword = { text: string; match: string; status: string; negative: boolean };

type State = {
	budget: string;
	groupStatus: string;
	reasons: string[];
	changeEvent: string | undefined;
	keywords: Map<string, Keyword>;
	nextId: number;
	validateFailure: FakeResponse | undefined;
	applyFailure: FakeResponse | undefined;
};

let state: State;

function freshState(): State {
	const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000)
		.toISOString()
		.replace("T", " ")
		.slice(0, 26);
	return {
		budget: "100000000",
		groupStatus: "ENABLED",
		reasons: ["BIDDING_STRATEGY_LEARNING"],
		changeEvent: twoDaysAgo,
		keywords: new Map([
			["444", { text: "faxina", match: "EXACT", status: "ENABLED", negative: false }],
		]),
		nextId: 900,
		validateFailure: undefined,
		applyFailure: undefined,
	};
}

function rows(results: unknown[]): FakeResponse {
	return { status: 200, body: { results } };
}

function search(query: string): FakeResponse {
	if (query.includes("customer.currency_code")) {
		return rows([{ customer: { currencyCode: "BRL" } }]);
	}
	if (query.includes("campaign_budget.resource_name")) {
		return rows([
			{
				campaign: { id: CAMPAIGN },
				campaignBudget: {
					resourceName: `customers/${DIRECT}/campaignBudgets/555`,
					amountMicros: state.budget,
					referenceCount: "1",
				},
			},
		]);
	}
	if (query.includes("primary_status_reasons")) {
		return rows([{ campaign: { id: CAMPAIGN, primaryStatusReasons: state.reasons } }]);
	}
	if (query.includes("FROM change_event")) {
		return rows(state.changeEvent ? [{ changeEvent: { changeDateTime: state.changeEvent } }] : []);
	}
	if (query.includes(`FROM ad_group WHERE ad_group.id = ${GROUP}`)) {
		return rows([
			{
				campaign: { id: CAMPAIGN },
				adGroup: { status: state.groupStatus, cpcBidMicros: "1000000" },
			},
		]);
	}
	const byText =
		/keyword\.text = '([^']+)' AND ad_group_criterion\.keyword\.match_type = '(\w+)' AND ad_group_criterion\.negative = (TRUE|FALSE)/.exec(
			query,
		);
	if (byText) {
		const found = [...state.keywords.entries()].find(
			([, k]) =>
				k.text === byText[1] &&
				k.match === byText[2] &&
				k.negative === (byText[3] === "TRUE") &&
				k.status !== "REMOVED",
		);
		return rows(
			found
				? [
						{
							campaign: { id: CAMPAIGN },
							adGroupCriterion: {
								resourceName: `customers/${DIRECT}/adGroupCriteria/${GROUP}~${found[0]}`,
							},
						},
					]
				: [],
		);
	}
	const byId = /ad_group_criterion\.criterion_id = (\d+)/.exec(query);
	if (byId) {
		const keyword = state.keywords.get(byId[1] ?? "");
		return rows(
			keyword ? [{ campaign: { id: CAMPAIGN }, adGroupCriterion: { status: keyword.status } }] : [],
		);
	}
	return rows([]);
}

type Operation = Record<
	string,
	{ update?: Record<string, unknown>; create?: Record<string, unknown>; remove?: string }
>;

function applyOperations(operations: Operation[]): FakeResponse {
	const responses = operations.map((operation) => {
		const [key, body] = Object.entries(operation)[0] ?? ["", {}];
		if (key === "campaignBudgetOperation" && body.update) {
			state.budget = String(body.update.amountMicros);
			return { campaignBudgetResult: { resourceName: String(body.update.resourceName) } };
		}
		if (key === "adGroupOperation" && body.update) {
			state.groupStatus = String(body.update.status ?? state.groupStatus);
			return { adGroupResult: { resourceName: String(body.update.resourceName) } };
		}
		if (key === "adGroupCriterionOperation" && body.create) {
			const id = String(state.nextId++);
			const keyword = body.create.keyword as { text: string; matchType: string };
			state.keywords.set(id, {
				text: keyword.text,
				match: keyword.matchType,
				status: "ENABLED",
				negative: body.create.negative === true,
			});
			return {
				adGroupCriterionResult: {
					resourceName: `customers/${DIRECT}/adGroupCriteria/${GROUP}~${id}`,
				},
			};
		}
		if (key === "adGroupCriterionOperation" && body.remove) {
			const id = body.remove.split("~")[1] ?? "";
			const keyword = state.keywords.get(id);
			if (keyword) {
				keyword.status = "REMOVED";
			}
			return { adGroupCriterionResult: { resourceName: body.remove } };
		}
		return {};
	});
	return { status: 200, body: { mutateOperationResponses: responses } };
}

function handler(request: RecordedRequest): FakeResponse {
	if (request.path === "/customers:listAccessibleCustomers") {
		return { status: 200, body: { resourceNames: [`customers/${DIRECT}`] } };
	}
	if (request.path.endsWith("/googleAds:search")) {
		return search(request.query ?? "");
	}
	if (request.path.endsWith("/googleAds:mutate")) {
		const body = request.body as { mutateOperations: Operation[]; validateOnly?: boolean };
		if (body.validateOnly) {
			return state.validateFailure ?? { status: 200, body: {} };
		}
		return state.applyFailure ?? applyOperations(body.mutateOperations);
	}
	return { status: 404, body: {} };
}

let google: FakeGoogle;
const sessions = createSessions();

beforeAll(async () => {
	google = await startFakeGoogle(handler);
});

afterAll(async () => {
	await google.close();
});

beforeEach(() => {
	state = freshState();
	google.requests.length = 0;
	rmSync(work.historyFile, { force: true });
	writeFileSync(work.clockFile, "0");
});

afterEach(async () => {
	await sessions.closeAll();
});

function connect(extra: Record<string, string> = {}) {
	return sessions.connect({
		ADSMART_TEST_FAKE_URL: google.baseUrl,
		ADSMART_TEST_HISTORY_FILE: work.historyFile,
		ADSMART_TEST_CLOCK_FILE: work.clockFile,
		ADSMART_KEY_FILE: work.keyFile,
		...extra,
	});
}

const budgetTo = (valor: number) => ({ tipo: "orcamento", campanha_id: CAMPAIGN, valor });

async function prepare(
	client: Awaited<ReturnType<typeof connect>>["client"],
	itens: unknown[],
	conta = DIRECT,
) {
	return call(client, "preparar_alteracao", { conta, itens });
}

function applyCalls() {
	return google.requests.filter(
		(r) =>
			r.path.endsWith("/googleAds:mutate") && !(r.body as { validateOnly?: boolean }).validateOnly,
	);
}

function historyLines(): Array<Record<string, unknown>> {
	try {
		return readFileSync(work.historyFile, "utf8")
			.split("\n")
			.filter(Boolean)
			.map((line) => JSON.parse(line) as Record<string, unknown>);
	} catch {
		return [];
	}
}

describe("TOOL-06 annotations", () => {
	test("aplicar é destrutiva e as demais de leitura", async () => {
		const { client } = await connect();
		const { tools } = await client.listTools();
		const byName = Object.fromEntries(tools.map((t) => [t.name, t.annotations]));
		expect(byName.aplicar?.destructiveHint).toBe(true);
		expect(byName.aplicar?.idempotentHint).toBe(false);
		for (const name of ["preparar_alteracao", "desfazer", "historico"]) {
			expect(byName[name]?.readOnlyHint).toBe(true);
		}
	});
});

describe("PRV prévia", () => {
	test("PRV-01, PRV-02, PRV-03, PRV-04: antes → depois em reais, validateOnly, destaques e avisos", async () => {
		const { client } = await connect();
		const result = await prepare(client, [budgetTo(151)]);
		expect(result.isError).toBeFalsy();
		const out = result.structuredContent as {
			id_plano: string;
			itens: Array<{ antes: string; depois: string; destaques: string[] }>;
			avisos: string[];
		};
		expect(out.id_plano).toBeTruthy();
		expect(out.itens[0]?.antes.replace(/\s/g, " ")).toBe("R$ 100,00");
		expect(out.itens[0]?.depois.replace(/\s/g, " ")).toBe("R$ 151,00");
		expect(out.itens[0]?.destaques.join(" ")).toContain("acima de 50%");
		expect(out.avisos.join(" ")).toContain("fase de aprendizado");
		expect(out.avisos.join(" ")).toContain("alterada há 2 dia(s)");
		expect(out.avisos.join(" ")).toContain("Sempre permitir");
		const validate = google.requests.find((r) => r.path.endsWith("/googleAds:mutate"));
		expect((validate?.body as { validateOnly?: boolean } | undefined)?.validateOnly).toBe(true);
		expect(applyCalls()).toHaveLength(0);
		expect(state.budget).toBe("100000000");
	});

	test("PRV-02: recusa do Google na prévia vira erro pt-BR e não cria plano", async () => {
		state.validateFailure = googleFailure(400, "fieldError", "ALGO_INVALIDO");
		const { client } = await connect();
		const result = await prepare(client, [budgetTo(90)]);
		expect(result.isError).toBe(true);
		expect(text(result)).toContain("req-e2e");
		expect(text(result)).not.toContain("texto original");
	});

	test("CHG-04: item sem mudança não gera plano", async () => {
		const { client } = await connect();
		const result = await prepare(client, [
			{ tipo: "status_grupo", grupo_id: GROUP, novo_status: "ATIVO" },
		]);
		const out = result.structuredContent as { id_plano?: string; sem_mudanca: string[] };
		expect(out.id_plano).toBeUndefined();
		expect(out.sem_mudanca).toHaveLength(1);
		expect(google.requests.some((r) => r.path.endsWith("/googleAds:mutate"))).toBe(false);
	});

	test("CHG-05: conta via MCC recebe login-customer-id na leitura, na prévia e na aplicação", async () => {
		const { client } = await connect({ ADSMART_LOGIN_CUSTOMER_ID: MCC });
		const prepared = await prepare(client, [budgetTo(90)], VIA_MCC);
		const id = (prepared.structuredContent as { id_plano: string }).id_plano;
		await call(client, "aplicar", { id_plano: id });
		const accountCalls = google.requests.filter((r) => r.path.startsWith(`/customers/${VIA_MCC}/`));
		expect(accountCalls.length).toBeGreaterThan(3);
		expect(accountCalls.every((r) => r.loginCustomerId === MCC)).toBe(true);
	});
});

describe("APL aplicar", () => {
	test("APL-04: aplica, altera a conta e grava histórico sem segredos", async () => {
		const { client } = await connect();
		const prepared = await prepare(client, [budgetTo(90)]);
		const id = (prepared.structuredContent as { id_plano: string }).id_plano;
		const applied = await call(client, "aplicar", { id_plano: id });
		expect(applied.isError).toBeFalsy();
		expect(state.budget).toBe("90000000");
		const lines = historyLines();
		expect(lines).toHaveLength(1);
		expect(lines[0]?.conta).toBe(DIRECT);
		expect(readFileSync(work.historyFile, "utf8")).not.toContain("token-falso");
		expect(readFileSync(work.historyFile, "utf8")).not.toContain("chave-ficticia");
	});

	test("PLN-01: aplicar envia exatamente o corpo validado na prévia", async () => {
		const { client } = await connect();
		const prepared = await prepare(client, [budgetTo(90)]);
		await call(client, "aplicar", {
			id_plano: (prepared.structuredContent as { id_plano: string }).id_plano,
		});
		const mutates = google.requests.filter((r) => r.path.endsWith("/googleAds:mutate"));
		const [validate, apply] = mutates.map(
			(r) => (r.body as { mutateOperations: unknown }).mutateOperations,
		);
		expect(apply).toEqual(validate);
	});

	test("APL-01: inexistente, já aplicado e expirado são recusados sem escrita", async () => {
		const { client } = await connect();
		expect(text(await call(client, "aplicar", { id_plano: "nao-existe" }))).toContain(
			"Plano não encontrado",
		);
		const first = await prepare(client, [budgetTo(90)]);
		const firstId = (first.structuredContent as { id_plano: string }).id_plano;
		await call(client, "aplicar", { id_plano: firstId });
		const again = await call(client, "aplicar", { id_plano: firstId });
		expect(text(again)).toContain("já foi aplicado");
		const second = await prepare(client, [budgetTo(80)]);
		writeFileSync(work.clockFile, String(16 * 60 * 1000));
		const expired = await call(client, "aplicar", {
			id_plano: (second.structuredContent as { id_plano: string }).id_plano,
		});
		expect(text(expired)).toContain("expirou");
		expect(applyCalls()).toHaveLength(1);
	});

	test("APL-02: valor mudou depois da prévia → recusa sem escrita", async () => {
		const { client } = await connect();
		const prepared = await prepare(client, [budgetTo(90)]);
		state.budget = "70000000";
		const result = await call(client, "aplicar", {
			id_plano: (prepared.structuredContent as { id_plano: string }).id_plano,
		});
		expect(result.isError).toBe(true);
		expect(text(result)).toContain("mudou desde a prévia");
		expect(applyCalls()).toHaveLength(0);
		expect(state.budget).toBe("70000000");
	});

	test("APL-03: falha na aplicação não grava histórico; concorrência pede nova prévia", async () => {
		const { client } = await connect();
		const prepared = await prepare(client, [budgetTo(90)]);
		state.applyFailure = googleFailure(409, "databaseError", "CONCURRENT_MODIFICATION");
		const result = await call(client, "aplicar", {
			id_plano: (prepared.structuredContent as { id_plano: string }).id_plano,
		});
		expect(result.isError).toBe(true);
		expect(text(result)).toContain("Gere uma nova prévia");
		expect(historyLines()).toHaveLength(0);
		expect(state.budget).toBe("100000000");
	});
});

describe("UND desfazer e HIS histórico", () => {
	async function applyPlan(
		client: Awaited<ReturnType<typeof connect>>["client"],
		itens: unknown[],
	) {
		const prepared = await prepare(client, itens);
		const applied = await call(client, "aplicar", {
			id_plano: (prepared.structuredContent as { id_plano: string }).id_plano,
		});
		return (applied.structuredContent as { id_alteracao: string }).id_alteracao;
	}

	test("UND-01: aplicar → desfazer → aplicar volta ao estado original", async () => {
		const { client } = await connect();
		const changeId = await applyPlan(client, [
			budgetTo(90),
			{ tipo: "status_grupo", grupo_id: GROUP, novo_status: "PAUSADO" },
			{
				tipo: "adicionar_palavra_chave",
				grupo_id: GROUP,
				texto: "diarista",
				correspondencia: "FRASE",
			},
		]);
		expect([state.budget, state.groupStatus]).toEqual(["90000000", "PAUSED"]);
		const undo = (await call(client, "desfazer", { id_alteracao: changeId })) as ToolResult;
		expect(undo.isError).toBeFalsy();
		const undoPlan = (undo.structuredContent as { id_plano: string }).id_plano;
		expect(applyCalls()).toHaveLength(1);
		await call(client, "aplicar", { id_plano: undoPlan });
		expect(state.budget).toBe("100000000");
		expect(state.groupStatus).toBe("ENABLED");
		expect([...state.keywords.values()].find((k) => k.text === "diarista")?.status).toBe("REMOVED");
		expect(historyLines()[1]?.desfaz).toBe(changeId);
	});

	test("UND-02: recusa se o valor mudou depois do AdSmart e recusa desfazer remoção", async () => {
		const { client } = await connect();
		const budgetChange = await applyPlan(client, [budgetTo(90)]);
		state.budget = "50000000";
		expect(text(await call(client, "desfazer", { id_alteracao: budgetChange }))).toContain(
			"não é mais o que o AdSmart deixou",
		);
		const removal = await applyPlan(client, [
			{ tipo: "remover_palavra_chave", grupo_id: GROUP, criterio_id: "444" },
		]);
		expect(text(await call(client, "desfazer", { id_alteracao: removal }))).toContain(
			"irreversíveis",
		);
	});

	test("HIS-01: histórico mais recente primeiro, com limite e filtro de conta", async () => {
		const { client } = await connect();
		const first = await applyPlan(client, [budgetTo(90)]);
		const second = await applyPlan(client, [budgetTo(80)]);
		const result = await call(client, "historico", { conta: "123-456-7890", limite: 1 });
		const out = result.structuredContent as { alteracoes: Array<{ id_alteracao: string }> };
		expect(out.alteracoes.map((a) => a.id_alteracao)).toEqual([second]);
		const all = await call(client, "historico", {});
		expect(
			(all.structuredContent as { alteracoes: Array<{ id_alteracao: string }> }).alteracoes.map(
				(a) => a.id_alteracao,
			),
		).toEqual([second, first]);
	});
});
