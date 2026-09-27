import * as z from "zod/v4";
import type { GaqlRow, MutateOperation } from "../google/ads-client.js";
import { AdsError } from "../google/errors.js";
import type { Item } from "./items.js";
import { formatMoney, increaseAboveHalf, toMicros } from "./money.js";

export type Reader = (query: string) => Promise<GaqlRow[]>;

export type Current = {
	value: string | null;
	campaignId: string | undefined;
	budgetResource?: string;
	sharedBudget?: boolean;
};

export type Change = {
	descricao: string;
	antes: string;
	depois: string;
	destaques: string[];
	before: string | null;
	after: string;
	operation: MutateOperation | null;
	kind: "update" | "create" | "remove";
};

const STATUS_TO_API = { ATIVO: "ENABLED", PAUSADO: "PAUSED" } as const;
const MATCH_TO_API = { AMPLA: "BROAD", FRASE: "PHRASE", EXATA: "EXACT" } as const;
const MATCH_LABEL = { AMPLA: "ampla", FRASE: "de frase", EXATA: "exata" } as const;
const STATUS_LABEL: Record<string, string> = {
	ENABLED: "ativo",
	PAUSED: "pausado",
	REMOVED: "removido",
};

const HEADLINE_PINS = ["HEADLINE_1", "HEADLINE_2", "HEADLINE_3"];
const DESCRIPTION_PINS = ["DESCRIPTION_1", "DESCRIPTION_2"];

const campaignPart = z.object({ id: z.string() });
const withCampaign = <T extends z.ZodRawShape>(shape: T) =>
	z.object({ campaign: campaignPart.optional(), ...shape });

const budgetRow = withCampaign({
	campaignBudget: z.object({
		resourceName: z.string(),
		amountMicros: z.string().optional(),
		referenceCount: z.string().optional(),
	}),
});
const campaignRow = z.object({
	campaign: z.object({ id: z.string(), status: z.string().optional() }),
});
const adGroupRow = withCampaign({
	adGroup: z.object({ status: z.string().optional(), cpcBidMicros: z.string().optional() }),
});
const assetRow = z.object({ text: z.string(), pinnedField: z.string().optional() });
const adGroupAdRow = withCampaign({
	adGroupAd: z.object({
		status: z.string().optional(),
		ad: z
			.object({
				responsiveSearchAd: z
					.object({
						headlines: z.array(assetRow).optional(),
						descriptions: z.array(assetRow).optional(),
					})
					.optional(),
			})
			.optional(),
	}),
});
const criterionRow = withCampaign({
	adGroupCriterion: z.object({
		resourceName: z.string().optional(),
		status: z.string().optional(),
		cpcBidMicros: z.string().optional(),
	}),
});
const campaignCriterionRow = withCampaign({
	campaignCriterion: z.object({
		resourceName: z.string().optional(),
		status: z.string().optional(),
	}),
});

function notFound(label: string): AdsError {
	return new AdsError("ITEM_NOT_FOUND", `${label} não foi encontrado nesta conta. Confira o ID.`);
}

async function one<T>(
	read: Reader,
	query: string,
	schema: z.ZodType<T>,
	label: string,
): Promise<T> {
	const rows = await read(query);
	const parsed = schema.safeParse(rows[0]);
	if (!parsed.success) {
		throw notFound(label);
	}
	return parsed.data;
}

async function optional<T>(
	read: Reader,
	query: string,
	schema: z.ZodType<T>,
): Promise<T | undefined> {
	const rows = await read(query);
	const parsed = schema.safeParse(rows[0]);
	return parsed.success ? parsed.data : undefined;
}

type RsaAsset = { texto: string; fixado?: number | undefined };
type RsaContent = { titulos: RsaAsset[]; descricoes: RsaAsset[] };

type StatusItem = Extract<
	Item,
	{ tipo: "status_campanha" | "status_grupo" | "status_anuncio" | "status_palavra_chave" }
>;

