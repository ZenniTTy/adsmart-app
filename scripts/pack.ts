import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const STAGING = join(ROOT, "dist", "pacote");

function run(command: string, args: string[]): void {
	const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit" });
	if (result.status !== 0) {
		throw new Error(`Falhou: ${command} ${args.join(" ")}`);
	}
}

function versionOf(file: string): string {
	const parsed: unknown = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
	if (
		parsed &&
		typeof parsed === "object" &&
		"version" in parsed &&
		typeof parsed.version === "string"
	) {
		return parsed.version;
	}
	throw new Error(`${file} não tem o campo version.`);
}

const version = versionOf("package.json");
if (versionOf("manifest.json") !== version) {
	throw new Error("A versão do manifest.json difere da do package.json.");
}

rmSync(STAGING, { recursive: true, force: true });
mkdirSync(join(STAGING, "server"), { recursive: true });
run("bun", [
	"build",
	"src/main.ts",
	"--target=node",
	"--format=esm",
	`--outfile=${join(STAGING, "server", "main.js")}`,
]);
for (const file of ["manifest.json", "icon.png", "LICENSE"]) {
	copyFileSync(join(ROOT, file), join(STAGING, file));
}

const output = join(ROOT, "dist", `adsmart-${version}.mcpb`);
run("bunx", ["mcpb", "validate", join(STAGING, "manifest.json")]);
run("bunx", ["mcpb", "pack", STAGING, output]);
