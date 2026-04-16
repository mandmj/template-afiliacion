#!/usr/bin/env node
/**
 * Notifica a Bing / Yandex / Seznam / etc. (protocolo IndexNow) todas las URLs
 * canónicas del sitio. Se llama tras cada deploy o cuando se actualiza contenido.
 *
 * Uso:
 *   node scripts/indexnow-ping.mjs
 *   node scripts/indexnow-ping.mjs --url https://{{DOMAIN}}/reviews/nueva
 *
 * Sin argumentos, lee todas las URLs del sitemap publicado y las notifica.
 */

const HOST = '{{DOMAIN}}';
const KEY = '{{INDEXNOW_KEY}}';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const args = process.argv.slice(2);
const specificUrls = args
  .map((a, i, arr) => (arr[i - 1] === '--url' ? a : null))
  .filter(Boolean);

async function readSitemapUrls() {
  // Lee sitemap-0.xml para obtener las URLs reales
  const res = await fetch(`https://${HOST}/sitemap-0.xml`);
  if (!res.ok) throw new Error(`No se puede leer sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1]);
  return urls;
}

async function ping(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  return { status: res.status, ok: res.ok };
}

async function main() {
  let urls = specificUrls;
  if (urls.length === 0) {
    urls = await readSitemapUrls();
  }
  if (urls.length === 0) {
    console.error('Sin URLs para notificar.');
    process.exit(1);
  }

  console.log(`📡 IndexNow · host: ${HOST} · ${urls.length} URL${urls.length !== 1 ? 's' : ''}`);

  // IndexNow acepta hasta 10000 URLs por petición. Enviamos en un solo bloque.
  const { status, ok } = await ping(urls);

  if (ok || status === 200 || status === 202) {
    console.log(`✅ Aceptado por IndexNow (HTTP ${status})`);
    console.log('   Se propagará a Bing, Yandex y Seznam en minutos/horas.');
  } else if (status === 400) {
    console.error('❌ HTTP 400 — formato incorrecto de la petición.');
    process.exit(1);
  } else if (status === 403) {
    console.error(`❌ HTTP 403 — la key no coincide con ${KEY_LOCATION}.`);
    console.error('   Verifica que el archivo está publicado y accesible.');
    process.exit(1);
  } else if (status === 422) {
    console.error('❌ HTTP 422 — URLs no pertenecen al host o violación de cuota.');
    process.exit(1);
  } else if (status === 429) {
    console.error('⚠️  HTTP 429 — demasiadas peticiones, reintenta más tarde.');
    process.exit(1);
  } else {
    console.error(`❌ HTTP ${status} — ver docs.indexnow.org`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fallo:', e.message);
  process.exit(1);
});
