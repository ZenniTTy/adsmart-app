import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JWT } from "google-auth-library";
import {
	ADWORDS_SCOPE,
	createServiceAccountTokenProvider,
	defaultAuthDeps,
} from "../../src/google/auth.js";

const FAKE_EMAIL = "teste@projeto-ficticio.iam.gserviceaccount.com";
const FAKE_KEY = "chave-ficticia-de-teste";
const validKeyJson = JSON.stringify({
	type: "service_account",
	client_email: FAKE_EMAIL,
	private_key: FAKE_KEY,
});

async function captureMessage(run: () => Promise<unknown>): Promise<string> {
	try {
		await run();
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
	throw new Error("esperava falha");
}

describe("AUTH-01 token da conta de serviço", () => {
	test("usa JWT com e-mail, chave e escopo adwords", async () => {
		const received: Array<{ email: string; key: string; scopes: string[] }> = [];
		const provider = createServiceAccountTokenProvider("/tmp/chave.json", {
			readKeyFile: async () => validKeyJson,
			createClient: (options) => {
				received.push(options);
				return { getAccessToken: async () => ({ token: "token-falso" }) };
			},
		});
		expect(await provider()).toBe("token-falso");
		expect(received).toEqual([{ email: FAKE_EMAIL, key: FAKE_KEY, scopes: [ADWORDS_SCOPE] }]);
	});

	test("cria o cliente uma única vez", async () => {
		let created = 0;
		const provider = createServiceAccountTokenProvider("/tmp/chave.json", {
			readKeyFile: async () => validKeyJson,
			createClient: () => {
				created++;
				return { getAccessToken: async () => ({ token: "t" }) };
			},
		});
		await provider();
		await provider();
		expect(created).toBe(1);
	});

	test("arquivo ilegível gera mensagem pt-BR", async () => {
		const provider = createServiceAccountTokenProvider("/tmp/nao-existe.json", {
			readKeyFile: async () => {
				throw new Error("ENOENT detalhe interno");
			},
			createClient: () => ({ getAccessToken: async () => ({ token: "t" }) }),
		});
		const message = await captureMessage(provider);
		expect(message).toContain("Não foi possível ler o arquivo de chave");
		expect(message).not.toContain("ENOENT");
	});

	test("JSON que não é chave de serviço não ecoa o conteúdo", async () => {
		const provider = createServiceAccountTokenProvider("/tmp/chave.json", {
			readKeyFile: async () => JSON.stringify({ type: "authorized_user", private_key: FAKE_KEY }),
			createClient: () => ({ getAccessToken: async () => ({ token: "t" }) }),
		});
		const message = await captureMessage(provider);
		expect(message).toContain("não é uma chave JSON de conta de serviço");
		expect(message).not.toContain(FAKE_KEY);
	});

	test("falha da biblioteca não vaza chave, e-mail nem texto original", async () => {
		const provider = createServiceAccountTokenProvider("/tmp/chave.json", {
			readKeyFile: async () => validKeyJson,
			createClient: () => ({
				getAccessToken: async () => {
					throw new Error(`invalid_grant for ${FAKE_EMAIL} key ${FAKE_KEY}`);
				},
			}),
		});
		const message = await captureMessage(provider);
		expect(message).toContain("Não foi possível autenticar com o Google");
		expect(message).not.toContain(FAKE_KEY);
		expect(message).not.toContain(FAKE_EMAIL);
		expect(message).not.toContain("invalid_grant");
	});

	test("dependências padrão leem o arquivo e criam o cliente JWT sem pedir token", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "adsmart-auth-")), "chave.json");
		writeFileSync(path, validKeyJson);
		expect(await defaultAuthDeps.readKeyFile(path)).toBe(validKeyJson);
		const created = defaultAuthDeps.createClient({
			email: FAKE_EMAIL,
			key: FAKE_KEY,
			scopes: [ADWORDS_SCOPE],
		});
		expect(created).toBeInstanceOf(JWT);
	});

	test("token vazio é tratado como falha", async () => {
		const provider = createServiceAccountTokenProvider("/tmp/chave.json", {
			readKeyFile: async () => validKeyJson,
			createClient: () => ({ getAccessToken: async () => ({ token: null }) }),
		});
		expect(await captureMessage(provider)).toContain("Não foi possível autenticar");
	});
});
