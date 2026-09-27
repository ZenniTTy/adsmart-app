import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { AdsError, toUserMessage } from "../google/errors.js";
import { success, type ToolContext } from "./context.js";

const statusSchema = z.enum(["OK", "FALHA", "NÃO VERIFICADO", "NÃO SE APLICA"]);

const outputSchema = z.object({
	tudo_ok: z.boolean(),
	etapas: z.array(z.object({ etapa: z.string(), status: statusSchema, detalhe: z.string() })),
});

type Step = z.infer<typeof outputSchema>["etapas"][number];

const STEP_NAMES = [
	"Configuração da extensão",
	"Arquivo de chave",
	"Autenticação com o Google",
	"Contas acessíveis",
	"Conta de administrador (MCC)",
] as const;

function pending(from: number): Step[] {
	return STEP_NAMES.slice(from).map((etapa) => ({
		etapa,
		status: "NÃO VERIFICADO",
		detalhe: "Depende da etapa anterior.",
	}));
}

async function runSteps(context: ToolContext): Promise<Step[]> {
	const [configStep, keyStep, authStep, accountsStep, mccStep] = STEP_NAMES;
	const ready = context.ready();
	if (!ready.ok) {
		return [{ etapa: configStep, status: "FALHA", detalhe: ready.message }, ...pending(1)];
	}
	const { config, google } = ready;
	const steps: Step[] = [{ etapa: configStep, status: "OK", detalhe: "Variáveis lidas." }];
	try {
		await google.getToken();
		steps.push({ etapa: keyStep, status: "OK", detalhe: "Chave lida." });
		steps.push({ etapa: authStep, status: "OK", detalhe: "Token obtido." });
	} catch (error) {
		const keyProblem = error instanceof AdsError && error.code.startsWith("KEY_FILE");
		if (keyProblem) {
			return [
				...steps,
				{ etapa: keyStep, status: "FALHA", detalhe: toUserMessage(error) },
				...pending(2),
			];
		}
		steps.push({ etapa: keyStep, status: "OK", detalhe: "Chave lida." });
		return [
			...steps,
			{ etapa: authStep, status: "FALHA", detalhe: toUserMessage(error) },
			...pending(3),
		];
	}
	try {
		const ids = await context.directCustomerIds();
		if (ids.length === 0 && !config.loginCustomerId) {
			return [
				...steps,
				{
					etapa: accountsStep,
					status: "FALHA",
					detalhe:
						"Nenhuma conta do Google Ads deu acesso à conta de serviço. Refaça o passo 5 do guia de configuração.",
				},
				...pending(4),
			];
		}
		steps.push({
			etapa: accountsStep,
			status: "OK",
			detalhe: `${ids.length} conta(s) com acesso direto.`,
		});
	} catch (error) {
		return [
			...steps,
			{ etapa: accountsStep, status: "FALHA", detalhe: toUserMessage(error) },
			...pending(4),
		];
	}
	if (!config.loginCustomerId) {
		return [
			...steps,
			{ etapa: mccStep, status: "NÃO SE APLICA", detalhe: "Nenhuma MCC configurada." },
		];
	}
	try {
		await google.ads.search(
			config.loginCustomerId,
			"SELECT customer.id FROM customer LIMIT 1",
			config.loginCustomerId,
		);
		steps.push({ etapa: mccStep, status: "OK", detalhe: "Acesso à MCC confirmado." });
	} catch (error) {
		steps.push({ etapa: mccStep, status: "FALHA", detalhe: toUserMessage(error) });
	}
	return steps;
}

export function registerDiagnostico(server: McpServer, context: ToolContext): void {
	server.registerTool(
		"diagnostico",
		{
			title: "Diagnóstico do AdSmart",
			description:
				"Verifica, em ordem, a configuração da extensão, o arquivo de chave, a autenticação com o Google, as contas acessíveis e a MCC. Use primeiro quando algo não funcionar.",
			outputSchema,
			annotations: { readOnlyHint: true, openWorldHint: true },
		},
		async () => {
			const etapas = await runSteps(context);
			return success({
				tudo_ok: etapas.every((s) => s.status === "OK" || s.status === "NÃO SE APLICA"),
				etapas,
			});
		},
	);
}
