import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { normalizeCustomerId } from "../config.js";
import { failure, failureFrom, success, type ToolContext } from "./context.js";
import { MAX_LIMIT, prepareQuery } from "./gaql.js";

const inputSchema = z.object({
	conta: z
		.string({ error: "Informe o ID da conta como texto, por exemplo 123-456-7890." })
		.describe("ID da conta do Google Ads, com ou sem traços (10 dígitos)."),
	gaql: z
		.string({ error: "Informe a consulta GAQL como texto." })
		.describe(
			`Consulta GAQL de leitura (SELECT). Sem LIMIT, o AdSmart aplica LIMIT 100; o máximo é ${MAX_LIMIT}.`,
		),
});

const outputSchema = z.object({
	conta: z.string(),
	consulta: z.string(),
	quantidade: z.number(),
	pode_haver_mais: z.boolean(),
	linhas: z.array(z.record(z.string(), z.unknown())),
});

export function registerConsultar(server: McpServer, context: ToolContext): void {
	server.registerTool(
		"consultar",
		{
			title: "Consultar dados do Google Ads",
			description:
				"Executa uma consulta GAQL somente leitura em uma conta do Google Ads e devolve até 1000 linhas.",
			inputSchema,
			outputSchema,
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ conta, gaql }) => {
			const ready = context.ready();
			if (!ready.ok) {
				return failure(ready.message);
			}
			const { google } = ready;
			const customerId = normalizeCustomerId(conta);
			if (!customerId) {
				return failure(
					"ID de conta inválido. Use os 10 dígitos exibidos no topo do Google Ads, com ou sem traços.",
				);
			}
			const prepared = prepareQuery(gaql);
			if (!prepared.ok) {
				return failure(prepared.message);
			}
			try {
				const loginCustomerId = await context.loginCustomerIdFor(customerId);
				const { rows, nextPageToken } = await google.ads.search(
					customerId,
					prepared.query,
					loginCustomerId,
				);
				return success({
					conta: customerId,
					consulta: prepared.query,
					quantidade: rows.length,
					pode_haver_mais: rows.length >= prepared.limit || nextPageToken !== undefined,
					linhas: rows,
				});
			} catch (error) {
				return failureFrom(error);
			}
		},
	);
}
