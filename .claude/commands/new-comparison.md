---
description: Genera una comparativa entre 2-4 {{PRODUCTO_PLURAL}} a partir de ASINs o nombres de modelo.
argument-hint: <modelo A> vs <modelo B> [vs <modelo C>]
---

Quiero una comparativa de {{PRODUCTO_PLURAL}}: **$ARGUMENTS**

Pipeline:

1. **product-scraper** — obtén cada modelo (un JSON por producto) en `src/data/products/`.

2. **content-writer** — redacta una comparativa MDX en `src/content/comparisons/<slug>.mdx`:
   - Intro con contexto: a quién aplica cada producto, precios, posicionamiento en el nicho.
   - Tabla comparativa de especificaciones (dimensiones, peso, rango de uso, certificaciones aplicables, precio, rating Amazon).
   - Análisis por categorías según el tipo de producto (adapta los ejes relevantes: rendimiento, durabilidad, ergonomía, relación calidad-precio, etc.).
   - Pros/contras de cada uno basados en reseñas reales de Amazon (incluir al menos una crítica recurrente).
   - Veredicto: ganador según perfiles de comprador concretos del nicho (presupuesto, uso previsto, restricciones prácticas).
   - CTAs a Amazon para cada modelo.

3. **seo-optimizer** — aplica checklist. Añade schema `ItemList` además del estándar.

4. **deploy-checker** — valida build.

Si un producto no está disponible en Amazon.es o no existe aún, detente y reporta.