function statusTarget(item: StatusItem, base: string) {
	switch (item.tipo) {
		case "status_campanha":
			return {
				label: `Status da campanha ${item.campanha_id}`,
				key: "campaignOperation",
				resource: `${base}/campaigns/${item.campanha_id}`,
			};
		case "status_grupo":
			return {
				label: `Status do grupo ${item.grupo_id}`,
				key: "adGroupOperation",
				resource: `${base}/adGroups/${item.grupo_id}`,
			};
		case "status_anuncio":
			return {
				label: `Status do anúncio ${item.anuncio_id}`,
				key: "adGroupAdOperation",
				resource: `${base}/adGroupAds/${item.grupo_id}~${item.anuncio_id}`,
			};
		case "status_palavra_chave":
			return {
				label: `Status da palavra-chave ${item.criterio_id}`,
				key: "adGroupCriterionOperation",
				resource: `${base}/adGroupCriteria/${item.grupo_id}~${item.criterio_id}`,
			};
	}
}

function rsaDisplay(key: string | null): string {
	if (key === null) {
		return "sem valor";
	}
	const content = JSON.parse(key) as RsaContent;
	const show = (assets: RsaAsset[]) =>
		assets
			.map((a) => (a.fixado ? `${a.texto} [fixo na posição ${a.fixado}]` : a.texto))
			.join(" | ");
	return `Títulos: ${show(content.titulos)} · Descrições: ${show(content.descricoes)}`;
}

function fromApiAssets(
	assets: Array<{ text: string; pinnedField?: string | undefined }>,
	pins: string[],
) {
	return assets.map((asset) => {
		const index = asset.pinnedField ? pins.indexOf(asset.pinnedField) : -1;
		return index >= 0 ? { texto: asset.text, fixado: index + 1 } : { texto: asset.text };
	});
}

function toApiAssets(
	assets: Array<{ texto: string; fixado?: number | undefined }>,
	pins: string[],
) {
	return assets.map((asset) =>
		asset.fixado
			? { text: asset.texto, pinnedField: pins[asset.fixado - 1] }
			: { text: asset.texto },
	);
}

function rsaKey(content: RsaContent): string {
	return JSON.stringify(content);
}

