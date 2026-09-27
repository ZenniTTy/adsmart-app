export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 1000;

export type PreparedQuery =
	| { ok: true; query: string; limit: number }
	| { ok: false; message: string };

export function prepareQuery(raw: string): PreparedQuery {
	const query = raw.trim().replace(/;\s*$/, "");
	if (query.includes(";")) {
		return { ok: false, message: "Envie uma única consulta GAQL por vez, sem ponto e vírgula." };
	}
	if (!/^select\s/i.test(query)) {
		return {
			ok: false,
			message: "Só consultas de leitura são aceitas: a GAQL precisa começar com SELECT.",
		};
	}
	const limitMatch = /\bLIMIT\s+(\d+)\b/i.exec(query);
	if (limitMatch) {
		const limit = Number(limitMatch[1]);
		if (limit < 1 || limit > MAX_LIMIT) {
			return { ok: false, message: `O LIMIT precisa estar entre 1 e ${MAX_LIMIT}.` };
		}
		return { ok: true, query, limit };
	}
	const parameters = /\bPARAMETERS\b/i.exec(query);
	const withLimit = parameters
		? `${query.slice(0, parameters.index).trimEnd()} LIMIT ${DEFAULT_LIMIT} ${query.slice(parameters.index)}`
		: `${query} LIMIT ${DEFAULT_LIMIT}`;
	return { ok: true, query: withLimit, limit: DEFAULT_LIMIT };
}
