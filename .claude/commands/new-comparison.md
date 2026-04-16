---
description: Genera una comparativa entre 2-4 patinetes eléctricos a partir de ASINs o nombres de modelo.
argument-hint: <modelo A> vs <modelo B> [vs <modelo C>]
---

Quiero una comparativa de patinetes eléctricos: **$ARGUMENTS**

Pipeline:

1. **product-scraper** — obtén cada modelo (un JSON por producto) en `src/data/products/`.

2. **content-writer** — redacta una comparativa MDX en `src/content/comparisons/<slug>.mdx`:
   - Intro con contexto: quién compra cada uno, precios, posicionamiento.
   - Tabla comparativa de especificaciones.
   - Análisis por categorías: autonomía, potencia, frenos, peso, precio/calidad.
   - Pros/contras de cada uno.
   - Veredicto: ganador según perfil de usuario (commuter, off-road, ocasional).
   - CTAs a Amazon para cada modelo.

3. **seo-optimizer** — aplica checklist. Añade schema `ItemList` además del estándar.

4. **deploy-checker** — valida build.

Si un producto no está disponible en Amazon.es, detente y reporta.
