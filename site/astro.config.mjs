import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://adsmart.digital",
	integrations: [
		starlight({
			title: "AdSmart",
			description:
				"Gerencie suas campanhas do Google Ads conversando com o Claude. Extensão open source para o Claude Desktop, 100% local.",
			logo: { src: "./src/gerado/logo.png", alt: "AdSmart" },
			favicon: "/favicon.png",
			locales: { root: { label: "Português", lang: "pt-BR" } },
			social: [
				{ icon: "github", label: "GitHub", href: "https://github.com/ZenniTTy/adsmart-app" },
			],
			customCss: ["./src/estilo.css"],
			sidebar: [
				{ label: "Documentação", items: [{ autogenerate: { directory: "docs" } }] },
				{ label: "Versões e novidades", link: "/novidades/" },
			],
		}),
	],
});
