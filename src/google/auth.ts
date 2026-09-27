import { readFile } from "node:fs/promises";
import { JWT } from "google-auth-library";
import * as z from "zod/v4";
import { AdsError } from "./errors.js";

export const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords";

export type TokenProvider = () => Promise<string>;

type AccessTokenClient = { getAccessToken(): Promise<{ token?: string | null }> };

export type AuthDeps = {
	readKeyFile: (path: string) => Promise<string>;
	createClient: (options: { email: string; key: string; scopes: string[] }) => AccessTokenClient;
};

const defaultDeps: AuthDeps = {
	readKeyFile: (path) => readFile(path, "utf8"),
	createClient: (options) => new JWT(options),
};

const serviceAccountKeySchema = z.object({
	type: z.literal("service_account"),
	client_email: z.string().min(1),
	private_key: z.string().min(1),
});

async function loadClient(keyFile: string, deps: AuthDeps): Promise<AccessTokenClient> {
	let raw: string;
	try {
		raw = await deps.readKeyFile(keyFile);
	} catch {
		throw new AdsError(
			"KEY_FILE_UNREADABLE",
			`Não foi possível ler o arquivo de chave em ${keyFile}. Confira se o arquivo existe e selecione-o novamente nas configurações da extensão.`,
		);
	}
	let json: unknown;
	try {
		json = JSON.parse(raw);
	} catch {
		json = undefined;
	}
	const key = serviceAccountKeySchema.safeParse(json);
	if (!key.success) {
		throw new AdsError(
			"KEY_FILE_INVALID",
			"O arquivo selecionado não é uma chave JSON de conta de serviço. Baixe a chave no passo 4 do guia de configuração.",
		);
	}
	return deps.createClient({
		email: key.data.client_email,
		key: key.data.private_key,
		scopes: [ADWORDS_SCOPE],
	});
}

export function createServiceAccountTokenProvider(
	keyFile: string,
	deps: AuthDeps = defaultDeps,
): TokenProvider {
	let client: Promise<AccessTokenClient> | undefined;
	return async () => {
		client ??= loadClient(keyFile, deps);
		let resolved: AccessTokenClient;
		try {
			resolved = await client;
		} catch (error) {
			client = undefined;
			throw error;
		}
		let token: string | null | undefined;
		try {
			token = (await resolved.getAccessToken()).token;
		} catch {
			token = undefined;
		}
		if (!token) {
			throw new AdsError(
				"TOKEN_FAILED",
				"Não foi possível autenticar com o Google usando a chave da conta de serviço. Confira se a chave não foi excluída no Google Cloud e se a Google Ads API está ativada no projeto.",
			);
		}
		return token;
	};
}
