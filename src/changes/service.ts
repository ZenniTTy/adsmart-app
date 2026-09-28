import * as z from "zod/v4";
import type { AdsClient } from "../google/ads-client.js";
import { AdsError } from "../google/errors.js";
import type { HistoryEntry, HistoryStore } from "./history.js";
import type { Item } from "./items.js";
import { buildChange, type Change, inverseItem, readCurrent } from "./kinds.js";
import type { PlanStore } from "./plan-store.js";

export const ALWAYS_ALLOW_NOTE =
	'Se você escolher "Sempre permitir" para a ferramenta aplicar, o Claude aplica as alterações assim que você confirmar no chat, sem abrir outra janela. Tudo fica no histórico e pode ser desfeito.';

const RECENT_CHANGE_DAYS = 14;
const DAY_MS = 86_400_000;

export type ChangeServiceDeps = {
	ads: AdsClient;
	loginFor(customerId: string): Promise<string | undefined>;
	plans: PlanStore;
	history: HistoryStore;
	now(): number;
	newId(): string;
};

export type PreviewOutput = {
	id_plano?: string;
	expira_em?: string;
	conta: string;
	itens: Array<{ descricao: string; antes: string; depois: string; destaques: string[] }>;
	sem_mudanca: string[];
	avisos: string[];
};

export type ApplyOutput = { id_alteracao: string; conta: string; itens: string[] };

type Expectation = (current: string | null) => boolean;

const currencyRow = z.object({ customer: z.object({ currencyCode: z.string() }) });
const learningRow = z.object({
	campaign: z.object({ primaryStatusReasons: z.array(z.string()).optional() }),
});
const changeEventRow = z.object({ changeEvent: z.object({ changeDateTime: z.string() }) });

