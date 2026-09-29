import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import * as z from "zod/v4";
import { itemSchema } from "./items.js";

const entryItemSchema = z.object({
	descricao: z.string(),
	antes: z.string(),
	depois: z.string(),
	item: itemSchema,
	after: z.string(),
	kind: z.enum(["update", "create", "remove"]),
	desfazer: itemSchema.nullable(),
});

const entrySchema = z.object({
	id_alteracao: z.string(),
	data: z.string(),
	conta: z.string(),
	desfaz: z.string().optional(),
	itens: z.array(entryItemSchema),
});

export type HistoryEntry = z.infer<typeof entrySchema>;
export type HistoryItem = z.infer<typeof entryItemSchema>;

export type HistoryStore = {
	append(entry: HistoryEntry): Promise<void>;
	list(): Promise<HistoryEntry[]>;
};

export function createHistoryStore(file: string): HistoryStore {
	return {
		async append(entry) {
			await mkdir(dirname(file), { recursive: true, mode: 0o700 });
			await appendFile(file, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 });
		},
		async list() {
			let text: string;
			try {
				text = await readFile(file, "utf8");
			} catch {
				return [];
			}
			return text
				.split("\n")
				.filter((line) => line.trim().length > 0)
				.flatMap((line) => {
					try {
						const parsed = entrySchema.safeParse(JSON.parse(line));
						return parsed.success ? [parsed.data] : [];
					} catch {
						return [];
					}
				});
		},
	};
}
