# Template de afiliación — Instrucciones

## Qué es este repo

**Plantilla base** para lanzar sitios de afiliación de nicho con:
- Astro 5 + Tailwind + Space Grotesk.
- Schema.org completo (Review, Product, FAQPage, Article, Organization, Person).
- Analítica sin cookies (Vercel) + GA4 con Consent Mode v2 + Microsoft Clarity.
- Cookie banner RGPD.
- Tracking de clicks afiliados a Vercel + GA4.
- Scraper Amazon fallback + PA-API 5.0.
- Awin multi-retailer (buildAwinUrl + RetailerList).
- Cron semanal de actualización de precios (GitHub Actions).
- IndexNow automático a Bing en cada push.
- robots.txt + llms.txt con bots de IA permitidos.
- Subagentes Claude Code: product-scraper, content-writer, seo-optimizer, deploy-checker.
- Slash commands `/new-review` y `/new-comparison`.

## Cuando clones este template

1. Renombra el repo en GitHub.
2. Sustituye los placeholders (ver sección siguiente).
3. Rellena `src/pages/categoria/[slug].astro` con tu mapa de categorías.
4. Rellena `src/navigation.ts` con las categorías reales.
5. Personaliza el hero de `src/pages/index.astro` y las 3 FAQ.
6. Adapta `src/pages/guia-de-compra.astro` al nicho.
7. Reemplaza `src/assets/favicons/favicon.svg` por uno propio del nicho.
8. Reemplaza `src/assets/images/default.png` por un OG image del nicho.
9. Genera una nueva key IndexNow con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` y pon ese valor en `scripts/indexnow-ping.mjs` + renombra el archivo `public/<KEY>.txt`.
10. Crea `.env` a partir de `.env.example`.
11. Deploy: conecta el repo a Vercel o Cloudflare Pages.

## Placeholders obligatorios a sustituir

Búsqueda global (`{{` en el código):

| Placeholder | Significado | Ejemplo |
|---|---|---|
| `{{SITE_NAME}}` | Nombre visible de la marca | "Comprar Proyector 4K" |
| `{{DOMAIN}}` | Dominio sin protocolo | "comprarproyector4k.es" |
| `{{TAGLINE}}` | Lema corto del sitio | "Reviews y guías de compra 2026" |
| `{{META_DESCRIPTION}}` | Meta description general | "Análisis de los mejores..." |
| `{{HERO_TITLE}}` | Título principal del hero | "El proyector 4K ideal" |
| `{{HERO_TITLE_ACCENT}}` | Parte acento del hero | "sin sorpresas" |
| `{{HERO_SUBTITLE}}` | Subtítulo del hero | "Reviews honestas con..." |
| `{{FAQ_1_Q}} / {{FAQ_1_A}}` | Pregunta+respuesta 1 | — |
| `{{FAQ_2_Q}} / {{FAQ_2_A}}` | Pregunta+respuesta 2 | — |
| `{{FAQ_3_Q}} / {{FAQ_3_A}}` | Pregunta+respuesta 3 | — |
| `{{PRODUCTO_SINGULAR}}` | Término principal singular | "proyector 4K" |
| `{{PRODUCTO_PLURAL}}` | Término principal plural | "proyectores 4K" |
| `{{SECTOR}}` | Sector general | "cine en casa" |
| `{{AUTOR}}` | Nombre del autor | "Mario Martín Jiménez" |
| `{{NIF}}` | NIF del autor/empresa | "50234713E" |
| `{{DOMICILIO}}` | Dirección postal completa | "Av. X nº Y, 28044 Madrid" |
| `{{EMAIL}}` | Email de contacto | "contacto@comprar...es" |
| `{{AMAZON_TAG}}` | Tag Amazon Afiliados | "prox0e-21" |
| `{{AWIN_PUBLISHER_ID}}` | Publisher ID Awin | "2857781" |
| `{{INDEXNOW_KEY}}` | Key IndexNow del dominio | generar con Node crypto |

## Cómo crear reviews en un sitio ya inicializado

Mismo flujo que antes en el proyecto original:

```
/new-review B0XXXXXXX
```

o conversacional:

> "Añade review para el ASIN B0XXXXXXX"

Los subagentes (`.claude/agents/`) orquestan scrape → redacción → SEO → build.

## Reglas editoriales (ajustar por nicho)

- **Idioma**: español de España (tú/vosotros, €).
- **Tono**: experto cercano, honesto, sin hype. Contras reales en cada review.
- **Longitud**: 1.200-2.500 palabras por review, 1.200-1.800 por guía, 2.000-3.500 por comparativa.
- **Keywords semilla**: adapta la lista en `.claude/agents/content-writer.md` al nicho concreto.
- **Estructura review**: intro → para quién es → specs → análisis por apartados → pros/contras → veredicto → alternativas → disclaimer.

## Estructura del proyecto

```
src/
├── components/
│   ├── afiliados/        → botones, cards, sticky CTA, disclaimer, RetailerList, ScoreBadge
│   ├── common/           → Analytics, Clarity, CookieBanner, AmazonClickTracker
│   └── content/          → ReviewCard, Breadcrumb, RelatedReviews, MiniCompareTable
├── content/              → config.ts (schemas Zod) + carpetas vacías
├── data/products/        → JSON scrapeados de Amazon
├── lib/
│   ├── amazon.ts         → wrapper PA-API
│   └── awin.ts           → builder de deep-links Awin
├── pages/                → rutas estáticas + dinámicas
└── navigation.ts         → header + footer

scripts/
├── fetch-products.mjs    → PA-API scraper oficial
├── scrape-product.mjs    → fallback HTML scraper
├── update-prices.mjs     → cron semanal de refresco
└── indexnow-ping.mjs     → notifica Bing tras publicación

.claude/
├── agents/               → 4 subagentes
└── commands/             → slash commands /new-review y /new-comparison

.github/workflows/
├── update-prices.yml     → lunes 09h Madrid
└── indexnow.yml          → en cada push con cambios de contenido
```

## Decisiones de arquitectura

- **No monorepo**: un repo por nicho. Aislamiento total, más fácil de mantener/vender.
- **Amazon directo**: Amazon Afiliados nunca va por Awin. Tag en `.env` (`AMAZON_PARTNER_TAG`).
- **Awin como segunda red**: mismo Publisher ID para todos los sitios del mismo titular.
- **Sin Partytown**: GA4 carga directo con Consent Mode para respetar GDPR sin degradar UX.
- **Sin blog AstroWind**: `apps.blog.isEnabled = false`. Las reviews/comparativas/guías usan colecciones propias.
