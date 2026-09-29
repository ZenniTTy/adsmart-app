import { describe, expect, test } from "bun:test";
import { AdsError, parseGoogleAdsFailure, toUserMessage } from "../../src/google/errors.js";

function failure(category: string, code: string, message = "texto original do Google") {
	return {
		error: {
			code: 403,
			message: "The caller does not have permission",
			status: "PERMISSION_DENIED",
			details: [
				{
					"@type": "type.googleapis.com/google.ads.googleads.v25.errors.GoogleAdsFailure",
					errors: [{ errorCode: { [category]: code }, message }],
					requestId: "req-teste-1",
				},
			],
		},
	};
}

describe("ERR-01 tradução dos erros do Google Ads", () => {
	test.each([
		["authenticationError", "CUSTOMER_NOT_FOUND", "não foi encontrada"],
		["authorizationError", "USER_PERMISSION_DENIED", "não tem acesso"],
		["authorizationError", "CUSTOMER_NOT_ENABLED", "desativada ou cancelada"],
		["authenticationError", "NOT_ADS_USER", "não está vinculada"],
		["authenticationError", "OAUTH_TOKEN_INVALID", "autenticação"],
		["quotaError", "RESOURCE_EXHAUSTED", "limite diário"],
		["authorizationError", "CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION", "nível Teste"],
	])("%s.%s vira mensagem pt-BR com requestId", (category, code, expected) => {
		const error = parseGoogleAdsFailure(403, failure(category, code));
		expect(error.code).toBe(code);
		expect(error.message).toContain(expected);
		expect(error.message).toContain("req-teste-1");
		expect(error.message).not.toContain("texto original do Google");
	});

	test("código desconhecido cai na mensagem genérica sem texto cru", () => {
		const error = parseGoogleAdsFailure(400, failure("fieldError", "ALGO_NOVO"));
		expect(error.message).toContain("motivo não reconhecido");
		expect(error.message).toContain("ALGO_NOVO");
		expect(error.message).not.toContain("texto original do Google");
	});

	test("erro de consulta repassa a explicação do Google para corrigir a GAQL", () => {
		const error = parseGoogleAdsFailure(
			400,
			failure("queryError", "UNRECOGNIZED_FIELD", "Unrecognized field in the query"),
		);
		expect(error.message).toContain("A consulta GAQL é inválida");
		expect(error.message).toContain("Unrecognized field");
	});

	test("corpo fora do formato vira mensagem genérica", () => {
		expect(parseGoogleAdsFailure(502, "<html>").code).toBe("HTTP_502");
		expect(parseGoogleAdsFailure(500, { error: {} }).message).toContain("motivo não reconhecido");
	});

	test("toUserMessage não repassa erro desconhecido", () => {
		expect(toUserMessage(new Error("detalhe interno"))).not.toContain("detalhe interno");
		expect(toUserMessage(new AdsError("X", "mensagem"))).toBe("mensagem");
	});
});

describe("API-05 sem retry automático", () => {
	test.each(["TRANSIENT_ERROR", "INTERNAL_ERROR"])("%s pede nova tentativa ao usuário", (code) => {
		const error = parseGoogleAdsFailure(500, failure("internalError", code));
		expect(error.message).toContain("Tente novamente");
		expect(error.message).toContain("req-teste-1");
	});
});
