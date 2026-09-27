import * as z from "zod/v4";

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

const envSchema = z.object({
	[KEY_FILE_ENV]: z.string().trim().min(1).optional(),
	[LOGIN_CUSTOMER_ID_ENV]: z.string().trim().optional(),
});

export function loadConfig(env: Record<string, string | undefined>): ConfigResult {
	const parsed = envSchema.safeParse(env);
	if (!parsed.success) {
		return { ok: false, message: "Não foi possível ler a configuração da extensão." };
	}
	const keyFile = parsed.data[KEY_FILE_ENV];
	if (!keyFile) {
		return {
			ok: false,
			message:
				"O arquivo de chave da conta de serviço não foi informado. Selecione o arquivo JSON nas configurações da extensão (passo 6 do guia de configuração).",
		};
	}
	const rawLogin = parsed.data[LOGIN_CUSTOMER_ID_ENV];
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
