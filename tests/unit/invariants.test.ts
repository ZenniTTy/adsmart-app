import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const SYNTHETIC_IDS = new Set(["1234567890", "2345678901", "3456789012", "9876543210"]);

function filesUnder(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? filesUnder(path) : [path];
	});
}

function scan(dir: string, pattern: RegExp): string[] {
	return filesUnder(join(ROOT, dir))
		.filter((file) => pattern.test(readFileSync(file, "utf8")))
		.map((file) => relative(ROOT, file));
}

describe("API-01 versão da API isolada", () => {
	test("só ads-client.ts cita a versão", () => {
		expect(scan("src", /\bv2\d\b/)).toEqual(["src/google/ads-client.ts"]);
	});
});

describe("API-02 hosts permitidos", () => {
	test("src/ só cita googleads e oauth2, além do identificador de escopo OAuth", () => {
		const scopeIdentifier = "https://www.googleapis.com/auth/adwords";
		const hosts = filesUnder(join(ROOT, "src")).flatMap((file) =>
			[
				...readFileSync(file, "utf8")
					.replaceAll(scopeIdentifier, "")
					.matchAll(/https?:\/\/([a-z0-9.-]+)/gi),
			].map((m) => m[1]),
		);
		const allowed = new Set(["googleads.googleapis.com", "oauth2.googleapis.com"]);
		expect(hosts.filter((host) => !allowed.has(host ?? ""))).toEqual([]);
	});
});

describe("SEC-02 sem mutação nesta fase", () => {
	test("src/ não usa :mutate", () => {
		expect(scan("src", /:mutate/)).toEqual([]);
	});
});

describe("SEC-03 fixtures sem segredo nem conta real", () => {
	test("tests/ sem chave privada ou token", () => {
		const secret = new RegExp(`BEGIN ${"PRIVATE"} KEY|ya${"29"}\\.[A-Za-z0-9_-]{10,}`);
		expect(scan("tests", secret)).toEqual([]);
	});

	test("tests/ só usa IDs de conta sintéticos", () => {
		const found = filesUnder(join(ROOT, "tests")).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/(?<![\d-])(\d{3}-?\d{3}-?\d{4})(?![\d-])/g)]
				.map((m) => (m[1] ?? "").replaceAll("-", ""))
				.filter((id) => !SYNTHETIC_IDS.has(id))
				.map((id) => `${relative(ROOT, file)}: ${id}`),
		);
		expect(found).toEqual([]);
	});
});

describe("SEC-04 produção sem porta de teste e sem Bun", () => {
	test("src/ não usa APIs do Bun", () => {
		expect(scan("src", /\bBun\.|from "bun:/)).toEqual([]);
	});

	test("src/ não lê variável de teste", () => {
		expect(scan("src", /ADSMART_TEST|127\.0\.0\.1|localhost/)).toEqual([]);
	});
});