export async function readCurrent(item: Item, read: Reader): Promise<Current> {
	switch (item.tipo) {
		case "orcamento": {
			const row = await one(
				read,
				`SELECT campaign.id, campaign_budget.resource_name, campaign_budget.amount_micros, campaign_budget.reference_count FROM campaign WHERE campaign.id = ${item.campanha_id}`,
				budgetRow,
				`A campanha ${item.campanha_id}`,
			);
			return {
				value: row.campaignBudget.amountMicros ?? null,
				campaignId: row.campaign?.id,
				budgetResource: row.campaignBudget.resourceName,
				sharedBudget: Number(row.campaignBudget.referenceCount ?? "1") > 1,
			};
		}
		case "status_campanha": {
			const row = await one(
				read,
				`SELECT campaign.id, campaign.status FROM campaign WHERE campaign.id = ${item.campanha_id}`,
				campaignRow,
				`A campanha ${item.campanha_id}`,
			);
			return { value: row.campaign.status ?? null, campaignId: row.campaign.id };
		}
		case "status_grupo":
		case "lance_grupo": {
			const row = await one(
				read,
				`SELECT campaign.id, ad_group.status, ad_group.cpc_bid_micros FROM ad_group WHERE ad_group.id = ${item.grupo_id}`,
				adGroupRow,
				`O grupo ${item.grupo_id}`,
			);
			return {
				value:
					item.tipo === "status_grupo"
						? (row.adGroup.status ?? null)
						: (row.adGroup.cpcBidMicros ?? null),
				campaignId: row.campaign?.id,
			};
		}
		case "status_anuncio":
		case "editar_rsa": {
			const row = await one(
				read,
				`SELECT campaign.id, ad_group_ad.status, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions FROM ad_group_ad WHERE ad_group.id = ${item.grupo_id} AND ad_group_ad.ad.id = ${item.anuncio_id}`,
				adGroupAdRow,
				`O anúncio ${item.anuncio_id}`,
			);
			if (item.tipo === "status_anuncio") {
				return { value: row.adGroupAd.status ?? null, campaignId: row.campaign?.id };
			}
			const rsa = row.adGroupAd.ad?.responsiveSearchAd;
			if (!rsa) {
				throw new AdsError(
					"NOT_RSA",
					`O anúncio ${item.anuncio_id} não é um anúncio responsivo de pesquisa.`,
				);
			}
			return {
				value: rsaKey({
					titulos: fromApiAssets(rsa.headlines ?? [], HEADLINE_PINS),
					descricoes: fromApiAssets(rsa.descriptions ?? [], DESCRIPTION_PINS),
				}),
				campaignId: row.campaign?.id,
			};
		}
		case "status_palavra_chave":
		case "lance_palavra_chave":
		case "remover_palavra_chave":
		case "remover_negativa_grupo": {
			const row = await one(
				read,
				`SELECT campaign.id, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros FROM ad_group_criterion WHERE ad_group.id = ${item.grupo_id} AND ad_group_criterion.criterion_id = ${item.criterio_id}`,
				criterionRow,
				`O critério ${item.criterio_id}`,
			);
			const value =
				item.tipo === "lance_palavra_chave"
					? (row.adGroupCriterion.cpcBidMicros ?? null)
					: (row.adGroupCriterion.status ?? null);
			return { value, campaignId: row.campaign?.id };
		}
		case "remover_negativa_campanha": {
			const row = await one(
				read,
				`SELECT campaign.id, campaign_criterion.status FROM campaign_criterion WHERE campaign.id = ${item.campanha_id} AND campaign_criterion.criterion_id = ${item.criterio_id}`,
				campaignCriterionRow,
				`A negativa ${item.criterio_id}`,
			);
			return { value: row.campaignCriterion.status ?? "ENABLED", campaignId: row.campaign?.id };
		}
		case "adicionar_palavra_chave":
		case "adicionar_negativa_grupo": {
			const group = await one(
				read,
				`SELECT campaign.id, ad_group.status FROM ad_group WHERE ad_group.id = ${item.grupo_id}`,
				adGroupRow,
				`O grupo ${item.grupo_id}`,
			);
			const negative = item.tipo === "adicionar_negativa_grupo" ? "TRUE" : "FALSE";
			const existing = await optional(
				read,
				`SELECT campaign.id, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group.id = ${item.grupo_id} AND ad_group_criterion.keyword.text = '${item.texto}' AND ad_group_criterion.keyword.match_type = '${MATCH_TO_API[item.correspondencia]}' AND ad_group_criterion.negative = ${negative} AND ad_group_criterion.status != 'REMOVED'`,
				criterionRow,
			);
			return {
				value: existing?.adGroupCriterion.resourceName ?? null,
				campaignId: group.campaign?.id,
			};
		}
		case "adicionar_negativa_campanha": {
			await one(
				read,
				`SELECT campaign.id, campaign.status FROM campaign WHERE campaign.id = ${item.campanha_id}`,
				campaignRow,
				`A campanha ${item.campanha_id}`,
			);
			const existing = await optional(
				read,
				`SELECT campaign.id, campaign_criterion.resource_name FROM campaign_criterion WHERE campaign.id = ${item.campanha_id} AND campaign_criterion.keyword.text = '${item.texto}' AND campaign_criterion.keyword.match_type = '${MATCH_TO_API[item.correspondencia]}' AND campaign_criterion.negative = TRUE`,
				campaignCriterionRow,
			);
			return {
				value: existing?.campaignCriterion.resourceName ?? null,
				campaignId: item.campanha_id,
			};
		}
	}
}

function statusLabel(value: string | null): string {
	return value ? (STATUS_LABEL[value] ?? value.toLowerCase()) : "sem valor";
}

