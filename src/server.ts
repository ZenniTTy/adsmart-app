import { McpServer } from "@modelcontextprotocol/server";
import packageJson from "../package.json" with { type: "json" };
import type { Config, ConfigResult } from "./config.js";
import { type ChangeToolsDeps, registerAlteracoes } from "./tools/alteracoes.js";
import { registerConsultar } from "./tools/consultar.js";
import { createToolContext, type GoogleServices } from "./tools/context.js";
import { registerDiagnostico } from "./tools/diagnostico.js";
import { registerListarContas } from "./tools/listar-contas.js";

export type ServerDeps = {
	config: ConfigResult;
	connect: (config: Config) => GoogleServices;
	changes: ChangeToolsDeps;
};

export function createServer(deps: ServerDeps): McpServer {
	const server = new McpServer({ name: "adsmart", version: packageJson.version });
	const context = createToolContext(deps.config, deps.connect);
	registerDiagnostico(server, context);
	registerListarContas(server, context);
	registerConsultar(server, context);
	registerAlteracoes(server, context, deps.changes);
	return server;
}
