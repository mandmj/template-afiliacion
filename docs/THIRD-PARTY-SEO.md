# Atribución — claude-seo (AgriciDaniel)

Parte de los agentes SEO de este template derivan del proyecto open-source [**claude-seo**](https://github.com/AgriciDaniel/claude-seo) de Agrici Daniel, publicado bajo licencia **MIT**.

## Agentes adaptados

Los siguientes 4 agentes en `.claude/agents/` son derivados de claude-seo (con adaptaciones al stack Astro/MDX + traducción parcial al español + extensiones locales):

| Archivo del template | Origen en claude-seo | Cambios introducidos |
|----------------------|----------------------|----------------------|
| `.claude/agents/seo-technical.md` | `agents/seo-technical.md` | Instrucciones en español, referencias al stack Astro, sección "Validación de alt-text" añadida. |
| `.claude/agents/seo-schema.md` | `agents/seo-schema.md` | Eliminada dependencia de `schema/templates.json`, tabla con schemas que el template emite por defecto añadida. |
| `.claude/agents/seo-sitemap.md` | `agents/seo-sitemap.md` | Referencias a `@astrojs/sitemap` y workflow IndexNow del template. |
| `.claude/agents/seo-content.md` | `agents/seo-content.md` | Mínimos de palabras ajustados a reviews de afiliación Amazon ES, secciones "Auditoría de H2/H3" y "Detección de content gaps" añadidas. |

Cada archivo adaptado contiene un header de atribución al comienzo:

```html
<!-- Adaptado de claude-seo by AgriciDaniel (MIT License)
     https://github.com/AgriciDaniel/claude-seo
     Cambios: ... -->
```

## Agentes y componentes propios (no derivados)

Los siguientes archivos son **originales de este template**, no derivan de claude-seo:

- `.claude/agents/seo-canibalization.md`
- `.claude/agents/seo-freshness.md`
- `.claude/agents/seo-cwv.md`
- `.claude/commands/seo-audit.md`
- `src/components/content/BreadcrumbJsonLd.astro`
- `src/components/content/FAQSection.astro`
- `src/components/content/HowToSteps.astro`

## Licencia MIT de claude-seo

Copia literal del [LICENSE](https://github.com/AgriciDaniel/claude-seo/blob/main/LICENSE) de claude-seo, vigente en el momento de la adopción (abril 2026):

```
MIT License

Copyright (c) 2025 Agrici Daniel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Lo que NO se ha adoptado de claude-seo

Para mantener el template ligero (Node/Astro sin Python), se han **excluido**:

- **Skills con scripts Python** (`/skills/` en claude-seo) → añadirían dependencia Python al template.
- **Agentes no aplicables**: `seo-local`, `seo-maps`, `seo-hreflang`, `seo-programmatic`, `seo-ecommerce`, `seo-geo`.
- **MCP extensions de pago**: DataForSEO, Firecrawl, Banana.
- **Scripts de instalación automática** (`install.sh`, `install.ps1`): se hace cherry-pick manual.

## Reconocimiento

Agradecimiento al autor (@AgriciDaniel) por liberar claude-seo bajo MIT. Si detectas una divergencia importante entre un agente adaptado y su original upstream, considera abrir un issue en el repo upstream o en éste.
