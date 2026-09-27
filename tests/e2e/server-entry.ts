import { readFile } from "node:fs/promises";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { loadConfig } from "../../src/config.js";
import { createAdsClient } from "../../src/google/ads-client.js";
import { createServiceAccountTokenProvider } from "../../src/google/auth.js";
import { createServer } from "../../src/server.js";

const fakeBaseUrl = process.env.ADSMART_TEST_FAKE_URL ?? "";
const tokenFails = process.env.ADSMART_TEST_TOKEN_FAILS === "1";

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
	}),
);
