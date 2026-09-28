import * as z from "zod/v4";
import { guideStep } from "./setup/roteiro.js";

export const KEY_FILE_ENV = "ADSMART_KEY_FILE";
export const LOGIN_CUSTOMER_ID_ENV = "ADSMART_LOGIN_CUSTOMER_ID";

export type Config = {
	keyFile: string;
	loginCustomerId?: string;
};

export type ConfigResult = { ok: true; config: Config } | { ok: false; message: string };

export function normalizeCustomerId(raw: string): string | undefined {
	const digits = raw.trim().replaceAll("-", "");
	return /^\d{10}$/.test(digits) ? digits : undefined;
}

const UNRESOLVED_PLACEHOLDER = /^\$\{user_config\.[A-Za-z0-9_]+\}$/;

const providedValue = z
	.string()
	.trim()
	.transform((value) => (UNRESOLVED_PLACEHOLDER.test(value) ? "" : value));

const envSchema = z.object({
	[KEY_FILE_ENV]: providedValue.optional(),
	[LOGIN_CUSTOMER_ID_ENV]: providedValue.optional(),
});

export function loadConfig(env: Record<string, string | undefined>): ConfigResult {
	const parsed = envSchema.parse(env);
	const keyFile = parsed[KEY_FILE_ENV];
	if (!keyFile) {
		return {
			ok: false,
			message: `O arquivo de chave da conta de serviço não foi informado. Se você ainda não tem a chave, peça ao Claude "Me ajude a configurar a AdSmart" (ferramenta guia_configuracao). Se já tem, selecione o arquivo JSON nas configurações da extensão (${guideStep("extensao")}).`,
		};
	}
	const rawLogin = parsed[LOGIN_CUSTOMER_ID_ENV];
	if (!rawLogin) {
		return { ok: true, config: { keyFile } };
	}
	const loginCustomerId = normalizeCustomerId(rawLogin);
	if (!loginCustomerId) {
		return {
			ok: false,
			message:
				"O ID da conta de administrador (MCC) é inválido. Informe os 10 dígitos exibidos no topo do Google Ads, com ou sem traços.",
		};
	}
	return { ok: true, config: { keyFile, loginCustomerId } };
}
