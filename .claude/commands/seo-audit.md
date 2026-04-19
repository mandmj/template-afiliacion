---
description: Auditoría SEO completa del sitio o de una URL específica. Orquesta 7 agentes en paralelo (technical, schema, sitemap, content, canibalización, freshness, CWV) y consolida el output en docs/seo/.
argument-hint: [url-opcional]
---

Audita SEO de: **${ARGUMENTS:-sitio completo (todas las piezas de src/content/)}**

Ejecuta el siguiente pipeline invocando cada subagente con la tool `Agent`. **Prioridad: correr en paralelo** siempre que sea posible (un único mensaje con múltiples tool calls).

## Orquestación

### Grupo 1 — análisis de URL (si $ARGUMENTS es una URL)

Lanza en paralelo (1 único mensaje, 4 tool calls):

1. **seo-technical** — audita crawlability, mobile, URL structure, alt-text, IndexNow.
2. **seo-schema** — detecta y valida JSON-LD (BreadcrumbList, FAQPage, HowTo, Review, etc.).
3. **seo-sitemap** — valida sitemap-index.xml del sitio (opcional si es URL concreta).
4. **seo-cwv** — mide Core Web Vitals con Lighthouse (npx) o PSI API fallback.

### Grupo 2 — análisis de contenido propio (siempre)

Lanza en paralelo (1 único mensaje, 3 tool calls):

5. **seo-content** — E-E-A-T, headings, content gaps para las piezas del sitio (todos los MDX si no se pasa URL).
6. **seo-canibalization** — overlap de keywords entre MDX propios.
7. **seo-freshness** — piezas desactualizadas con señales de update real.

## Consolidación

Tras recibir los 7 outputs:

1. Crea `docs/seo/audit-YYYY-MM-DD.md` (fecha actual ISO).
2. Estructura el documento:

```markdown
# SEO Audit — {{Fecha}}

## Resumen ejecutivo

- Score global (media ponderada): XX / 100
- Issues Critical totales: X
- Issues High totales: Y
- Issues Medium totales: Z

## Top 5 acciones prioritarias (consolidadas de los 7 agentes)

1. [acción + agente origen + archivo afectado]
2. ...

## Detalle por agente

### 1. Technical (score XX/100)
[output completo del agente]

### 2. Schema
...

### 3. Sitemap
...

### 4. CWV
...

### 5. Content quality
...

### 6. Canibalización
...

### 7. Freshness
...

## Próxima sesión

Propuesta de pedazos a atacar en la siguiente sesión basada en Top 5:
- [ ] ...
```

3. Informa al usuario con:
   - Path al archivo generado (`docs/seo/audit-YYYY-MM-DD.md`).
   - Los **3 issues más críticos** del audit.
   - Tiempo estimado para resolverlos.

## Si el usuario no pasa URL

Asume sitio completo. `seo-cwv` auditará la homepage más cualquier URL que mencione el usuario después. `seo-technical` auditará el sitio público si está disponible en `PUBLIC_SITE_URL` (env var).

## Comportamiento en error

- Si algún agente falla (p. ej. Lighthouse sin Chrome): continúa con los otros, marca el agente como `⚠ skipped: <motivo>` en el reporte final.
- Si el usuario no tiene `docs/seo/`, créalo antes de escribir.
- Si ya existe un audit de hoy, añade sufijo `-2`, `-3`, etc.

## Lo que NO haces

- No ejecutes cambios automáticos en el contenido. Solo reportas.
- No abras PRs ni commits. El usuario decide qué aplicar.
- No uses MCP extensions de pago (DataForSEO, Firecrawl, Banana) — todos los agentes son prompt-puro + Bash + WebFetch.
