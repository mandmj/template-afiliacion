#!/usr/bin/env node
/**
 * Re-scrape todos los productos en src/data/products/ y actualiza:
 *  - JSON del producto (precio, rating, reviewsCount, fetchedAt)
 *  - frontmatter del MDX correspondiente en src/content/reviews/ (solo los campos variables)
 *
 * Uso:
 *   node scripts/update-prices.mjs [--dry-run] [--delay 5000]
 *
 * Flags:
 *   --dry-run   No escribe cambios, solo muestra qué cambiaría.
 *   --delay N   Pausa entre peticiones en ms (por defecto 4000).
 */
import 'dotenv/config';
import { load } from 'cheerio';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const delayIdx = args.indexOf('--delay');
const DELAY_MS = delayIdx !== -1 ? Number(args[delayIdx + 1]) : 4000;

const PRODUCTS_DIR = path.resolve('src/data/products');
const REVIEWS_DIR = path.resolve('src/content/reviews');
const TAG = process.env.AMAZON_PARTNER_TAG || '{{AMAZON_TAG}}';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'es-ES,es;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
};

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
function parseRating(text) {
  if (!text) return null;
  const m = text.match(/([\d,\.]+)\s*de\s*5/i) || text.match(/([\d,\.]+)\s*out of\s*5/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function parseReviewsCount(text) {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(/,/g, '');
  const m = cleaned.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function scrapeProduct(asin) {
  const res = await fetch(`https://www.amazon.es/dp/${asin}`, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes('api-services-support@amazon.com') || html.includes('/errors/validateCaptcha')) {
    throw new Error('Captcha');
  }
  const $ = load(html);

  const title = $('#productTitle').text().trim();
  if (!title) throw new Error('No title');

  const priceText =
    $('.priceToPay .a-offscreen').first().text().trim() ||
    $('#corePriceDisplay_desktop_feature_div .a-offscreen').first().text().trim() ||
    $('.a-price .a-offscreen').first().text().trim();
  const price = parsePrice(priceText);

  const rating = parseRating(
    $('#acrPopover').attr('title') || $('[data-hook="rating-out-of-text"]').text() || $('.a-icon-alt').first().text()
  );
  const reviewsCount = parseReviewsCount(
    $('#acrCustomerReviewText').text() || $('[data-hook="total-review-count"]').text()
  );

  return { title, price, rating, reviewsCount };
}

// Actualiza campos concretos del frontmatter YAML (simple, sin full parser)
function updateMdxFrontmatter(content, updates) {
  const parts = content.split('---');
  if (parts.length < 3) return content;
  let fm = parts[1];
  for (const [key, val] of Object.entries(updates)) {
    if (val === null || val === undefined) continue;
    // Reemplaza dentro del bloque product: solo
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^(\\s{2,}${escaped}:)\\s.*$`, 'm');
    if (re.test(fm)) {
      fm = fm.replace(re, `$1 ${val}`);
    }
  }
  return ['', fm, parts.slice(2).join('---')].join('---');
}

function findReviewForAsin(files, asin) {
  // Async helper used below
  return files.find((entry) => entry.content.includes(`asin: "${asin}"`));
}

async function loadReviews() {
  const files = await readdir(REVIEWS_DIR);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.mdx')) continue;
    const full = path.join(REVIEWS_DIR, f);
    out.push({ path: full, name: f, content: await readFile(full, 'utf8') });
  }
  return out;
}

async function main() {
  const jsonFiles = (await readdir(PRODUCTS_DIR)).filter((f) => f.endsWith('.json'));
  const reviews = await loadReviews();

  const changes = [];
  let updated = 0;
  let failed = 0;
  let unchanged = 0;

  console.log(`\n🔄 Actualizando ${jsonFiles.length} productos · tag afiliado: ${TAG}`);
  console.log(`${DRY_RUN ? '🧪 DRY RUN · ' : ''}Pausa entre peticiones: ${DELAY_MS} ms\n`);

  for (let i = 0; i < jsonFiles.length; i++) {
    const file = jsonFiles[i];
    const filePath = path.join(PRODUCTS_DIR, file);
    try {
      const current = JSON.parse(await readFile(filePath, 'utf8'));
      const asin = current.asin;
      console.log(`[${i + 1}/${jsonFiles.length}] ${asin} · ${current.title.slice(0, 50)}…`);

      const fresh = await scrapeProduct(asin);

      const diffs = [];
      if (fresh.price !== null && fresh.price !== current.price) {
        diffs.push(`precio: ${current.price} → ${fresh.price} €`);
      }
      if (fresh.rating !== null && fresh.rating !== current.rating) {
        diffs.push(`rating: ${current.rating} → ${fresh.rating}`);
      }
      if (fresh.reviewsCount !== null && fresh.reviewsCount !== current.reviewsCount) {
        diffs.push(`reseñas: ${current.reviewsCount} → ${fresh.reviewsCount}`);
      }

      if (diffs.length === 0) {
        console.log('   = sin cambios');
        unchanged++;
      } else {
        console.log('   ' + diffs.map((d) => '↻ ' + d).join('\n   '));
        changes.push({ asin, file, diffs });
        updated++;

        if (!DRY_RUN) {
          // Actualiza JSON preservando campos existentes que no venimos a cambiar
          const newJson = {
            ...current,
            price: fresh.price ?? current.price,
            rating: fresh.rating ?? current.rating,
            reviewsCount: fresh.reviewsCount ?? current.reviewsCount,
            fetchedAt: new Date().toISOString(),
          };
          await writeFile(filePath, JSON.stringify(newJson, null, 2) + '\n', 'utf8');

          // Actualiza MDX de review que referencia este ASIN (campos variables)
          const review = findReviewForAsin(reviews, asin);
          if (review) {
            const updates = {};
            if (fresh.price !== null) updates.price = fresh.price;
            if (fresh.rating !== null) updates.rating = fresh.rating;
            if (fresh.reviewsCount !== null) updates.reviewsCount = fresh.reviewsCount;
            const newContent = updateMdxFrontmatter(review.content, updates);
            if (newContent !== review.content) {
              await writeFile(review.path, newContent, 'utf8');
              review.content = newContent;
              console.log(`   ✓ MDX actualizado: ${review.name}`);
            }
          }
        }
      }
    } catch (err) {
      console.error(`   ✗ error: ${err.message}`);
      failed++;
    }

    if (i < jsonFiles.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n📊 Resumen: ${updated} actualizados · ${unchanged} sin cambios · ${failed} errores`);
  if (changes.length > 0 && DRY_RUN) {
    console.log('\n(Ejecuta sin --dry-run para aplicar los cambios)');
  }
}

main().catch((e) => {
  console.error('Fallo inesperado:', e);
  process.exit(1);
});