function update(
	operationKey: string,
	resourceName: string,
	fields: Record<string, unknown>,
	mask: string,
): MutateOperation {
	return { [operationKey]: { update: { resourceName, ...fields }, updateMask: mask } };
}

export function buildChange(
	item: Item,
	customerId: string,
	current: Current,
	currency: string,
): Change {
	const base = `customers/${customerId}`;
	switch (item.tipo) {
		case "orcamento": {
			const after = toMicros(item.valor);
			const destaques: string[] = [];
			if (increaseAboveHalf(current.value, after)) {
				destaques.push("Aumento acima de 50% no orçamento diário.");
			}
			if (current.sharedBudget) {
				destaques.push(
					"Este orçamento é compartilhado com outras campanhas: a mudança vale para todas.",
				);
			}
			return {
				descricao: `Orçamento diário da campanha ${item.campanha_id}`,
				antes: formatMoney(current.value, currency),
				depois: formatMoney(after, currency),
				destaques,
				before: current.value,
				after,
				operation:
					current.value === after
						? null
						: update(
								"campaignBudgetOperation",
								current.budgetResource ?? "",
								{ amountMicros: after },
								"amountMicros",
							),
				kind: "update",
			};
		}
		case "status_campanha":
		case "status_grupo":
		case "status_anuncio":
		case "status_palavra_chave": {
			const after = STATUS_TO_API[item.novo_status];
			const target = statusTarget(item, base);
			return {
				descricao: target.label,
				antes: statusLabel(current.value),
				depois: statusLabel(after),
				destaques: [],
				before: current.value,
				after,
				operation:
					current.value === after
						? null
						: update(target.key, target.resource, { status: after }, "status"),
				kind: "update",
			};
		}
		case "lance_grupo":
		case "lance_palavra_chave": {
			const after = toMicros(item.valor);
			const isGroup = item.tipo === "lance_grupo";
			const resource =
				item.tipo === "lance_grupo"
					? `${base}/adGroups/${item.grupo_id}`
					: `${base}/adGroupCriteria/${item.grupo_id}~${item.criterio_id}`;
			return {
				descricao:
					item.tipo === "lance_grupo"
						? `Lance máximo de CPC do grupo ${item.grupo_id}`
						: `Lance máximo de CPC da palavra-chave ${item.criterio_id}`,
				antes: formatMoney(current.value, currency),
				depois: formatMoney(after, currency),
				destaques: increaseAboveHalf(current.value, after)
					? ["Aumento acima de 50% no lance."]
					: [],
				before: current.value,
				after,
				operation:
					current.value === after
						? null
						: update(
								isGroup ? "adGroupOperation" : "adGroupCriterionOperation",
								resource,
								{ cpcBidMicros: after },
								"cpcBidMicros",
							),
				kind: "update",
			};
		}
		case "adicionar_palavra_chave":
		case "adicionar_negativa_grupo":
		case "adicionar_negativa_campanha": {
			const negative = item.tipo !== "adicionar_palavra_chave";
			const keyword = { text: item.texto, matchType: MATCH_TO_API[item.correspondencia] };
			const label = `"${item.texto}" (correspondência ${MATCH_LABEL[item.correspondencia]})`;
			const operation: MutateOperation =
				item.tipo === "adicionar_negativa_campanha"
					? {
							campaignCriterionOperation: {
								create: {
									campaign: `${base}/campaigns/${item.campanha_id}`,
									negative: true,
									keyword,
								},
							},
						}
					: {
							adGroupCriterionOperation: {
								create: negative
									? { adGroup: `${base}/adGroups/${item.grupo_id}`, negative: true, keyword }
									: { adGroup: `${base}/adGroups/${item.grupo_id}`, status: "ENABLED", keyword },
							},
						};
			return {
				descricao:
					item.tipo === "adicionar_palavra_chave"
						? `Nova palavra-chave ${label} no grupo ${item.grupo_id}`
						: item.tipo === "adicionar_negativa_grupo"
							? `Nova negativa ${label} no grupo ${item.grupo_id}`
							: `Nova negativa ${label} na campanha ${item.campanha_id}`,
				antes: current.value ? "já existe" : "não existe",
				depois: "criada",
				destaques:
					item.tipo === "adicionar_palavra_chave"
						? [
								"A palavra-chave nasce ativa e começa a rodar se o grupo e a campanha estiverem ativos.",
							]
						: [],
				before: current.value,
				after: "criada",
				operation: current.value ? null : operation,
				kind: "create",
			};
		}
		case "remover_palavra_chave":
		case "remover_negativa_grupo":
		case "remover_negativa_campanha": {
			const resource =
				item.tipo === "remover_negativa_campanha"
					? `${base}/campaignCriteria/${item.campanha_id}~${item.criterio_id}`
					: `${base}/adGroupCriteria/${item.grupo_id}~${item.criterio_id}`;
			const key =
				item.tipo === "remover_negativa_campanha"
					? "campaignCriterionOperation"
					: "adGroupCriterionOperation";
			return {
				descricao:
					item.tipo === "remover_palavra_chave"
						? `Remover a palavra-chave ${item.criterio_id}`
						: `Remover a negativa ${item.criterio_id}`,
				antes: statusLabel(current.value),
				depois: "removido",
				destaques: ["Remoção é irreversível: não pode ser desfeita."],
				before: current.value,
				after: "REMOVED",
				operation: current.value === "REMOVED" ? null : { [key]: { remove: resource } },
				kind: "remove",
			};
		}
		case "editar_rsa": {
			const content: RsaContent = { titulos: item.titulos, descricoes: item.descricoes };
			const after = rsaKey(content);
			return {
				descricao: `Títulos e descrições do anúncio ${item.anuncio_id}`,
				antes: rsaDisplay(current.value),
				depois: rsaDisplay(after),
				destaques: ["O anúncio volta para a revisão de políticas do Google."],
				before: current.value,
				after,
				operation:
					current.value === after
						? null
						: update(
								"adOperation",
								`${base}/ads/${item.anuncio_id}`,
								{
									responsiveSearchAd: {
										headlines: toApiAssets(item.titulos, HEADLINE_PINS),
										descriptions: toApiAssets(item.descricoes, DESCRIPTION_PINS),
									},
								},
								"responsiveSearchAd.headlines,responsiveSearchAd.descriptions",
							),
				kind: "update",
			};
		}
	}
}

