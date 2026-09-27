import type { Config, ConfigResult } from "../config.js";
import type { AdsClient } from "../google/ads-client.js";
import type { TokenProvider } from "../google/auth.js";
import { toUserMessage } from "../google/errors.js";

export type GoogleServices = { getToken: TokenProvider; ads: AdsClient };

export type Ready =
	| { ok: true; config: Config; google: GoogleServices }
	| { ok: false; message: string };

export type ToolContext = {
	ready(): Ready;
	directCustomerIds(): Promise<string[]>;
};

export type TextResult = {
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
};

export function createToolContext(
	config: ConfigResult,
	connect: (config: Config) => GoogleServices,
): ToolContext {
	let services: GoogleServices | undefined;
	let directIds: Promise<string[]> | undefined;
	const ready = (): Ready => {
		if (!config.ok) {
			return config;
		}
		services ??= connect(config.config);
		return { ok: true, config: config.config, google: services };
	};
	return {
		ready,
		directCustomerIds() {
			const current = ready();
			if (!current.ok) {
				return Promise.resolve([]);
			}
			directIds ??= current.google.ads.listAccessibleCustomerIds().catch((error: unknown) => {
				directIds = undefined;
				throw error;
			});
			return directIds;
		},
	};
}

export function success<T extends Record<string, unknown>>(output: T) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(output) }],
		structuredContent: output,
	};
}

export function failure(message: string): TextResult {
	return { content: [{ type: "text", text: message }], isError: true };
}

export function failureFrom(error: unknown): TextResult {
	return failure(toUserMessage(error));
}
