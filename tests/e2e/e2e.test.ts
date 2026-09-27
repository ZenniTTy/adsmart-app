import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
	type FakeGoogle,
	type FakeHandler,
	googleFailure,
	startFakeGoogle,
} from "./fake-google.js";
import {
	call,
	createSessions,
	createWorkDir,
	FAKE_EMAIL,
	FAKE_KEY,
	PRODUCTION_SERVER,
	text,
} from "./harness.js";

const DIRECT = "1234567890";
const VIA_MCC = "2345678901";
const MCC = "9876543210";

const work = createWorkDir();
const keyDir = work.dir;
const keyFile = work.keyFile;

function customer(id: string, manager = false, level?: string) {
	const fields = {
		id,
		descriptiveName: `Conta ${id}`,
		currencyCode: "BRL",
		status: "ENABLED",
		manager,
	};
	return level ? { customerClient: { ...fields, level } } : { customer: fields };
}

const happyPath: FakeHandler = (request) => {
	if (request.path === "/customers:listAccessibleCustomers") {
		return { status: 200, body: { resourceNames: [`customers/${DIRECT}`] } };
	}
	const target = /^\/customers\/(\d+)\/googleAds:search$/.exec(request.path)?.[1];
	if (target === VIA_MCC && request.loginCustomerId !== MCC) {
		return googleFailure(403, "authorizationError", "USER_PERMISSION_DENIED");
	}
	if (request.query?.includes("FROM customer_client")) {
		return {
			status: 200,
			body: {
				results: [
					customer(MCC, true, "0"),
					customer(DIRECT, false, "1"),
					customer(VIA_MCC, false, "1"),
				],
			},
		};
	}
	return { status: 200, body: { results: [customer(target ?? "", target === MCC)] } };
};

let google: FakeGoogle;
const sessions = createSessions();

beforeAll(async () => {
	google = await startFakeGoogle(happyPath);
});

afterAll(async () => {
	await google.close();
});

afterEach(async () => {
	await sessions.closeAll();
	google.setHandler(happyPath);
	google.requests.length = 0;
});

function connect(env: Record<string, string>, entry?: string) {
	return sessions.connect(
		{ ADSMART_TEST_FAKE_URL: google.baseUrl, ADSMART_TEST_HISTORY_FILE: work.historyFile, ...env },
		entry,
	);
}

const withMcc = () => ({ ADSMART_KEY_FILE: keyFile, ADSMART_LOGIN_CUSTOMER_ID: "987-654-3210" });

describe("E2E-01 / TOOL-01 servidor real via stdio com node", () => {
	test("lista as tools; as 3 de consulta com schemas e annotations de leitura", async () => {
		const { client } = await connect(withMcc());
		const { tools } = await client.listTools();
		expect(tools.map((t) => t.name).sort()).toEqual([
			"aplicar",
			"consultar",
			"desfazer",
			"diagnostico",
			"historico",
			"listar_contas",
			"preparar_alteracao",
		]);
		const readTools = tools.filter((t) =>
			["consultar", "diagnostico", "listar_contas"].includes(t.name),
		);
		for (const tool of readTools) {
			expect(tool.annotations?.readOnlyHint).toBe(true);
			expect(tool.annotations?.openWorldHint).toBe(true);
			expect(tool.outputSchema).toBeDefined();
		}
	});

	test("resultado traz structuredContent e o mesmo JSON em texto", async () => {
		const { client } = await connect(withMcc());
		const result = await call(client, "listar_contas");
		expect(result.isError).toBeFalsy();
		expect(JSON.parse(text(result))).toEqual(result.structuredContent);
	});
});

describe("TOOL-02 diagnostico", () => {
	test("caminho feliz com MCC: todas as etapas OK", async () => {
		const { client } = await connect(withMcc());
		const result = await call(client, "diagnostico");
		expect(result.structuredContent?.tudo_ok).toBe(true);
	});

	const failures: Array<[string, Record<string, string>, FakeHandler | undefined]> = [
		["Configuração da extensão", {}, undefined],
		["Arquivo de chave", { ADSMART_KEY_FILE: join(keyDir, "nao-existe.json") }, undefined],
		["Autenticação com o Google", { ...withMcc(), ADSMART_TEST_TOKEN_FAILS: "1" }, undefined],
		[
			"Contas acessíveis",
			withMcc(),
			() => googleFailure(401, "authenticationError", "NOT_ADS_USER"),
		],
		[
			"Conta de administrador (MCC)",
			withMcc(),
			(request) =>
				request.path.startsWith(`/customers/${MCC}`)
					? googleFailure(403, "authorizationError", "USER_PERMISSION_DENIED")
					: happyPath(request),
		],
	];

	test.each(failures)("falha em %s é reportada nessa etapa", async (etapa, env, handler) => {
		if (handler) {
			google.setHandler(handler);
		}
		const { client } = await connect(env);
		const result = await call(client, "diagnostico");
		const steps = result.structuredContent?.etapas as Array<{
			etapa: string;
			status: string;
			detalhe: string;
		}>;
		expect(result.structuredContent?.tudo_ok).toBe(false);
		expect(steps.find((s) => s.status === "FALHA")?.etapa).toBe(etapa);
	});
});

