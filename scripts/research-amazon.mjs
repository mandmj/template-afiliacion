#!/usr/bin/env node
/**
 * Research en Amazon.es: scrapea los resultados orgánicos (s?k=...) de varias
 * keywords del nicho y consolida los productos con más apariciones / mejor
 * score editorial (ranking bajo + reseñas altas + rating alto).
 *
 * Output: docs/research/amazon-bestsellers.json + .md
 *
 * Limitaciones:
 *  - Amazon puede devolver captchas con uso intensivo. Hay delay de 3 s.
 *  - Para uso puntual (1 ejecución por nicho en Fase 3 de investigación).
 *
 * Uso:
 *   node scripts/research-amazon.mjs
 *
 * AJUSTAR ANTES DE EJECUTAR:
 *   - Rellena el array SEARCHES con 8-12 keywords representativas de tu nicho.
 */

import { load } from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'es-ES,es;q=0.9',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
};

// Cada entrada hace una búsqueda en Amazon.es filtrada por 'i=baby' u otro
// departamento si lo pones en la query. Ajusta al nicho.
// Ejemplos:
//   Patinetes: [{ slug: 'urbano', label: 'Patinete urbano', query: 'patinete electrico adulto' }, ...]
//   Bebé:      [{ slug: 'minicuna', label: 'Minicuna', query: 'minicuna bebé' }, ...]
const SEARCHES = [
  // { slug: 'slug-1', label: 'Etiqueta 1', query: 'palabras clave 1' },
  // { slug: 'slug-2', label: 'Etiqueta 2', query: 'palabras clave 2' },
];

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
  return parseFloat(m[1].replace(',', '.'));
}
function parseReviewsCount(text) {
  if (!text) return null;
  const cleaned = text.replace(/\./g, '').replace(/,/g, '');
  const m = cleaned.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes('/errors/validateCaptcha') || html.includes('api-services-support@amazon.com')) {
    throw new Error('captcha');
  }
  return html;
}

function parseSearch(html) {
  const $ = load(html);
  const items = [];

  $('div[data-component-type="s-search-result"]').each((i, el) => {
    const $el = $(el);
    const asin = $el.attr('data-asin');
    if (!asin || asin.length !== 10) return;

    const title = $el.find('h2 span').first().text().trim();
    const priceText = $el.find('.a-price .a-offscreen').first().text().trim();
    const price = parsePrice(priceText);

    const ratingText =
      $el.find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text().trim() ||
      $el.find('[aria-label*="de 5"]').first().attr('aria-label') ||
      $el.find('span.a-icon-alt').first().text().trim() ||
      '';
    const rating = parseRating(ratingText);

    const reviewsText =
      $el.find('a .s-underline-text, .a-size-base.s-underline-text').first().text().trim() ||
      $el.find('[aria-label*="estrella"]').first().next('span').text().trim();
    const reviews = parseReviewsCount(reviewsText);

    const image = $el.find('img.s-image').attr('src') || null;
    const isSponsored =
      $el.find('.puis-sponsored-label-text, [aria-label*="patrocinad"]').length > 0;

    if (title) {
      items.push({
        position: i + 1,
        asin,
        title: title.length > 180 ? title.slice(0, 180) + '…' : title,
        price,
        rating,
        reviews,
        image,
        sponsored: isSponsored,
      });
    }
  });

  return items;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (SEARCHES.length === 0) {
    console.error(
      '⚠ El array SEARCHES está vacío. Edita scripts/research-amazon.mjs y añade 8-12 keywords del nicho antes de ejecutar.'
    );
    process.exit(1);
  }

  const outDir = path.resolve('docs/research');
  fs.mkdirSync(outDir, { recursive: true });

  const allByQuery = {};
  const consolidated = new Map();

  for (const { slug, label, query } of SEARCHES) {
    const url = `https://www.amazon.es/s?k=${encodeURIComponent(query)}`;
    try {
      console.log(`→ ${label}  "${query}"`);
      const html = await fetchHtml(url);
      const items = parseSearch(html).filter((it) => !it.sponsored).slice(0, 12);
      allByQuery[slug] = { label, query, url, count: items.length, items };
      console.log(`  · ${items.length} productos orgánicos`);
      for (const it of items) {
        if (!consolidated.has(it.asin)) {
          consolidated.set(it.asin, { ...it, queries: new Set([label]), bestPos: it.position });
        } else {
          const acc = consolidated.get(it.asin);
          acc.queries.add(label);
          acc.bestPos = Math.min(acc.bestPos, it.position);
          acc.price ??= it.price;
          acc.rating ??= it.rating;
          acc.reviews ??= it.reviews;
          acc.image ??= it.image;
        }
      }
      await sleep(3000);
    } catch (e) {
      console.error(`  ✗ ${label}: ${e.message}`);
      allByQuery[slug] = { label, query, url, error: e.message };
    }
  }

  const merged = [...consolidated.values()].map((x) => ({
    asin: x.asin,
    title: x.title,
    price: x.price,
    rating: x.rating,
    reviews: x.reviews,
    image: x.image,
    queries: [...x.queries],
    bestPos: x.bestPos,
    score: Math.round(
      (15 - x.bestPos) * 4 +
        (x.rating ? x.rating * 10 : 0) +
        Math.min(Math.log10((x.reviews || 1) + 1) * 18, 70)
    ),
  }));

  const filtered = merged
    .filter((m) => (m.reviews ?? 0) >= 5 && (m.rating == null || m.rating >= 3.8))
    .sort((a, b) => b.score - a.score);

  fs.writeFileSync(
    path.join(outDir, 'amazon-bestsellers.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), byQuery: allByQuery, consolidated: filtered }, null, 2)
  );

  const md = [
    `# Amazon.es por keyword del nicho (${new Date().toISOString().slice(0, 10)})`,
    ``,
    `Búsquedas: ${SEARCHES.length}. Productos únicos (≥5 reseñas y rating ≥3.8): ${filtered.length}.`,
    ``,
    `## Top 25 por score editorial`,
    ``,
    `| # | ASIN | Título | Precio | Rating | Reseñas | Aparece en | Score |`,
    `|---|------|--------|--------|--------|---------|------------|-------|`,
    ...filtered
      .slice(0, 25)
      .map(
        (m, i) =>
          `| ${i + 1} | [${m.asin}](https://www.amazon.es/dp/${m.asin}) | ${m.title.slice(0, 70)} | ${m.price ? m.price + ' €' : '—'} | ${m.rating ?? '—'} | ${m.reviews ?? '—'} | ${m.queries.join(', ')} | ${m.score} |`
      ),
    ``,
    `## Por búsqueda (top 8 orgánicos)`,
    ``,
    ...Object.values(allByQuery).flatMap((q) => [
      `### ${q.label} — "${q.query}"`,
      '',
      q.error
        ? `> ⚠ error: ${q.error}`
        : (q.items ?? [])
            .slice(0, 8)
            .map(
              (it, i) =>
                `${i + 1}. [${it.asin}](https://www.amazon.es/dp/${it.asin}) — ${it.title?.slice(0, 100) || ''} · ${it.price ? it.price + ' €' : '—'} · ${it.rating ?? '—'}★ (${it.reviews ?? '?'} reseñas)`
            )
            .join('\n'),
      '',
    ]),
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'amazon-bestsellers.md'), md);
  console.log(`\n✓ ${filtered.length} candidatos → docs/research/amazon-bestsellers.{json,md}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
