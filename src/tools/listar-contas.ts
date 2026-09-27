import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { toUserMessage } from "../google/errors.js";
import { failure, failureFrom, success, type ToolContext } from "./context.js";

const CUSTOMER_QUERY =
	"SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.status, customer.manager FROM customer LIMIT 1";
const CLIENTS_QUERY =
	"SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code, customer_client.status, customer_client.manager, customer_client.level FROM customer_client WHERE customer_client.level <= 1";

const accountFields = z.object({
	id: z.string(),
	descriptiveName: z.string().optional(),
	currencyCode: z.string().optional(),
	status: z.string().optional(),
	manager: z.boolean().optional(),
});
const customerRow = z.object({ customer: accountFields });
const clientRow = z.object({
	customerClient: accountFields.extend({ level: z.string().optional() }),
});

const accountSchema = z.object({
	id: z.string(),
	nome: z.string(),
	moeda: z.string(),
	status: z.string(),
	administradora: z.boolean(),
	acesso: z.enum(["direto", "mcc", "direto e mcc"]),
});
type Account = z.infer<typeof accountSchema>;

const outputSchema = z.object({ contas: z.array(accountSchema), avisos: z.array(z.string()) });

function toAccount(fields: z.infer<typeof accountFields>, acesso: Account["acesso"]): Account {
	return {
		id: fields.id,
		nome: fields.descriptiveName ?? "(sem nome)",
		moeda: fields.currencyCode ?? "",
		status: fields.status ?? "",
		administradora: fields.manager ?? false,
		acesso,
	};
}

export function registerListarContas(server: McpServer, context: ToolContext): void {
	server.registerTool(
		"listar_contas",
		{
			title: "Listar contas do Google Ads",
			description:
				"Lista as contas do Google Ads que a conta de serviço acessa, diretamente ou pela MCC configurada, com ID, nome, moeda, status e se é administradora.",
			outputSchema,
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			const ready = context.ready();
			if (!ready.ok) {
				return failure(ready.message);
			}
			const { google, config } = ready;
			const loginCustomerId = config.loginCustomerId;
			const accounts = new Map<string, Account>();
			const avisos: string[] = [];
			try {
				for (const id of await context.directCustomerIds()) {
					try {
						const { rows } = await google.ads.search(id, CUSTOMER_QUERY);
						const parsed = customerRow.safeParse(rows[0]);
						if (parsed.success) {
							accounts.set(id, toAccount(parsed.data.customer, "direto"));
						} else {
							avisos.push(`Conta ${id}: dados incompletos na resposta do Google Ads.`);
						}
					} catch (error) {
						avisos.push(`Conta ${id}: ${toUserMessage(error)}`);
					}
				}
				if (loginCustomerId) {
					const { rows } = await google.ads.search(loginCustomerId, CLIENTS_QUERY, loginCustomerId);
					for (const row of rows) {
						const parsed = clientRow.safeParse(row);
						if (!parsed.success) {
							continue;
						}
						const existing = accounts.get(parsed.data.customerClient.id);
						accounts.set(
							parsed.data.customerClient.id,
							toAccount(parsed.data.customerClient, existing ? "direto e mcc" : "mcc"),
						);
					}
				}
			} catch (error) {
				return failureFrom(error);
			}
			return success({ contas: [...accounts.values()], avisos });
		},
	);
}