export function inverseItem(
	item: Item,
	before: string | null,
	createdResource: string,
): Item | null {
	switch (item.tipo) {
		case "orcamento":
		case "lance_grupo":
		case "lance_palavra_chave":
			return before === null ? null : { ...item, valor: Number(before) / 1_000_000 };
		case "status_campanha":
		case "status_grupo":
		case "status_anuncio":
		case "status_palavra_chave":
			return before === "ENABLED" || before === "PAUSED"
				? { ...item, novo_status: before === "ENABLED" ? "ATIVO" : "PAUSADO" }
				: null;
		case "editar_rsa": {
			if (before === null) {
				return null;
			}
			const content = JSON.parse(before) as RsaContent;
			return { ...item, titulos: content.titulos, descricoes: content.descricoes };
		}
		case "adicionar_palavra_chave":
		case "adicionar_negativa_grupo": {
			const criterio = createdResource.split("~")[1];
			if (!criterio) {
				return null;
			}
			return item.tipo === "adicionar_palavra_chave"
				? { tipo: "remover_palavra_chave", grupo_id: item.grupo_id, criterio_id: criterio }
				: { tipo: "remover_negativa_grupo", grupo_id: item.grupo_id, criterio_id: criterio };
		}
		case "adicionar_negativa_campanha": {
			const criterio = createdResource.split("~")[1];
			return criterio
				? {
						tipo: "remover_negativa_campanha",
						campanha_id: item.campanha_id,
						criterio_id: criterio,
					}
				: null;
		}
		case "remover_palavra_chave":
		case "remover_negativa_grupo":
		case "remover_negativa_campanha":
			return null;
	}
}