describe("TOOL-03 listar_contas", () => {
	test("junta contas diretas e da MCC", async () => {
		const { client } = await connect(withMcc());
		const result = await call(client, "listar_contas");
		const contas = result.structuredContent?.contas as Array<{
			id: string;
			acesso: string;
			administradora: boolean;
		}>;
		const byId = Object.fromEntries(contas.map((c) => [c.id, c]));
		expect(byId[DIRECT]?.acesso).toBe("direto e mcc");
		expect(byId[VIA_MCC]?.acesso).toBe("mcc");
		expect(byId[MCC]?.administradora).toBe(true);
	});
});

describe("TOOL-04 consultar", () => {
	test("aplica LIMIT 100 quando ausente", async () => {
		const { client } = await connect(withMcc());
		const result = await call(client, "consultar", {
			conta: DIRECT,
			gaql: "SELECT campaign.id FROM campaign",
		});
		expect(result.isError).toBeFalsy();
		expect(result.structuredContent?.consulta).toBe("SELECT campaign.id FROM campaign LIMIT 100");
		expect(google.requests.at(-1)?.query).toBe("SELECT campaign.id FROM campaign LIMIT 100");
	});

	test.each([
		[5, true],
		[3, false],
	])("LIMIT 5 com %p linhas: pode_haver_mais = %p", async (rowCount, expectMore) => {
		google.setHandler((request) =>
			request.path.includes("googleAds:search")
				? {
						status: 200,
						body: {
							results: Array.from({ length: rowCount }, (_, i) => ({
								campaign: { id: String(i) },
							})),
						},
					}
				: happyPath(request),
		);
		const { client } = await connect(withMcc());
		const result = await call(client, "consultar", {
			conta: DIRECT,
			gaql: "SELECT campaign.id FROM campaign LIMIT 5",
		});
		expect(result.structuredContent?.quantidade).toBe(rowCount);
		expect(result.structuredContent?.pode_haver_mais).toBe(expectMore);
	});

	test.each([
		["SELECT campaign.id FROM campaign LIMIT 5000", "entre 1 e 1000"],
		["DELETE FROM campaign", "começar com SELECT"],
		["SELECT campaign.id FROM campaign; SELECT customer.id FROM customer", "única consulta"],
	])("recusa %p", async (gaql, expected) => {
		const { client } = await connect(withMcc());
		const result = await call(client, "consultar", { conta: DIRECT, gaql });
		expect(result.isError).toBe(true);
		expect(text(result)).toContain(expected);
	});

	test("usa login-customer-id só para conta fora do acesso direto", async () => {
		const { client } = await connect(withMcc());
		await call(client, "consultar", { conta: DIRECT, gaql: "SELECT customer.id FROM customer" });
		expect(google.requests.at(-1)?.loginCustomerId).toBeUndefined();
		const viaMcc = await call(client, "consultar", {
			conta: "234-567-8901",
			gaql: "SELECT customer.id FROM customer",
		});
		expect(viaMcc.isError).toBeFalsy();
		expect(google.requests.at(-1)?.loginCustomerId).toBe(MCC);
	});

	test("erro do Google vira mensagem pt-BR com requestId", async () => {
		google.setHandler((request) =>
			request.path.includes("googleAds:search")
				? googleFailure(400, "queryError", "UNRECOGNIZED_FIELD")
				: happyPath(request),
		);
		const { client } = await connect(withMcc());
		const result = await call(client, "consultar", {
			conta: DIRECT,
			gaql: "SELECT x FROM campaign",
		});
		expect(result.isError).toBe(true);
		expect(text(result)).toContain("A consulta GAQL é inválida");
		expect(text(result)).toContain("req-e2e");
	});
});

describe("TOOL-05 argumento inválido", () => {
	test("ID de conta inválido: mensagem pt-BR", async () => {
		const { client } = await connect(withMcc());
		const result = await call(client, "consultar", {
			conta: "abc",
			gaql: "SELECT customer.id FROM customer",
		});
		expect(result.isError).toBe(true);
		expect(text(result)).toContain("ID de conta inválido");
	});

	test("tipo errado: a mensagem traz o texto pt-BR do schema", async () => {
		const { client } = await connect(withMcc());
		let message = "";
		try {
			const result = await call(client, "consultar", {
				conta: 1234567890,
				gaql: "SELECT customer.id FROM customer",
			});
			message = text(result);
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}
		expect(message).toContain("Informe o ID da conta como texto");
	});
});

describe("SEC-01 stderr sem segredos", () => {
	test("nenhum token, chave ou e-mail da chave no stderr", async () => {
		const session = await connect({ ...withMcc(), ADSMART_TEST_TOKEN_FAILS: "1" });
		await call(session.client, "diagnostico");
		await call(session.client, "listar_contas");
		for (const secret of ["token-falso", FAKE_KEY, FAKE_EMAIL]) {
			expect(session.stderr()).not.toContain(secret);
		}
	});
});

describe("E2E-02 entrypoint de produção", () => {
	test("sobe com node e responde tools/list sem rede", async () => {
		const { client } = await connect({}, PRODUCTION_SERVER);
		const { tools } = await client.listTools();
		expect(tools).toHaveLength(7);
	});
});
