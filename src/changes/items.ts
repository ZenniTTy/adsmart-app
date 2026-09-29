import * as z from "zod/v4";

export const MAX_ITEMS_PER_PLAN = 100;

const id = (label: string) =>
	z
		.string({ error: `Informe ${label} como texto.` })
		.regex(/^\d+$/, { error: `${label} deve conter só dígitos.` });

const amount = z
	.number({ error: "Informe o valor como número, por exemplo 12.5." })
	.positive({ error: "O valor precisa ser maior que zero." })
	.refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9, {
		error: "O valor pode ter no máximo 2 casas decimais.",
	});

const status = z.enum(["ATIVO", "PAUSADO"], { error: "O novo status deve ser ATIVO ou PAUSADO." });

const matchType = z.enum(["AMPLA", "FRASE", "EXATA"], {
	error: "A correspondência deve ser AMPLA, FRASE ou EXATA.",
});

const keywordText = z
	.string({ error: "Informe o texto da palavra-chave." })
	.trim()
	.min(1, { error: "O texto da palavra-chave não pode ficar vazio." })
	.refine((text) => !/['"\\]/.test(text), {
		error: "O texto da palavra-chave não pode conter aspas nem barra invertida.",
	});

const asset = (maxPin: number) =>
	z.object({
		texto: z.string().trim().min(1, { error: "Textos do anúncio não podem ficar vazios." }),
		fixado: z
			.number()
			.int()
			.min(1)
			.max(maxPin, { error: `A posição fixada vai de 1 a ${maxPin}.` })
			.optional(),
	});

export const itemSchema = z.discriminatedUnion(
	"tipo",
	[
		z.object({ tipo: z.literal("orcamento"), campanha_id: id("campanha_id"), valor: amount }),
		z.object({
			tipo: z.literal("status_campanha"),
			campanha_id: id("campanha_id"),
			novo_status: status,
		}),
		z.object({ tipo: z.literal("status_grupo"), grupo_id: id("grupo_id"), novo_status: status }),
		z.object({
			tipo: z.literal("status_anuncio"),
			grupo_id: id("grupo_id"),
			anuncio_id: id("anuncio_id"),
			novo_status: status,
		}),
		z.object({
			tipo: z.literal("status_palavra_chave"),
			grupo_id: id("grupo_id"),
			criterio_id: id("criterio_id"),
			novo_status: status,
		}),
		z.object({ tipo: z.literal("lance_grupo"), grupo_id: id("grupo_id"), valor: amount }),
		z.object({
			tipo: z.literal("lance_palavra_chave"),
			grupo_id: id("grupo_id"),
			criterio_id: id("criterio_id"),
			valor: amount,
		}),
		z.object({
			tipo: z.literal("adicionar_palavra_chave"),
			grupo_id: id("grupo_id"),
			texto: keywordText,
			correspondencia: matchType,
		}),
		z.object({
			tipo: z.literal("adicionar_negativa_campanha"),
			campanha_id: id("campanha_id"),
			texto: keywordText,
			correspondencia: matchType,
		}),
		z.object({
			tipo: z.literal("adicionar_negativa_grupo"),
			grupo_id: id("grupo_id"),
			texto: keywordText,
			correspondencia: matchType,
		}),
		z.object({
			tipo: z.literal("remover_palavra_chave"),
			grupo_id: id("grupo_id"),
			criterio_id: id("criterio_id"),
		}),
		z.object({
			tipo: z.literal("remover_negativa_campanha"),
			campanha_id: id("campanha_id"),
			criterio_id: id("criterio_id"),
		}),
		z.object({
			tipo: z.literal("remover_negativa_grupo"),
			grupo_id: id("grupo_id"),
			criterio_id: id("criterio_id"),
		}),
		z.object({
			tipo: z.literal("editar_rsa"),
			grupo_id: id("grupo_id"),
			anuncio_id: id("anuncio_id"),
			titulos: z
				.array(asset(3))
				.min(3, { error: "O anúncio responsivo precisa de pelo menos 3 títulos." })
				.max(15, { error: "O anúncio responsivo aceita no máximo 15 títulos." }),
			descricoes: z
				.array(asset(2))
				.min(2, { error: "O anúncio responsivo precisa de pelo menos 2 descrições." })
				.max(4, { error: "O anúncio responsivo aceita no máximo 4 descrições." }),
		}),
	],
	{ error: "Tipo de alteração desconhecido." },
);

export type Item = z.infer<typeof itemSchema>;

export const itemsSchema = z
	.array(itemSchema)
	.min(1, { error: "Informe pelo menos uma alteração." })
	.max(MAX_ITEMS_PER_PLAN, {
		error: `Um plano aceita no máximo ${MAX_ITEMS_PER_PLAN} alterações.`,
	});
