import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as z from "zod/v4";

const ROOT = join(import.meta.dir, "..", "..");

const manifestSchema = z.object({
	manifest_version: z.string(),
	name: z.string(),
	display_name: z.string(),
	version: z.string(),
	description: z.string(),
	long_description: z.string(),
	server: z.object({
		type: z.string(),
		entry_point: z.string(),
		mcp_config: z.object({
			command: z.string(),
			args: z.array(z.string()),
			env: z.record(z.string(), z.string()),
		}),
	}),
	tools: z.array(z.object({ name: z.string(), description: z.string() })),
	tools_generated: z.boolean(),
	privacy_policies: z.array(z.string()),
	compatibility: z.object({
		platforms: z.array(z.string()),
		runtimes: z.object({ node: z.string() }),
	}),
	user_config: z.record(
		z.string(),
		z.object({
			type: z.string(),
			title: z.string(),
			description: z.string(),
			required: z.boolean(),
		}),
	),
});

const manifest = manifestSchema.parse(
	JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8")),
);
const packageVersion = z
	.object({ version: z.string() })
	.parse(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))).version;

describe("PKG-01 manifest no formato 0.3", () => {
	test("identidade, versão e servidor Node", () => {
		expect(manifest.manifest_version).toBe("0.3");
		expect(manifest.name).toBe("adsmart");
		expect(manifest.version).toBe(packageVersion);
		expect(manifest.server.type).toBe("node");
		expect(manifest.server.entry_point).toBe("server/main.js");
		expect(manifest.server.mcp_config.command).toBe("node");
		expect(manifest.server.mcp_config.args).toEqual(["${__dirname}/server/main.js"]);
	});

	test("compatibilidade, privacidade e ferramentas estáticas", () => {
		expect(manifest.compatibility.platforms).toEqual(["darwin", "win32"]);
		expect(manifest.compatibility.runtimes.node).toBe(">=22.0.0");
		expect(manifest.privacy_policies).toEqual(["https://policies.google.com/privacy"]);
		expect(manifest.tools_generated).toBe(false);
	});
});

describe("PKG-03 user_config entregue por variável de ambiente", () => {
	test("arquivo de chave obrigatório e MCC opcional, nunca em args", () => {
		expect(manifest.user_config.arquivo_chave).toMatchObject({ type: "file", required: true });
		expect(manifest.user_config.mcc).toMatchObject({ type: "string", required: false });
		expect(manifest.server.mcp_config.env).toEqual({
			ADSMART_KEY_FILE: "${user_config.arquivo_chave}",
			ADSMART_LOGIN_CUSTOMER_ID: "${user_config.mcc}",
		});
		expect(manifest.server.mcp_config.args.join(" ")).not.toContain("user_config");
	});
});

describe("PKG-07 textos da instalação em pt-BR", () => {
	const texts = [
		manifest.display_name,
		manifest.description,
		manifest.long_description,
		...Object.values(manifest.user_config).flatMap((field) => [field.title, field.description]),
		...manifest.tools.map((tool) => tool.description),
	];
	const englishMarkers = /\b(the|your|with|and|for|this|file|account|key)\b/i;

	test.each(texts)("%p não tem marcadores de inglês", (text) => {
		expect(text).not.toMatch(englishMarkers);
	});
});
