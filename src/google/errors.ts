import * as z from "zod/v4";
import { guideStep } from "../setup/roteiro.js";

export class AdsError extends Error {
	readonly code: string;
	readonly requestId: string | undefined;

	constructor(code: string, userMessage: string, requestId?: string) {
		super(requestId ? `${userMessage} (código da requisição: ${requestId})` : userMessage);
		this.name = "AdsError";
		this.code = code;
		this.requestId = requestId;
	}
}

const MESSAGES_BY_CODE: Record<string, string> = {
	CUSTOMER_NOT_FOUND:
		"A conta informada não foi encontrada. Use o ID de 10 dígitos exibido no topo do Google Ads, não o número da barra de endereço.",
	USER_PERMISSION_DENIED: `A conta de serviço não tem acesso a esta conta. Adicione o e-mail dela em Administrador > Acesso e segurança (${guideStep("acesso")}) ou, se a conta é gerenciada por uma MCC, informe o ID da MCC nas configurações.`,
	CUSTOMER_NOT_ENABLED: "Esta conta do Google Ads está desativada ou cancelada.",
	NOT_ADS_USER: `A conta de serviço não está vinculada a nenhuma conta do Google Ads. Refaça o ${guideStep("acesso")}.`,
	OAUTH_TOKEN_INVALID:
		"A autenticação com o Google falhou. Verifique se o arquivo de chave selecionado é o da conta de serviço correta.",
	RESOURCE_EXHAUSTED:
		"O limite diário de operações da API do Google Ads foi atingido. Tente novamente mais tarde.",
	CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION: `O projeto do Google Cloud ainda está no nível Teste. Solicite o nível Explorer (${guideStep("explorer")}).`,
	CONCURRENT_MODIFICATION:
		"Outra alteração estava sendo feita no mesmo item ao mesmo tempo. Nada foi aplicado. Gere uma nova prévia.",
	TRANSIENT_ERROR: "O Google Ads teve uma falha temporária. Tente novamente em alguns instantes.",
	INTERNAL_ERROR: "O Google Ads teve uma falha temporária. Tente novamente em alguns instantes.",
};

const GENERIC_MESSAGE = "O Google Ads recusou a solicitação por um motivo não reconhecido.";

const failureSchema = z.object({
	error: z.object({
		code: z.number().optional(),
		status: z.string().optional(),
		details: z
			.array(
				z.object({
					errors: z
						.array(
							z.object({
								errorCode: z.record(z.string(), z.string()).optional(),
								message: z.string().optional(),
							}),
						)
						.optional(),
					requestId: z.string().optional(),
				}),
			)
			.optional(),
	}),
});

export function parseGoogleAdsFailure(httpStatus: number, body: unknown): AdsError {
	const parsed = failureSchema.safeParse(body);
	if (!parsed.success) {
		return new AdsError(`HTTP_${httpStatus}`, GENERIC_MESSAGE);
	}
	const detail = parsed.data.error.details?.find((d) => d.errors && d.errors.length > 0);
	const requestId = parsed.data.error.details?.find((d) => d.requestId)?.requestId;
	const first = detail?.errors?.[0];
	const entry = first?.errorCode ? Object.entries(first.errorCode)[0] : undefined;
	if (!entry) {
		return new AdsError(
			parsed.data.error.status ?? `HTTP_${httpStatus}`,
			GENERIC_MESSAGE,
			requestId,
		);
	}
	const [category, code] = entry;
	const known = MESSAGES_BY_CODE[code];
	if (known) {
		return new AdsError(code, known, requestId);
	}
	if (category === "queryError" && first?.message) {
		return new AdsError(code, `A consulta GAQL é inválida: ${first.message}`, requestId);
	}
	return new AdsError(code, `${GENERIC_MESSAGE} Código: ${code}.`, requestId);
}

export function toUserMessage(error: unknown): string {
	if (error instanceof AdsError) {
		return error.message;
	}
	return "Ocorreu um erro inesperado no AdSmart. Rode o diagnóstico para identificar a causa.";
}
