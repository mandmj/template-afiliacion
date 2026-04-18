#!/usr/bin/env node
/**
 * Research de keywords long-tail del nicho vía Google Suggest (sin API key).
 * Para cada SEED, expande con modificadores comunes (" mejor", " barato",
 * " opiniones", ...) y con el abecedario (a..j) para capturar autocompletes
 * diversos. Deduplica, cuenta apariciones y ordena.
 *
 * Output: docs/research/keywords.json + docs/research/keywords.md
 *
 * Uso:
 *   node scripts/research-keywords.mjs
 *
 * AJUSTAR ANTES DE EJECUTAR:
 *   - Rellena el array SEEDS con 10-15 seeds representativos de tu nicho.
 *   - Ajusta MODIFIERS si los genéricos no encajan con tu caso.
 */

import fs from 'node:fs';
import path from 'node:path';

// 10-15 keywords semilla del nicho. Cada una genera ~17 queries a Google Suggest.
// Ejemplos:
//   Patinetes: ['patinete electrico', 'patinete urbano', 'patinete plegable', ...]
//   Bebé + pisos pequeños: ['minicuna', 'cuna colecho', 'carrito bebé compacto', ...]
//   Cocina compacta: ['robot cocina pequeño', 'microondas compacto', ...]
const SEEDS = [
  // 'palabra clave 1',
  // 'palabra clave 2',
];

// Modificadores que capturan intención de compra habitual.
// Puedes añadir los específicos del nicho (ej. " avion" para viajeros).
const MODIFIERS = ['', ' mejor', ' barato', ' opiniones', ' amazon', ' comparativa'];
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

async function suggest(query) {
  const url =
    'https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=es&q=' +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (SEEDS.length === 0) {
    console.error(
      '⚠ El array SEEDS está vacío. Edita scripts/research-keywords.mjs y añade 10-15 keywords semilla del nicho antes de ejecutar.'
    );
    process.exit(1);
  }

  const all = new Map();
  let queriesExecuted = 0;
  for (const seed of SEEDS) {
    for (const mod of MODIFIERS) {
      const q = (seed + mod).trim();
      const suggestions = await suggest(q);
      queriesExecuted++;
      for (const s of suggestions) {
        const key = s.toLowerCase().trim();
        if (!all.has(key)) all.set(key, { term: s, origins: new Set(), count: 0 });
        all.get(key).origins.add(seed);
        all.get(key).count++;
      }
      await sleep(220);
    }
    for (const letter of ALPHA.slice(0, 10)) {
      const q = `${seed} ${letter}`;
      const suggestions = await suggest(q);
      queriesExecuted++;
      for (const s of suggestions) {
        const key = s.toLowerCase().trim();
        if (!all.has(key)) all.set(key, { term: s, origins: new Set(), count: 0 });
        all.get(key).origins.add(seed);
        all.get(key).count++;
      }
      await sleep(220);
    }
    console.log(`· ${seed} (${queriesExecuted} queries totales)`);
  }

  const ranked = [...all.values()]
    .map((v) => ({ term: v.term, count: v.count, origins: [...v.origins].join(', ') }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));

  const longTail = ranked.filter((r) => r.term.split(/\s+/).length >= 3);

  const outDir = path.resolve('docs/research');
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, 'keywords.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), queries: queriesExecuted, total: ranked.length, ranked },
      null,
      2
    )
  );

  const md = [
    `# Research keywords (${new Date().toISOString().slice(0, 10)})`,
    ``,
    `- Seeds: ${SEEDS.length}`,
    `- Queries ejecutadas: ${queriesExecuted}`,
    `- Keywords únicas: ${ranked.length}`,
    `- Long-tail (≥3 palabras): ${longTail.length}`,
    ``,
    `## Top 50 long-tail (por veces que aparecen)`,
    ``,
    `| # | Keyword | Apariciones | Origen (seed) |`,
    `|---|---------|-------------|---------------|`,
    ...longTail.slice(0, 50).map((r, i) => `| ${i + 1} | ${r.term} | ${r.count} | ${r.origins} |`),
    ``,
    `## Todas las keywords (${ranked.length})`,
    ``,
    `<details><summary>Expandir</summary>`,
    ``,
    ...ranked.map((r, i) => `${i + 1}. **${r.term}** — ${r.count}× (${r.origins})`),
    ``,
    `</details>`,
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'keywords.md'), md);

  console.log(`\n✓ ${ranked.length} keywords (${longTail.length} long-tail) → docs/research/keywords.{json,md}`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
