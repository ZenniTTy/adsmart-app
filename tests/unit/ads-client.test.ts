import { describe, expect, test } from "bun:test";
import { createAdsClient, type HttpFetch } from "../../src/google/ads-client.js";

type Call = { url: string; init: RequestInit };

function fakeFetch(status: number, body: unknown, calls: Call[] = []): HttpFetch {
	return async (url, init) => {
		calls.push({ url, init });
		const text = typeof body === "string" ? body : JSON.stringify(body);
		return new Response(text, { status });
	};
}

function client(fetch: HttpFetch) {
	return createAdsClient({ baseUrl: "http://base.teste/v0", fetch, getToken: async () => "tk" });
}

async function captureMessage(run: () => Promise<unknown>): Promise<string> {
	try {
		await run();
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
	throw new Error("esperava falha");
}

describe("API-03 respostas validadas", () => {
	test("listAccessibleCustomers devolve só os IDs", async () => {
		const ids = await client(
			fakeFetch(200, { resourceNames: ["customers/1234567890", "customers/2345678901"] }),
		).listAccessibleCustomerIds();
		expect(ids).toEqual(["1234567890", "2345678901"]);
	});

	test("search devolve linhas e nextPageToken", async () => {
		const result = await client(
			fakeFetch(200, { results: [{ customer: { id: "1" } }], nextPageToken: "p2" }),
		).search("1234567890", "SELECT customer.id FROM customer");
		expect(result).toEqual({ rows: [{ customer: { id: "1" } }], nextPageToken: "p2" });
	});

	test("resposta sem results é lista vazia", async () => {
		const result = await client(fakeFetch(200, {})).search(
			"1234567890",
			"SELECT customer.id FROM customer",
		);
		expect(result.rows).toEqual([]);
	});

	test.each([[{ resourceNames: "nao-e-lista" }], ["nao-e-json"]])(
		"formato inesperado vira erro pt-BR (%p)",
		async (body) => {
			const message = await captureMessage(() =>
				client(fakeFetch(200, body)).listAccessibleCustomerIds(),
			);
			expect(message).toContain("formato inesperado");
		},
	);

	test("erro HTTP usa o parser de GoogleAdsFailure", async () => {
		const body = {
			error: {
				details: [
					{
						errors: [{ errorCode: { authenticationError: "CUSTOMER_NOT_FOUND" } }],
						requestId: "r1",
					},
				],
			},
		};
		const message = await captureMessage(() =>
			client(fakeFetch(401, body)).search("1234567890", "SELECT customer.id FROM customer"),
		);
		expect(message).toContain("não foi encontrada");
	});

	test("falha de rede vira mensagem pt-BR", async () => {
		const failing: HttpFetch = async () => {
			throw new Error("ECONNREFUSED detalhe");
		};
		const message = await captureMessage(() => client(failing).listAccessibleCustomerIds());
		expect(message).toContain("Não foi possível conectar");
		expect(message).not.toContain("ECONNREFUSED");
	});
});

describe("API-04 login-customer-id", () => {
	test("enviado quando informado", async () => {
		const calls: Call[] = [];
		await client(fakeFetch(200, {}, calls)).search(
			"1234567890",
			"SELECT customer.id FROM customer",
			"9876543210",
		);
		const headers = calls[0]?.init.headers as Record<string, string>;
		expect(headers["login-customer-id"]).toBe("9876543210");
		expect(headers.Authorization).toBe("Bearer tk");
	});

	test("ausente quando não informado", async () => {
		const calls: Call[] = [];
		await client(fakeFetch(200, {}, calls)).search(
			"1234567890",
			"SELECT customer.id FROM customer",
		);
		const headers = calls[0]?.init.headers as Record<string, string>;
		expect(headers["login-customer-id"]).toBeUndefined();
	});

	test("monta a URL de search com o ID sem traços", async () => {
		const calls: Call[] = [];
		await client(fakeFetch(200, {}, calls)).search(
			"1234567890",
			"SELECT customer.id FROM customer",
		);
		expect(calls[0]?.url).toBe("http://base.teste/v0/customers/1234567890/googleAds:search");
		expect(calls[0]?.init.body).toBe(JSON.stringify({ query: "SELECT customer.id FROM customer" }));
	});
});
