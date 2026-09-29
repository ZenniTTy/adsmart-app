import type { MutateOperation } from "../google/ads-client.js";
import type { Item } from "./items.js";
import type { Change } from "./kinds.js";

export const PLAN_TTL_MS = 15 * 60 * 1000;

export type Plan = {
	id: string;
	customerId: string;
	loginCustomerId: string | undefined;
	items: Item[];
	changes: Change[];
	operations: MutateOperation[];
	expiresAt: number;
	undoOf: string | undefined;
};

export type TakeResult =
	| { ok: true; plan: Plan }
	| { ok: false; reason: "inexistente" | "expirado" | "usado" };

export type PlanStore = {
	save(plan: Omit<Plan, "id" | "expiresAt">): Plan;
	take(id: string): TakeResult;
};

export function createPlanStore(now: () => number, newId: () => string): PlanStore {
	const plans = new Map<string, Plan>();
	const used = new Set<string>();
	return {
		save(draft) {
			const plan: Plan = { ...draft, id: newId(), expiresAt: now() + PLAN_TTL_MS };
			plans.set(plan.id, plan);
			return plan;
		},
		take(id) {
			if (used.has(id)) {
				return { ok: false, reason: "usado" };
			}
			const plan = plans.get(id);
			if (!plan) {
				return { ok: false, reason: "inexistente" };
			}
			plans.delete(id);
			if (now() > plan.expiresAt) {
				return { ok: false, reason: "expirado" };
			}
			used.add(id);
			return { ok: true, plan };
		},
	};
}
