import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { createHistoryStore } from "../changes/history.js";
import { itemsSchema } from "../changes/items.js";
import { createPlanStore } from "../changes/plan-store.js";
import { type ChangeService, createChangeService } from "../changes/service.js";
import { normalizeCustomerId } from "../config.js";
import { failure, failureFrom, success, type ToolContext } from "./context.js";

export type ChangeToolsDeps = { historyFile: string; now: () => number; newId: () => string };

const previewSchema = z.object({
	id_plano: z.string().optional(),
	expira_em: z.string().optional(),
	conta: z.string(),
	itens: z.array(
		z.object({
			descricao: z.string(),
			antes: z.string(),
			depois: z.string(),
			destaques: z.array(z.string()),
		}),
	),
	sem_mudanca: z.array(z.string()),
	avisos: z.array(z.string()),
});

const INVALID_ACCOUNT =
	"ID de conta inválido. Use os 10 dígitos exibidos no topo do Google Ads, com ou sem traços.";

export function registerAlteracoes(
	server: McpServer,
	context: ToolContext,
	deps: ChangeToolsDeps,
): void {
	const history = createHistoryStore(deps.historyFile);
	const plans = createPlanStore(deps.now, deps.newId);
	let service: ChangeService | undefined;
	const changes = (): ChangeService | string => {
		const ready = context.ready();
		if (!ready.ok) {
			return ready.message;
		}
		service ??= createChangeService({
			ads: ready.google.ads,
			loginFor: context.loginCustomerIdFor,
			plans,
			history,
			now: deps.now,
			newId: deps.newId,
		});
		return service;
	};

	server.registerTool(
		"preparar_alteracao",
		{
			title: "Preparar alteração (prévia)",
			description:
				"Monta a prévia de uma ou mais alterações numa conta do Google Ads: lê os valores atuais, valida com o Google sem aplicar nada e devolve antes → depois, destaques e um id_plano válido por 15 minutos. Nada é alterado.",
			inputSchema: z.object({
				conta: z
					.string({ error: "Informe o ID da conta como texto." })
					.describe("ID da conta, com ou sem traços."),
				itens: itemsSchema.describe("Lista de alterações (até 100), todas da mesma conta."),
			}),
			outputSchema: previewSchema,
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ conta, itens }) => {
			const current = changes();
			if (typeof current === "string") {
				return failure(current);
			}
			const customerId = normalizeCustomerId(conta);
			if (!customerId) {
				return failure(INVALID_ACCOUNT);
			}
			try {
				return success(await current.preview(customerId, itens));
			} catch (error) {
				return failureFrom(error);
			}
		},
	);

	server.registerTool(
		"aplicar",
		{
			title: "Aplicar alteração",
			description:
				"Aplica um plano gerado por preparar_alteracao, depois que o usuário confirmou a prévia no chat. Recusa plano expirado, já usado ou com valores que mudaram desde a prévia.",
			inputSchema: z.object({
				id_plano: z.string({ error: "Informe o id_plano devolvido pela prévia." }),
			}),
			outputSchema: z.object({
				id_alteracao: z.string(),
				conta: z.string(),
				itens: z.array(z.string()),
			}),
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: true,
			},
		},
		async ({ id_plano }) => {
			const current = changes();
			if (typeof current === "string") {
				return failure(current);
			}
			try {
				return success(await current.apply(id_plano));
			} catch (error) {
				return failureFrom(error);
			}
		},
	);

	server.registerTool(
		"desfazer",
		{
			title: "Preparar desfazer",
			description:
				"Monta a prévia para desfazer uma alteração do histórico. Não aplica nada: o resultado traz um id_plano para aplicar depois da confirmação do usuário.",
			inputSchema: z.object({
				id_alteracao: z.string({ error: "Informe o id_alteracao do histórico." }),
			}),
			outputSchema: previewSchema,
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async ({ id_alteracao }) => {
			const current = changes();
			if (typeof current === "string") {
				return failure(current);
			}
			try {
				return success(await current.undo(id_alteracao));
			} catch (error) {
				return failureFrom(error);
			}
		},
	);

	server.registerTool(
		"historico",
		{
			title: "Histórico de alterações",
			description:
				"Lista as alterações feitas pelo AdSmart neste computador, mais recentes primeiro.",
			inputSchema: z.object({
				conta: z.string().optional().describe("Filtrar por conta (opcional)."),
				limite: z
					.number()
					.int()
					.min(1)
					.max(50)
					.optional()
					.describe("Quantidade máxima (padrão 10)."),
			}),
			outputSchema: z.object({
				alteracoes: z.array(
					z.object({
						id_alteracao: z.string(),
						data: z.string(),
						conta: z.string(),
						desfaz: z.string().optional(),
						itens: z.array(z.string()),
					}),
				),
			}),
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ conta, limite }) => {
			const customerId = conta === undefined ? undefined : normalizeCustomerId(conta);
			if (conta !== undefined && !customerId) {
				return failure(INVALID_ACCOUNT);
			}
			const entries = (await history.list())
				.filter((entry) => customerId === undefined || entry.conta === customerId)
				.reverse()
				.slice(0, limite ?? 10);
			return success({
				alteracoes: entries.map((entry) => ({
					id_alteracao: entry.id_alteracao,
					data: entry.data,
					conta: entry.conta,
					...(entry.desfaz ? { desfaz: entry.desfaz } : {}),
					itens: entry.itens.map((i) => `${i.descricao}: ${i.antes} → ${i.depois}`),
				})),
			});
		},
	);
}
