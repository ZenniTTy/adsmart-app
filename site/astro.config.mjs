import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { GTM_SCRIPT } from "./scripts/gtm.ts";

export default defineConfig({
	site: "https://adsmart.digital",
	integrations: [
		starlight({
			title: "AdSmart",
			description:
				"Gerencie suas campanhas do Google Ads conversando com o Claude. Extensão open source para o Claude Desktop, 100% local.",
			logo: {
				light: "./src/assets/logo-claro.png",
				dark: "./src/assets/logo-escuro.png",
				alt: "AdSmart",
				replacesTitle: true,
			},
			favicon: "/favicon.png",
			head: [
				{ tag: "script", content: GTM_SCRIPT },
				{ tag: "meta", attrs: { property: "og:image", content: "https://adsmart.digital/og.png" } },
				{ tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
				{ tag: "meta", attrs: { property: "og:image:height", content: "630" } },
				{
					tag: "meta",
					attrs: { property: "og:image:alt", content: "AdSmart: Google Ads pelo chat do Claude" },
				},
				{
					tag: "meta",
					attrs: { name: "twitter:image", content: "https://adsmart.digital/og.png" },
				},
				{ tag: "meta", attrs: { name: "theme-color", content: "#0a0a0a" } },
				{ tag: "link", attrs: { rel: "apple-touch-icon", href: "/apple-touch-icon.png" } },
			],
			locales: { root: { label: "Português", lang: "pt-BR" } },
			social: [
				{ icon: "github", label: "GitHub", href: "https://github.com/ZenniTTy/adsmart-app" },
			],
			components: {
				Hero: "./src/components/Hero.astro",
				Footer: "./src/components/Rodape.astro",
				PageFrame: "./src/components/PageFrame.astro",
			},
			customCss: [
				"@fontsource-variable/archivo/wdth.css",
				"@fontsource-variable/martian-mono/standard.css",
				"./src/estilo.css",
			],
			sidebar: [
				{ label: "Documentação", items: [{ autogenerate: { directory: "docs" } }] },
				{ label: "Versões e novidades", link: "/novidades/" },
			],
		}),
	],
});
