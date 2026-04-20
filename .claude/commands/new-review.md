---
description: Genera una review completa de un {{PRODUCTO_SINGULAR}} a partir de un ASIN o keywords. Orquesta product-scraper → content-writer → seo-optimizer → deploy-checker.
argument-hint: <ASIN-o-keywords>
---

Quiero una nueva review de {{PRODUCTO_SINGULAR}} para: **$ARGUMENTS**

Ejecuta el siguiente pipeline en orden, lanzando cada subagente con el Agent tool:

1. **product-scraper** — obtén el producto:
   - Si `$ARGUMENTS` parece un ASIN (10 caracteres alfanuméricos empezando por B), usa `--asin`.
   - En caso contrario, usa `--search "$ARGUMENTS" --limit 1`.
   - Espera a que devuelva la ruta del JSON en `src/data/products/`. Ese JSON debe llevar `images[]` con 5 URLs hi-res (para las figuras inline).

2. **content-writer** — lee ese JSON y redacta la review MDX completa siguiendo las reglas de estilo. Guárdala en `src/content/reviews/<slug>.mdx`. Debe insertar **≥2 `<ProductFigure>`** usando `product.images[1]` y `product.images[2]` con alt descriptivo.

3. **seo-optimizer** — aplica la checklist SEO sobre el MDX recién creado.

4. **deploy-checker** — ejecuta las validaciones. Su primer paso es `node scripts/insert-review-images.mjs`, que autocompleta figuras si el content-writer no las metió. Si todo pasa, informa al usuario con el resumen y la URL previsible (`https://{{DOMAIN}}/reviews/<slug>`).

Si cualquier paso falla, detente y reporta el error al usuario sin continuar con los siguientes.
