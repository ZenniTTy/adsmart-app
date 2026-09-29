import {
	copyFileSync,
	cpSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { paginaDeChangelog, paginaDeDoc, versaoLancada } from "./conteudo.ts";

const SITE = join(import.meta.dir, "..");
const RAIZ = join(SITE, "..");
const DOCS_GERADOS = join(SITE, "src", "content", "docs", "docs");
const GERADO = join(SITE, "src", "gerado");
const CONTENT_DOCS = join(SITE, "src", "content", "docs");

rmSync(DOCS_GERADOS, { recursive: true, force: true });
mkdirSync(DOCS_GERADOS, { recursive: true });
mkdirSync(GERADO, { recursive: true });
mkdirSync(join(SITE, "public"), { recursive: true });

for (const arquivo of readdirSync(join(RAIZ, "docs")).filter((nome) => nome.endsWith(".md"))) {
	const pagina = paginaDeDoc(arquivo, readFileSync(join(RAIZ, "docs", arquivo), "utf8"));
	writeFileSync(join(DOCS_GERADOS, `${pagina.slug}.md`), pagina.conteudo);
}

const changelog = readFileSync(process.env.CHANGELOG_ARQUIVO ?? join(RAIZ, "CHANGELOG.md"), "utf8");
const novidades = paginaDeChangelog(changelog);
writeFileSync(join(CONTENT_DOCS, `${novidades.slug}.md`), novidades.conteudo);
writeFileSync(
	join(GERADO, "lancamento.json"),
	`${JSON.stringify({ versao: versaoLancada(changelog) })}\n`,
);

for (const idioma of ["en", "es"] as const) {
	const pasta = join(CONTENT_DOCS, idioma);
	mkdirSync(join(pasta, "docs"), { recursive: true });
	cpSync(DOCS_GERADOS, join(pasta, "docs"), { recursive: true });
	writeFileSync(join(pasta, `${novidades.slug}.md`), novidades.conteudo);
}

copyFileSync(join(RAIZ, "icon.png"), join(SITE, "public", "favicon.png"));
