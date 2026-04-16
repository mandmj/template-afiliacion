# Template afiliación

Plantilla Astro para sitios de afiliación de nicho en España (Amazon Afiliados + Awin).
Pensada para lanzar sitios de reviews, comparativas y guías con SEO técnico completo en 1-2 h.

## Qué incluye

- **Stack**: Astro 5, Tailwind CSS, Space Grotesk + Inter.
- **SEO**: schema.org Review/Product/FAQPage/Article/Organization/Person, canonicals, sitemap automático, robots.txt + llms.txt con bots IA permitidos (OpenAI, Anthropic, Perplexity).
- **Analítica**: Vercel Web Analytics + Speed Insights (sin cookies), Google Analytics 4 con Consent Mode v2, Microsoft Clarity con consent.
- **Afiliación**: Amazon tag + Awin multi-retailer (`RetailerList.astro`) + tracking de clicks con parámetros personalizados a Vercel y GA4.
- **RGPD**: banner de cookies, política de cookies, aviso legal y privacidad.
- **Automatización**:
  - Scraper Amazon (fallback HTML) + wrapper PA-API 5.0.
  - Cron semanal de actualización de precios (GitHub Actions, lunes 9h Madrid).
  - Ping IndexNow automático a Bing en cada push con cambios de contenido.
- **Claude Code**: 4 subagentes (product-scraper, content-writer, seo-optimizer, deploy-checker) + slash commands `/new-review` y `/new-comparison`.

## Arrancar un sitio nuevo

1. **"Use this template"** en GitHub → crea repo nuevo.
2. Clona localmente y `npm install`.
3. Sigue el paso a paso en [`NEW_SITE_CHECKLIST.md`](./NEW_SITE_CHECKLIST.md) (~1-2 h).

## Stack tecnológico

- [Astro 5](https://astro.build) — SSG rápido con componentes.
- [Tailwind CSS](https://tailwindcss.com) — estilos atómicos.
- [AstroWind](https://github.com/arthelokyo/astrowind) — componentes base reutilizados.
- Content Collections con Zod — validación de frontmatter de reviews/guías.
- [`sharp`](https://sharp.pixelplumbing.com) + [`png-to-ico`](https://www.npmjs.com/package/png-to-ico) — generación de favicons.
- [`cheerio`](https://cheerio.js.org) — parser HTML para el scraper fallback.
- [`amazon-paapi`](https://github.com/jorgerosal/amazon-paapi) — wrapper Amazon PA-API 5.0.

## Licencia

MIT. Reutiliza libremente para tus proyectos personales/comerciales.
