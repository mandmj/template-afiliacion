#!/usr/bin/env node
/**
 * Fallback scraper: lee la página pública de Amazon.es y extrae datos básicos
 * de un producto. Úsalo solo cuando PA-API no esté disponible.
 *
 * Limitaciones:
 *  - Amazon puede devolver captchas o bloquear IPs con uso intensivo.
 *  - Mantén volumen bajo (pocas llamadas al día).
 *  - Los precios/estado scrapeados pueden quedar obsoletos; vuelve a PA-API cuanto antes.
 *
 * Uso:
 *   node scripts/scrape-product.mjs --asin B0BJTFN1KN
 *   node scripts/scrape-product.mjs --asin B0BJTFN1KN --asin B0FOO
 *   node scripts/scrape-product.mjs --url "https://www.amazon.es/dp/XXXX"
 */
import 'dotenv/config';
import { load } from 'cheerio';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const asins = [];
const urls = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--asin') asins.push(args[++i]);
  else if (args[i] === '--url') urls.push(args[++i]);
}
if (asins.length === 0 && urls.length === 0) {
  console.error('Uso: --asin <ASIN> [--asin ...] | --url <URL> [--url ...]');
  process.exit(1);
}

const TAG = process.env.AMAZON_PARTNER_TAG || '{{AMAZON_TAG}}';

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

function toSlug(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parsePrice(text) {
  if (!text) return null;
  // Ej: "449,00 €" | "1.299,99€"
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

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`);
  const html = await res.text();
  if (html.includes('api-services-support@amazon.com') || html.includes('/errors/validateCaptcha')) {
    throw new Error('Amazon devolvió una página de captcha. Reintenta más tarde o reduce la frecuencia.');
  }
  return html;
}

function extractAsinFromUrl(url) {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

function parseProduct(html, asin) {
  const $ = load(html);

  const title = $('#productTitle').text().trim();

  // Precio: probamos varios selectores habituales
  const priceText =
    $('.priceToPay .a-offscreen').first().text().trim() ||
    $('#corePriceDisplay_desktop_feature_div .a-offscreen').first().text().trim() ||
    $('#apex_offerDisplay_single_desktop .a-offscreen').first().text().trim() ||
    $('.a-price .a-offscreen').first().text().trim();
  const price = parsePrice(priceText);

  // Imagen principal (landingImage tiene data-a-dynamic-image con {url:[w,h], ...})
  let image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || null;
  const dyn = $('#landingImage').attr('data-a-dynamic-image');
  if (dyn) {
    try {
      const parsed = JSON.parse(dyn);
      const urls = Object.keys(parsed);
      if (urls.length) image = urls.sort((a, b) => (parsed[b][0] || 0) - (parsed[a][0] || 0))[0];
    } catch {}
  }

  const rating = parseRating(
    $('#acrPopover').attr('title') ||
      $('[data-hook="rating-out-of-text"]').text() ||
      $('.a-icon-alt').first().text()
  );
  const reviewsCount = parseReviewsCount(
    $('#acrCustomerReviewText').text() || $('[data-hook="total-review-count"]').text()
  );

  const brandRaw = $('#bylineInfo').text().trim() || $('a#bylineInfo').text().trim() || '';
  const brand =
    brandRaw
      .replace(/^(Marca|Marca:|Visita la Store de|Visita la tienda de|Brand|Visit the)\s*/i, '')
      .replace(/\bStore$/i, '')
      .trim() || null;

  const features = [];
  $('#feature-bullets ul li span.a-list-item').each((_, el) => {
    const t = $(el).text().trim();
    if (t && !t.toLowerCase().includes('ver más detalles')) features.push(t);
  });

  const url = `https://www.amazon.es/dp/${asin}?tag=${TAG}`;

  return {
    asin,
    title,
    brand,
    price,
    currency: 'EUR',
    rating,
    reviewsCount,
    image,
    url,
    features: features.slice(0, 8),
    fetchedAt: new Date().toISOString(),
    source: 'scrape',
  };
}

async function main() {
  const outDir = path.resolve('src/data/products');
  await mkdir(outDir, { recursive: true });

  const targets = [
    ...asins.map((a) => ({ asin: a, url: `https://www.amazon.es/dp/${a}` })),
    ...urls
      .map((u) => ({ asin: extractAsinFromUrl(u), url: u }))
      .filter((t) => t.asin),
  ];

  let ok = 0;
  let errors = 0;

  for (const t of targets) {
    try {
      console.log(`→ Scrapeando ${t.asin}…`);
      const html = await fetchHtml(t.url);
      const product = parseProduct(html, t.asin);
      if (!product.title) throw new Error('No se pudo extraer el título; el HTML no coincide con la ficha.');
      // Slug compacto: marca + primeras 6 palabras del título + ASIN (evita colisiones de variantes)
      const titleShort = product.title.split(/\s+/).slice(0, 6).join(' ');
      const slug =
        `${toSlug(`${product.brand ?? ''} ${titleShort}`).replace(/^-+/, '')}-${product.asin.toLowerCase()}` ||
        product.asin.toLowerCase();
      const file = path.join(outDir, `${slug}.json`);
      await writeFile(file, JSON.stringify(product, null, 2), 'utf8');
      console.log(`✓ ${file}`);
      console.log(`  Título: ${product.title}`);
      console.log(`  Precio: ${product.price ? product.price + ' €' : '—'}`);
      console.log(`  Rating: ${product.rating ?? '—'} (${product.reviewsCount ?? '?'} reseñas)`);
      ok++;
      // Pausa cortés entre peticiones
      if (targets.length > 1) await new Promise((r) => setTimeout(r, 2500));
    } catch (e) {
      console.error(`✗ ${t.asin}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nTotal OK: ${ok} · errores: ${errors}`);
  if (errors > 0 && ok === 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fallo inesperado:', err);
  process.exit(1);
});
