import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { inflateRawSync } from "node:zlib";
import * as z from "zod/v4";
import { call, createSessions, text } from "./harness.js";

const ROOT = join(import.meta.dir, "..", "..");
const EXPECTED_ENTRIES = ["LICENSE", "icon.png", "manifest.json", "server/main.js"];

type ZipEntry = { name: string; content: Buffer };

function readZip(archive: Buffer): ZipEntry[] {
	const endOfDirectory = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
	const count = archive.readUInt16LE(endOfDirectory + 10);
	let cursor = archive.readUInt32LE(endOfDirectory + 16);
	const entries: ZipEntry[] = [];
	for (let index = 0; index < count; index++) {
		const method = archive.readUInt16LE(cursor + 10);
		const compressedSize = archive.readUInt32LE(cursor + 20);
		const nameLength = archive.readUInt16LE(cursor + 28);
		const extraLength = archive.readUInt16LE(cursor + 30);
		const commentLength = archive.readUInt16LE(cursor + 32);
		const localHeader = archive.readUInt32LE(cursor + 42);
		const name = archive.toString("utf8", cursor + 46, cursor + 46 + nameLength);
		const dataStart =
			localHeader +
			30 +
			archive.readUInt16LE(localHeader + 26) +
			archive.readUInt16LE(localHeader + 28);
		const raw = archive.subarray(dataStart, dataStart + compressedSize);
		entries.push({ name, content: method === 8 ? inflateRawSync(raw) : Buffer.from(raw) });
		cursor += 46 + nameLength + extraLength + commentLength;
	}
	return entries;
}

const version = z
	.object({ version: z.string() })
	.parse(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))).version;
const entries = readZip(readFileSync(join(ROOT, "dist", `adsmart-${version}.mcpb`)));
const extracted = mkdtempSync(join(tmpdir(), "adsmart-pacote-"));
const sessions = createSessions();

beforeAll(() => {
	for (const entry of entries) {
		const target = join(extracted, entry.name);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, entry.content);
	}
});

afterAll(async () => {
	await sessions.closeAll();
	rmSync(extracted, { recursive: true, force: true });
});

describe("PKG-04 conteúdo do .mcpb", () => {
	test("só manifest, servidor, ícone e licença", () => {
		expect(entries.map((entry) => entry.name).sort()).toEqual(EXPECTED_ENTRIES);
	});

	test("manifest empacotado é o do repositório", () => {
		const packed = entries.find((entry) => entry.name === "manifest.json");
		expect(packed?.content.toString("utf8")).toBe(
			readFileSync(join(ROOT, "manifest.json"), "utf8"),
		);
	});
});

describe("PKG-05 servidor extraído do .mcpb", () => {
	test("PKG-02: sobe com node e lista as mesmas ferramentas do manifest", async () => {
		const { client } = await sessions.connect({}, join(extracted, "server", "main.js"));
		const { tools } = await client.listTools();
		const manifest = z
			.object({ tools: z.array(z.object({ name: z.string() })) })
			.parse(JSON.parse(readFileSync(join(extracted, "manifest.json"), "utf8")));
		expect(tools.map((tool) => tool.name).sort()).toEqual(
			manifest.tools.map((tool) => tool.name).sort(),
		);
	});

	test("diagnostico sem chave configurada responde em pt-BR sem rede", async () => {
		const { client } = await sessions.connect(
			{ ADSMART_KEY_FILE: "${user_config.arquivo_chave}" },
			join(extracted, "server", "main.js"),
		);
		expect(text(await call(client, "diagnostico"))).toContain("não foi informado");
	});
});
