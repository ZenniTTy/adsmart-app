import { describe, expect, test } from "bun:test";
import {
	KEY_FILE_ENV,
	LOGIN_CUSTOMER_ID_ENV,
	loadConfig,
	normalizeCustomerId,
} from "../../src/config.js";

describe("CFG-01 configuração por variáveis de ambiente", () => {
	test("aceita só o arquivo de chave", () => {
		expect(loadConfig({ [KEY_FILE_ENV]: "/tmp/chave.json" })).toEqual({
			ok: true,
			config: { keyFile: "/tmp/chave.json" },
		});
	});

	test("sem arquivo de chave devolve mensagem pt-BR", () => {
		const result = loadConfig({});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("arquivo de chave");
		}
	});

	test("MCC inválida devolve mensagem pt-BR sem ecoar o valor", () => {
		const result = loadConfig({
			[KEY_FILE_ENV]: "/tmp/chave.json",
			[LOGIN_CUSTOMER_ID_ENV]: "abc",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("MCC");
			expect(result.message).not.toContain("abc");
		}
	});

	test("caminho da chave só com espaços é recusado", () => {
		const result = loadConfig({ [KEY_FILE_ENV]: "   " });
		expect(result.ok).toBe(false);
	});

	test("MCC com traços é normalizada", () => {
		expect(
			loadConfig({ [KEY_FILE_ENV]: "/tmp/chave.json", [LOGIN_CUSTOMER_ID_ENV]: "123-456-7890" }),
		).toEqual({ ok: true, config: { keyFile: "/tmp/chave.json", loginCustomerId: "1234567890" } });
	});
});

describe("CFG-02 ID de conta", () => {
	test("remove traços", () => {
		expect(normalizeCustomerId("123-456-7890")).toBe("1234567890");
	});

	test("aceita sem traços", () => {
		expect(normalizeCustomerId("1234567890")).toBe("1234567890");
	});

	test.each(["123456789", "12345678901", "abc-def-ghij", ""])("rejeita %p", (value) => {
		expect(normalizeCustomerId(value)).toBeUndefined();
	});
});
