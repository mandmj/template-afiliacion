#!/usr/bin/env node
/**
 * Inserta automáticamente 2 <ProductFigure> por review MDX que no las tenga:
 *   - img[1] justo después de "## Análisis detallado" (o fallback al primer H2 tras la tabla de specs).
 *   - img[2] justo antes de "## Ventajas e inconvenientes" (o "## Veredicto" como fallback).
 *
 * Fuente de imágenes: el campo images[] del JSON de producto en src/data/products/*.json
 * (generado por scripts/scrape-product.mjs que captura galería Amazon con URLs _AC_SL1500_).
 *
 * Pensado para ejecutarse:
 *  a) Manualmente tras generar una review nueva: `node scripts/insert-review-images.mjs`
 *  b) Como paso final del comando /new-review (el agente deploy-checker lo invoca).
 *  c) Tras re-scraping masivo cuando quieras refrescar galería (idempotente: skip si ya tiene ProductFigure).
 *
 * Flags:
 *   --only <slug>   Procesar solo la review con ese slug (sin .mdx).
 *   --dry-run       Mostrar qué se modificaría sin escribir.
 *   --force         Reemplazar ProductFigure existentes.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const REVIEWS_DIR = path.join(ROOT, 'src/content/reviews');
const PRODUCTS_DIR = path.join(ROOT, 'src/data/products');

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const productFiles = readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.json'));
const byAsin = new Map();
for (const f of productFiles) {
  const p = path.join(PRODUCTS_DIR, f);
  const d = JSON.parse(readFileSync(p, 'utf8'));
  if (d.asin) byAsin.set(d.asin, d);
}

function extractAsin(mdx) {
  const m = mdx.match(/^\s*asin:\s*"?([A-Z0-9]{10})"?/m);
  return m ? m[1] : null;
}

function insertImports(mdx) {
  if (mdx.includes("from '~/components/content/ProductFigure.astro'")) return mdx;
  return mdx.replace(
    /(import Disclaimer from '~\/components\/afiliados\/Disclaimer\.astro';)/,
    `$1\nimport ProductFigure from '~/components/content/ProductFigure.astro';`
  );
}

function insertAfter(mdx, regex, block) {
  const m = mdx.match(regex);
  if (!m) return { mdx, matched: false };
  const idx = m.index + m[0].length;
  return { mdx: mdx.slice(0, idx) + '\n\n' + block + '\n' + mdx.slice(idx), matched: true };
}

function insertBefore(mdx, regex, block) {
  const m = mdx.match(regex);
  if (!m) return { mdx, matched: false };
  return { mdx: mdx.slice(0, m.index) + block + '\n\n' + mdx.slice(m.index), matched: true };
}

const files = readdirSync(REVIEWS_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .filter((f) => (ONLY ? f === `${ONLY}.mdx` : true));

let ok = 0;
let skipped = 0;
let noImages = 0;

for (const f of files) {
  const p = path.join(REVIEWS_DIR, f);
  let mdx = readFileSync(p, 'utf8');

  if (!FORCE && mdx.includes('<ProductFigure')) {
    console.log(`SKIP ${f} (ya tiene ProductFigure — usa --force para reemplazar)`);
    skipped++;
    continue;
  }

  const asin = extractAsin(mdx);
  if (!asin) {
    console.log(`SKIP ${f} (sin asin en frontmatter)`);
    skipped++;
    continue;
  }
  const prod = byAsin.get(asin);
  if (!prod || !Array.isArray(prod.images) || prod.images.length < 3) {
    console.log(`SKIP ${f} (sin images[] con ≥3 items para ${asin} — ejecuta scrape-product.mjs)`);
    noImages++;
    continue;
  }

  const img1 = prod.images[1];
  const img2 = prod.images[2] || prod.images[1];

  const brand = prod.brand || 'producto';
  const alt1 = `Detalle técnico del ${brand} — ficha actual Amazon España`;
  const alt2 = `Vista general del ${brand} en uso — imagen oficial del fabricante`;

  const figure1 = `<ProductFigure\n  src="${img1}"\n  alt="${alt1}"\n  size="md"\n/>`;
  const figure2 = `<ProductFigure\n  src="${img2}"\n  alt="${alt2}"\n  size="md"\n/>`;

  mdx = insertImports(mdx);

  // Figure 1: tras "## Análisis detallado"
  let r1 = insertAfter(mdx, /^## Análisis detallado\s*$/m, figure1);
  if (!r1.matched) {
    // Fallback: tras tabla de specs
    r1 = insertAfter(mdx, /^## Especificaciones clave[\s\S]*?\|[^\n]*\|\n(?=\n)/m, figure1);
  }
  mdx = r1.mdx;

  // Figure 2: antes de "## Ventajas" o "## Veredicto"
  let r2 = insertBefore(mdx, /^## Ventajas e inconvenientes\s*$/m, figure2);
  if (!r2.matched) {
    r2 = insertBefore(mdx, /^## Veredicto\s*$/m, figure2);
  }
  mdx = r2.mdx;

  if (DRY) {
    console.log(`DRY  ${f} (asin=${asin}, figures=${r1.matched ? 1 : 0 + (r2.matched ? 1 : 0)})`);
  } else {
    writeFileSync(p, mdx, 'utf8');
    console.log(`OK   ${f} (asin=${asin}, img1=…${img1.slice(-30)}, img2=…${img2.slice(-30)})`);
  }
  ok++;
}

console.log(`\nTotal OK: ${ok} · Skipped: ${skipped} · Sin images: ${noImages}${DRY ? ' (dry-run)' : ''}`);
if (noImages > 0) {
  console.log(`\n💡 Para poblar images[]: node scripts/scrape-product.mjs --asin <ASIN>`);
}
