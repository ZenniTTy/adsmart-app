import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";

export type RecordedRequest = {
	method: string;
	path: string;
	loginCustomerId: string | undefined;
	query: string | undefined;
	body: unknown;
};

export type FakeResponse = { status: number; body: unknown };

export type FakeHandler = (request: RecordedRequest) => FakeResponse;

export type FakeGoogle = {
	baseUrl: string;
	requests: RecordedRequest[];
	setHandler(handler: FakeHandler): void;
	close(): Promise<void>;
};

async function readBody(request: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of request) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString("utf8");
}

function parseBody(raw: string): { query: string | undefined; body: unknown } {
	if (!raw) {
		return { query: undefined, body: undefined };
	}
	const body: unknown = JSON.parse(raw);
	const query =
		body && typeof body === "object" && "query" in body && typeof body.query === "string"
			? body.query
			: undefined;
	return { query, body };
}

export async function startFakeGoogle(initial: FakeHandler): Promise<FakeGoogle> {
	let handler = initial;
	const requests: RecordedRequest[] = [];
	const server: Server = createServer(async (request, response) => {
		const header = request.headers["login-customer-id"];
		const recorded: RecordedRequest = {
			method: request.method ?? "",
			path: (request.url ?? "").replace(/^\/v0/, ""),
			loginCustomerId: typeof header === "string" ? header : undefined,
			...parseBody(await readBody(request)),
		};
		requests.push(recorded);
		const { status, body } = handler(recorded);
		response.writeHead(status, { "Content-Type": "application/json" });
		response.end(JSON.stringify(body));
	});
	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const { port } = server.address() as AddressInfo;
	return {
		baseUrl: `http://127.0.0.1:${port}/v0`,
		requests,
		setHandler(next) {
			handler = next;
		},
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}

export function googleFailure(status: number, category: string, code: string): FakeResponse {
	return {
		status,
		body: {
			error: {
				code: status,
				status: "FAILED",
				details: [
					{
						"@type": "type.googleapis.com/google.ads.googleads.v25.errors.GoogleAdsFailure",
						errors: [{ errorCode: { [category]: code }, message: "texto original" }],
						requestId: "req-e2e",
					},
				],
			},
		},
	};
}
