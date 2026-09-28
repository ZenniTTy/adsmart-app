import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { SETUP_GUIDE } from "../setup/roteiro.js";
import { success } from "./context.js";

const actionSchema = z.object({ quem: z.enum(["voce", "claude"]), texto: z.string() });

const outputSchema = z.object({
	antes_de_comecar: z.array(actionSchema),
	passos: z.array(
		z.object({
			numero: z.number(),
			chave: z.string(),
			titulo: z.string(),
			link: z.string().nullable(),
			acoes: z.array(actionSchema),
			como_saber: z.string(),
			retomada: z.string(),
		}),
	),
	regras: z.array(z.string()),
	modos: z.object({ navegador: z.string(), manual: z.string() }),
	depois: z.string(),
});

export function registerGuiaConfiguracao(server: McpServer): void {
	server.registerTool(
		"guia_configuracao",
		{
			title: "Guia de configuração do AdSmart",
			description:
				"Devolve o roteiro para configurar o AdSmart do zero: pré-requisitos, os 7 passos no Google Cloud e no Google Ads, quem faz cada ação e as regras que o Claude segue. Use quando a pessoa quiser configurar o AdSmart ou quando o diagnóstico indicar que falta a chave. Conduza um passo por vez; nas ações marcadas como `voce`, pare e espere a pessoa avisar que concluiu. Siga sempre as regras devolvidas.",
			inputSchema: z.object({}),
			outputSchema,
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async () => success(SETUP_GUIDE),
	);
}