function isoDate(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

export function createChangeService(deps: ChangeServiceDeps) {
	async function reader(customerId: string) {
		const login = await deps.loginFor(customerId);
		return {
			login,
			read: async (query: string) => (await deps.ads.search(customerId, query, login)).rows,
		};
	}

	async function campaignWarnings(
		customerId: string,
		read: (query: string) => Promise<Record<string, unknown>[]>,
		campaignIds: Set<string>,
	): Promise<string[]> {
		const warnings: string[] = [];
		const from = isoDate(deps.now() - RECENT_CHANGE_DAYS * DAY_MS);
		const to = isoDate(deps.now());
		for (const campaignId of campaignIds) {
			const learning = learningRow.safeParse(
				(
					await read(
						`SELECT campaign.id, campaign.primary_status_reasons FROM campaign WHERE campaign.id = ${campaignId}`,
					)
				)[0],
			);
			if (
				learning.success &&
				learning.data.campaign.primaryStatusReasons?.includes("BIDDING_STRATEGY_LEARNING")
			) {
				warnings.push(
					`A campanha ${campaignId} está em fase de aprendizado da estratégia de lances; mudanças podem reiniciar o aprendizado.`,
				);
			}
			const recent = changeEventRow.safeParse(
				(
					await read(
						`SELECT change_event.change_date_time, change_event.campaign FROM change_event WHERE change_event.change_date_time >= '${from}' AND change_event.change_date_time <= '${to}' AND change_event.campaign = 'customers/${customerId}/campaigns/${campaignId}' ORDER BY change_event.change_date_time DESC LIMIT 1`,
					)
				)[0],
			);
			if (recent.success) {
				const changedAt = Date.parse(recent.data.changeEvent.changeDateTime.replace(" ", "T"));
				const days = Math.max(0, Math.floor((deps.now() - changedAt) / DAY_MS));
				warnings.push(
					`A campanha ${campaignId} foi alterada há ${days === 0 ? "menos de 1 dia" : `${days} dia(s)`}, inclusive por fora da AdSmart.`,
				);
			}
		}
		return warnings;
	}

	async function preview(
		customerId: string,
		items: Item[],
		options: { expect?: Expectation[]; undoOf?: string } = {},
	): Promise<PreviewOutput> {
		const { login, read } = await reader(customerId);
		const currency = currencyRow.safeParse(
			(await read("SELECT customer.currency_code FROM customer LIMIT 1"))[0],
		);
		const currencyCode = currency.success ? currency.data.customer.currencyCode : "BRL";
		const changes: Change[] = [];
		const kept: Item[] = [];
		const semMudanca: string[] = [];
		const campaignIds = new Set<string>();
		for (const [index, item] of items.entries()) {
			const current = await readCurrent(item, read);
			const expectation = options.expect?.[index];
			if (expectation && !expectation(current.value)) {
				throw new AdsError(
					"UNDO_DRIFT",
					"O valor atual não é mais o que a AdSmart deixou (alguém alterou depois). Não é seguro desfazer automaticamente.",
				);
			}
			const change = buildChange(item, customerId, current, currencyCode);
			if (!change.operation) {
				semMudanca.push(change.descricao);
				continue;
			}
			if (current.campaignId) {
				campaignIds.add(current.campaignId);
			}
			changes.push(change);
			kept.push(item);
		}
		if (changes.length === 0) {
			return {
				conta: customerId,
				itens: [],
				sem_mudanca: semMudanca,
				avisos: ["Nada a alterar: tudo já está como pedido."],
			};
		}
		const operations = changes.flatMap((change) => (change.operation ? [change.operation] : []));
		await deps.ads.mutate(customerId, operations, { validateOnly: true, loginCustomerId: login });
		const plan = deps.plans.save({
			customerId,
			loginCustomerId: login,
			items: kept,
			changes,
			operations,
			undoOf: options.undoOf,
		});
		const avisos = [...(await campaignWarnings(customerId, read, campaignIds)), ALWAYS_ALLOW_NOTE];
		return {
			id_plano: plan.id,
			expira_em: new Date(plan.expiresAt).toISOString(),
			conta: customerId,
			itens: changes.map(({ descricao, antes, depois, destaques }) => ({
				descricao,
				antes,
				depois,
				destaques,
			})),
			sem_mudanca: semMudanca,
			avisos,
		};
	}

	async function apply(planId: string): Promise<ApplyOutput> {
		const taken = deps.plans.take(planId);
		if (!taken.ok) {
			const reason = {
				inexistente: "Plano não encontrado. Gere uma nova prévia com preparar_alteracao.",
				expirado: "O plano expirou (validade de 15 minutos). Gere uma nova prévia.",
				usado: "Este plano já foi aplicado. Para outra alteração, gere uma nova prévia.",
			}[taken.reason];
			throw new AdsError("PLAN_UNAVAILABLE", reason);
		}
		const { plan } = taken;
		const { read } = await reader(plan.customerId);
		for (const [index, item] of plan.items.entries()) {
			const change = plan.changes[index];
			const current = await readCurrent(item, read);
			if (change && current.value !== change.before) {
				throw new AdsError(
					"PLAN_DRIFT",
					`${change.descricao} mudou desde a prévia. Nada foi aplicado. Gere uma nova prévia.`,
				);
			}
		}
		const created = await deps.ads.mutate(plan.customerId, plan.operations, {
			validateOnly: false,
			loginCustomerId: plan.loginCustomerId,
		});
		const entry: HistoryEntry = {
			id_alteracao: deps.newId(),
			data: new Date(deps.now()).toISOString(),
			conta: plan.customerId,
			...(plan.undoOf ? { desfaz: plan.undoOf } : {}),
			itens: plan.items.map((item, index) => {
				const change = plan.changes[index] as Change;
				return {
					descricao: change.descricao,
					antes: change.antes,
					depois: change.depois,
					item,
					after: change.after,
					kind: change.kind,
					desfazer: inverseItem(item, change.before, created[index] ?? ""),
				};
			}),
		};
		await deps.history.append(entry);
		return {
			id_alteracao: entry.id_alteracao,
			conta: plan.customerId,
			itens: entry.itens.map((i) => `${i.descricao}: ${i.antes} → ${i.depois}`),
		};
	}

	async function undo(changeId: string): Promise<PreviewOutput> {
		const entry = (await deps.history.list()).find((e) => e.id_alteracao === changeId);
		if (!entry) {
			throw new AdsError(
				"CHANGE_NOT_FOUND",
				"Alteração não encontrada no histórico deste computador.",
			);
		}
		const undoable = entry.itens.filter((i) => i.desfazer !== null);
		if (undoable.length === 0) {
			throw new AdsError(
				"NOT_UNDOABLE",
				"Esta alteração não pode ser desfeita: remoções são irreversíveis.",
			);
		}
		const items = undoable.map((i) => i.desfazer as Item);
		const expect: Expectation[] = undoable.map((i) =>
			i.kind === "create"
				? (current) => current !== null && current !== "REMOVED"
				: (current) => current === i.after,
		);
		const output = await preview(entry.conta, items, { expect, undoOf: entry.id_alteracao });
		const skipped = entry.itens
			.filter((i) => i.desfazer === null)
			.map((i) => `${i.descricao}: não pode ser desfeita.`);
		return { ...output, avisos: [...skipped, ...output.avisos] };
	}

	return { preview, apply, undo };
}

export type ChangeService = ReturnType<typeof createChangeService>;
