#!/usr/bin/env node
/**
 * Fetch products from Amazon PA-API 5.0 and save JSON files to src/data/products/
 *
 * Uso:
 *   node scripts/fetch-products.mjs --asin B09ZYXWV --asin B09FOO
 *   node scripts/fetch-products.mjs --search "patinete electrico adulto" --limit 5
 */
import 'dotenv/config';
import amazonPaapi from 'amazon-paapi';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const asins = [];
let search = null;
let limit = 5;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--asin') asins.push(args[++i]);
  else if (args[i] === '--search') search = args[++i];
  else if (args[i] === '--limit') limit = Number(args[++i]);
}

if (asins.length === 0 && !search) {
  console.error('Uso: --asin <ASIN> [--asin <ASIN>...] | --search "<keywords>" [--limit N]');
  process.exit(1);
}

const common = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: process.env.AMAZON_PARTNER_TAG,
  PartnerType: 'Associates',
  Marketplace: process.env.AMAZON_MARKETPLACE || 'www.amazon.es',
};

if (!common.AccessKey || !common.SecretKey || !common.PartnerTag) {
  console.error('Faltan variables de entorno AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY o AMAZON_PARTNER_TAG.');
  process.exit(1);
}

const RESOURCES = [
  'Images.Primary.Large',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Features',
  'ItemInfo.TechnicalInfo',
  'Offers.Listings.Price',
  'CustomerReviews.StarRating',
  'CustomerReviews.Count',
];

function toSlug(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function mapItem(item) {
  const listing = item?.Offers?.Listings?.[0];
  return {
    asin: item.ASIN,
    title: item?.ItemInfo?.Title?.DisplayValue ?? '',
    brand: item?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
    price: listing?.Price?.Amount ?? null,
    currency: listing?.Price?.Currency ?? 'EUR',
    rating: item?.CustomerReviews?.StarRating?.Value ?? null,
    reviewsCount: item?.CustomerReviews?.Count ?? null,
    image: item?.Images?.Primary?.Large?.URL ?? null,
    url: item.DetailPageURL,
    features: item?.ItemInfo?.Features?.DisplayValues ?? [],
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  let items = [];
  if (asins.length) {
    const res = await amazonPaapi.GetItems({ ...common, ItemIds: asins, Resources: RESOURCES });
    items = res?.ItemsResult?.Items ?? [];
  } else if (search) {
    const res = await amazonPaapi.SearchItems({
      ...common,
      Keywords: search,
      SearchIndex: 'SportingGoods',
      ItemCount: Math.min(limit, 10),
      Resources: RESOURCES,
    });
    items = res?.SearchResult?.Items ?? [];
  }

  const outDir = path.resolve('src/data/products');
  await mkdir(outDir, { recursive: true });

  for (const raw of items) {
    const product = mapItem(raw);
    const slug = toSlug(`${product.brand ?? ''}-${product.title}`) || product.asin.toLowerCase();
    const file = path.join(outDir, `${slug}.json`);
    await writeFile(file, JSON.stringify(product, null, 2), 'utf8');
    console.log(`✓ ${file}`);
  }
  console.log(`Total guardados: ${items.length}`);
}

main().catch((err) => {
  console.error('Error PA-API:', err?.message ?? err);
  process.exit(1);
});
