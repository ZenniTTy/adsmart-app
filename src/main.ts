import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { loadConfig } from "./config.js";
import { createAdsClient, GOOGLE_ADS_BASE_URL } from "./google/ads-client.js";
import { createServiceAccountTokenProvider } from "./google/auth.js";
import { createServer } from "./server.js";

const config = loadConfig(process.env);

serveStdio(() =>
	createServer({
		config,
		connect: ({ keyFile }) => {
			const getToken = createServiceAccountTokenProvider(keyFile);
			return {
				getToken,
				ads: createAdsClient({ baseUrl: GOOGLE_ADS_BASE_URL, fetch: globalThis.fetch, getToken }),
			};
		},
	}),
);
