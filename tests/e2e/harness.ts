import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const ROOT = join(import.meta.dir, "..", "..");
export const E2E_SERVER = join(ROOT, "dist", "e2e-server.js");
export const PRODUCTION_SERVER = join(ROOT, "dist", "main.js");
export const FAKE_EMAIL = "teste@projeto-ficticio.iam.gserviceaccount.com";
export const FAKE_KEY = "chave-ficticia-de-teste";

export type ToolResult = {
	isError?: boolean;
	content: Array<{ type: string; text?: string }>;
	structuredContent?: Record<string, unknown>;
};

export type Session = { client: Client; stderr: () => string };

export function createWorkDir() {
	const dir = mkdtempSync(join(tmpdir(), "adsmart-e2e-"));
	const keyFile = join(dir, "chave.json");
	writeFileSync(
		keyFile,
		JSON.stringify({ type: "service_account", client_email: FAKE_EMAIL, private_key: FAKE_KEY }),
	);
	return {
		dir,
		keyFile,
		historyFile: join(dir, "historico.jsonl"),
		clockFile: join(dir, "relogio"),
	};
}

export function createSessions() {
	let open: Session[] = [];
	return {
		async connect(env: Record<string, string>, entry = E2E_SERVER): Promise<Session> {
			const transport = new StdioClientTransport({
				command: "node",
				args: [entry],
				env: { ...getDefaultEnvironment(), ...env },
				stderr: "pipe",
			});
			let stderrText = "";
			transport.stderr?.on("data", (chunk: Buffer) => {
				stderrText += chunk.toString("utf8");
			});
			const client = new Client({ name: "adsmart-e2e", version: "0.0.0" });
			await client.connect(transport);
			const session = { client, stderr: () => stderrText };
			open.push(session);
			return session;
		},
		async closeAll() {
			for (const { client } of open) {
				await client.close();
			}
			open = [];
		},
	};
}

export async function call(
	client: Client,
	name: string,
	args: Record<string, unknown> = {},
): Promise<ToolResult> {
	return (await client.callTool({ name, arguments: args })) as ToolResult;
}

export function text(result: ToolResult): string {
	return result.content.map((c) => c.text ?? "").join("\n");
}
