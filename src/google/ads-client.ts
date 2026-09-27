import * as z from "zod/v4";
import type { TokenProvider } from "./auth.js";
import { AdsError, parseGoogleAdsFailure } from "./errors.js";

export const GOOGLE_ADS_API_VERSION = "v25";
export const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export type HttpFetch = (url: string, init: RequestInit) => Promise<Response>;

export type GaqlRow = Record<string, unknown>;

export type SearchResult = { rows: GaqlRow[]; nextPageToken: string | undefined };

export type AdsClient = {
	listAccessibleCustomerIds(): Promise<string[]>;
	search(customerId: string, query: string, loginCustomerId?: string): Promise<SearchResult>;
};

export type AdsClientOptions = {
	baseUrl: string;
	fetch: HttpFetch;
	getToken: TokenProvider;
};

const accessibleSchema = z.object({ resourceNames: z.array(z.string()).optional() });

const searchSchema = z.object({
	results: z.array(z.record(z.string(), z.unknown())).optional(),
	nextPageToken: z.string().optional(),
});

function invalidResponse(): AdsError {
	return new AdsError("INVALID_RESPONSE", "O Google Ads respondeu em um formato inesperado.");
}

export function createAdsClient(options: AdsClientOptions): AdsClient {
	async function request(
		method: "GET" | "POST",
		path: string,
		body?: unknown,
		loginCustomerId?: string,
	): Promise<unknown> {
		const token = await options.getToken();
		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};
		if (loginCustomerId) {
			headers["login-customer-id"] = loginCustomerId;
		}
		const init: RequestInit = { method, headers };
		if (body !== undefined) {
			init.body = JSON.stringify(body);
		}
		let response: Response;
		try {
			response = await options.fetch(`${options.baseUrl}${path}`, init);
		} catch {
			throw new AdsError(
				"NETWORK",
				"Não foi possível conectar ao Google Ads. Verifique sua conexão com a internet.",
			);
		}
		const text = await response.text();
		let json: unknown;
		try {
			json = text ? JSON.parse(text) : {};
		} catch {
			json = undefined;
		}
		if (!response.ok) {
			throw parseGoogleAdsFailure(response.status, json);
		}
		if (json === undefined) {
			throw invalidResponse();
		}
		return json;
	}

	return {
		async listAccessibleCustomerIds() {
			const parsed = accessibleSchema.safeParse(
				await request("GET", "/customers:listAccessibleCustomers"),
			);
			if (!parsed.success) {
				throw invalidResponse();
			}
			return (parsed.data.resourceNames ?? []).map((name) => name.replace("customers/", ""));
		},
		async search(customerId, query, loginCustomerId) {
			const parsed = searchSchema.safeParse(
				await request(
					"POST",
					`/customers/${customerId}/googleAds:search`,
					{ query },
					loginCustomerId,
				),
			);
			if (!parsed.success) {
				throw invalidResponse();
			}
			return { rows: parsed.data.results ?? [], nextPageToken: parsed.data.nextPageToken };
		},
	};
}
