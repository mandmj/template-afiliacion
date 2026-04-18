# Checklist para lanzar un sitio nuevo desde este template

Tiempo estimado: **1-2 h** para dejar el sitio listo para publicar contenido.

## 1. Crear repo desde template (2 min)

En GitHub → este template → botón **"Use this template"** → **"Create a new repository"**:
- Nombre: `comprar<nicho>.<tld>` (ej. `comprarproyector4k`)
- Propietario: tu cuenta (`mandmj`)
- Público o privado (tu elección)

Clona localmente:
```bash
cd ~/Desktop
git clone https://github.com/mandmj/<repo-nuevo>.git
cd <repo-nuevo>
npm install
```

## 2. Comprar dominio (5 min)

Registrar en Namecheap, Porkbun o DonDominio el dominio elegido.

## 3. Conectar Cloudflare Pages (5 min)

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Selecciona el repo recién creado.
3. **Framework**: Astro.
4. **Build command**: `npm run build`.
5. **Build output**: `dist`.
6. **Environment variables** (copia de tu `.env`): `AMAZON_PARTNER_TAG`, `AMAZON_MARKETPLACE`, `AWIN_PUBLISHER_ID`, `PUBLIC_SITE_URL`.
7. Deploy. Cloudflare te da URL `<repo>.pages.dev`.

## 4. Conectar dominio custom (5 min)

1. En Cloudflare Pages → proyecto → **Custom domains** → Add.
2. Si el dominio está registrado FUERA de Cloudflare, te dirá los CNAME que añadir en el registrador.
3. Si el dominio está en Cloudflare DNS, se configura solo.

## 5. Rellenar placeholders (15 min)

Busca `{{` en todo el proyecto y sustituye. Recomendado hacerlo con VSCode → **Find in Files** (Ctrl+Shift+F).

Lista completa en `CLAUDE.md` — sección "Placeholders obligatorios".

**Archivos principales** donde aparecen:
- `src/config.yaml`
- `src/pages/index.astro`
- `src/pages/guia-de-compra.astro`
- `src/pages/about.astro`
- `src/pages/aviso-legal.astro`
- `src/pages/politica-privacidad.astro`
- `src/pages/politica-cookies.astro`
- `src/pages/contact.astro`
- `src/navigation.ts`

## 6. Branding propio (15 min)

### Favicon + OG image
Reemplaza `src/assets/favicons/favicon.svg` por uno propio del nicho (puedes editar el SVG actual o usar uno generado con IA, tipo ChatGPT o Midjourney). Genera los derivados:

```bash
node -e "
const sharp=require('sharp'),pngToIco=require('png-to-ico').default,fs=require('fs');
const svg=fs.readFileSync('src/assets/favicons/favicon.svg');
(async()=>{
  await sharp(svg).resize(180,180).png().toFile('src/assets/favicons/apple-touch-icon.png');
  const bufs=await Promise.all([16,32,48].map(s=>sharp(svg).resize(s,s).png().toBuffer()));
  fs.writeFileSync('src/assets/favicons/favicon.ico', await pngToIco(bufs));
  await sharp(fs.readFileSync('src/assets/images/default.svg')).resize(1200,630).png().toFile('src/assets/images/default.png');
  console.log('✓ assets regenerados');
})();"
```

Edita también `src/assets/images/default.svg` con el texto y colores del sitio antes de regenerar el PNG.

## 7. Configurar categorías (10 min)

- Edita `src/pages/categoria/[slug].astro` → rellena el mapa `CATEGORIES` con slug + label + descripción (200-300 palabras cada una).
- Edita `src/navigation.ts` → descomenta y rellena los links de `Categorías` del header y footer.
- Edita `src/pages/index.astro` → descomenta y rellena los `items` de `<Features id="categorias">` con iconos Tabler.

## 8. Analítica (10 min)

### Vercel Analytics
Si desplegaste en Vercel, se activa solo. Si es Cloudflare Pages, quita los imports en `src/layouts/Layout.astro` (o los dejas, simplemente no loggean).

### Google Analytics 4
1. Crear propiedad GA4 en <https://analytics.google.com>.
2. Copia el Measurement ID (`G-XXXXXXXXXX`).
3. `src/config.yaml` → `analytics.vendors.googleAnalytics.id` → pega el ID.

### Microsoft Clarity
1. Crear proyecto en <https://clarity.microsoft.com>.
2. Copia el Project ID.
3. `src/components/common/Clarity.astro` → línea `var PROJECT_ID = 'xxxxxxxxxx'` → pega el ID.

## 9. IndexNow (5 min)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el output (64 chars hex). Luego:
1. Crea `public/<KEY>.txt` con ese valor dentro (una sola línea).
2. Edita `scripts/indexnow-ping.mjs` → `const KEY = '<KEY>'` y `const KEY_LOCATION`.

## 10. Search Console + Bing (15 min)

- **Google Search Console**: <https://search.google.com/search-console> → Add property → URL prefix → `https://<dominio>` → verificación por **HTML tag** (pega el token en `src/config.yaml` campo `googleSiteVerificationId`) **o** por **registro TXT en DNS** (más rápido si usas Cloudflare DNS: sin redeploy).
- **Bing Webmaster Tools**: <https://www.bing.com/webmasters> → Sign in → **Import from Google Search Console** (lo más rápido, hereda la verificación). Si prefieres verificar manualmente, usa el meta tag y pega el token en `src/config.yaml` campo `bingSiteVerificationId` — `SiteVerification.astro` lo incluirá en el `<head>` automáticamente.
- Enviar `sitemap-index.xml` en ambas consolas. Solicitar indexación de las 5-8 URLs iniciales más importantes en GSC.

## 11. Amazon Afiliados (tag nuevo opcional)

Si quieres **tags Amazon separados por sitio** (para medir rendimiento por nicho):
1. Entra en <https://afiliados.amazon.es> → Herramientas → Asociados → **Crear nuevo Tracking ID**.
2. Pon nombre `<nicho>0e-21` (ej. `proy0e-21`).
3. Actualiza `AMAZON_PARTNER_TAG` en `.env` y en Cloudflare Pages env vars.

Si reutilizas el tag existente para simplicidad, funciona igual.

## 12. Awin (programas por sitio)

Misma cuenta Awin = mismo Publisher ID para todos tus sitios. Pero cada programa de anunciante debes **solicitar alta por separado por sitio** desde el panel Awin:
1. **Programmes** → filtra por categoría de tu nicho.
2. Solicita alta en cada anunciante relevante indicando `https://<dominio-nuevo>` como espacio promocional.

## 13. Primer contenido (lo más importante)

Una vez todo lo anterior está listo, abre sesión de Claude Code en la carpeta del proyecto y:

```
/new-review <ASIN>
```

Objetivo inicial: **5 reviews + 1 comparativa + 2 guías** antes del primer submit a Google.

## 14. Sitemap a Search Console

Cuando tengas contenido semilla:
1. Rebuild y push.
2. En GSC → Indexación → Sitemaps → añade `sitemap-index.xml`.
3. Inspect URL manualmente las 5-8 URLs más importantes y "Solicitar indexación".

## 15. Listo 🚀

El sitio ya está en condiciones de empezar a recibir tráfico orgánico. A partir de aquí:
- 1-2 reviews/guías nuevas por semana.
- Monitoriza GSC / GA4 / Clarity.
- Añade nuevos anunciantes Awin conforme Amazon no cubra un producto específico.
