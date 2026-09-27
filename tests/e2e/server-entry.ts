import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { loadConfig } from "../../src/config.js";
import { createAdsClient } from "../../src/google/ads-client.js";
import { createServiceAccountTokenProvider } from "../../src/google/auth.js";
import { createServer } from "../../src/server.js";

const fakeBaseUrl = process.env.ADSMART_TEST_FAKE_URL ?? "";
const tokenFails = process.env.ADSMART_TEST_TOKEN_FAILS === "1";
const historyFile = process.env.ADSMART_TEST_HISTORY_FILE ?? "";
const clockFile = process.env.ADSMART_TEST_CLOCK_FILE;

function clockOffset(): number {
	if (!clockFile) {
		return 0;
	}
	try {
		return Number(readFileSync(clockFile, "utf8")) || 0;
	} catch {
		return 0;
	}
}

serveStdio(() =>
	createServer({
		config: loadConfig(process.env),
		connect: ({ keyFile }) => {
			const getToken = createServiceAccountTokenProvider(keyFile, {
				readKeyFile: (path) => readFile(path, "utf8"),
				createClient: () => ({
					getAccessToken: async () => {
						if (tokenFails) {
							throw new Error("falha simulada");
						}
						return { token: "token-falso" };
					},
				}),
			});
			return {
				getToken,
				ads: createAdsClient({ baseUrl: fakeBaseUrl, fetch: globalThis.fetch, getToken }),
			};
		},
		changes: {
			historyFile,
			now: () => Date.now() + clockOffset(),
			newId: randomUUID,
		},
	}),
);
