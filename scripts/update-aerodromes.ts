/**
 * Gera src/data/aerodromes.json a partir das fontes oficiais:
 * - ANAC: cadastros de aeródromos públicos e privados (dados abertos).
 * - aviationweather.gov (NOAA/NWS): aeródromos "SBxx" que não constam na ANAC,
 *   em geral militares (bases aéreas), para não deixá-los fora do mapa.
 *
 * Uso: node scripts/update-aerodromes.ts   (Node 23.6+ roda TypeScript direto)
 */
import { writeFileSync } from 'node:fs';

import {
  ANAC_PRIVATE_URL,
  ANAC_PUBLIC_URL,
  anacUpdatedAt,
  decodeLatin1,
  parseAnacCsv,
  type AerodromeRow,
} from '../src/lib/anac.ts';

const UA = { 'User-Agent': 'Teto/1.0 (app de condicoes de voo)' };

async function anac(url: string, kind: 'publico' | 'privado') {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`ANAC ${kind}: HTTP ${res.status}`);
  const csv = decodeLatin1(await res.arrayBuffer());
  return { rows: parseAnacCsv(csv, kind), updatedAt: anacUpdatedAt(csv) };
}

async function aviationWeather(known: Set<string>): Promise<AerodromeRow[]> {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const codes = L.flatMap((a) => L.map((b) => `SB${a}${b}`)).filter((c) => !known.has(c));
  const out: AerodromeRow[] = [];
  for (let i = 0; i < codes.length; i += 150) {
    const res = await fetch(`https://aviationweather.gov/api/data/airport?ids=${codes.slice(i, i + 150).join(',')}&format=json`, { headers: UA });
    if (!res.ok) throw new Error(`aviationweather: HTTP ${res.status}`);
    const t = await res.text();
    if (!t.trim()) continue;
    for (const a of JSON.parse(t) as { icaoId: string; name: string; state: string; country: string; lat: number; lon: number; owner: string }[]) {
      if (a.country !== 'BR' || !Number.isFinite(a.lat)) continue;
      const name = a.name
        .replace(/ AIRPORT.*$/i, '')
        .toLowerCase()
        .replace(/(^|[\s/(-])(\p{L})/gu, (_, p: string, l: string) => p + l.toUpperCase());
      out.push([a.icaoId, name, '', a.state, a.lat, a.lon, a.owner === 'M' ? 'militar' : 'publico']);
    }
  }
  return out;
}

const [pub, priv] = await Promise.all([anac(ANAC_PUBLIC_URL, 'publico'), anac(ANAC_PRIVATE_URL, 'privado')]);
const seen = new Set<string>();
const rows: AerodromeRow[] = [];
for (const r of [...pub.rows, ...priv.rows]) {
  if (seen.has(r[0])) continue;
  seen.add(r[0]);
  rows.push(r);
}
const extra = await aviationWeather(seen);
rows.push(...extra);

const data = {
  generatedAt: new Date().toISOString().slice(0, 10),
  sources: {
    anacPublic: { url: ANAC_PUBLIC_URL, updatedAt: pub.updatedAt, count: pub.rows.length },
    anacPrivate: { url: ANAC_PRIVATE_URL, updatedAt: priv.updatedAt, count: priv.rows.length },
    aviationWeather: { url: 'https://aviationweather.gov/api/data/airport', count: extra.length },
  },
  rows,
};
writeFileSync(new URL('../src/data/aerodromes.json', import.meta.url), JSON.stringify(data));
console.log(`${rows.length} aeródromos (ANAC públicos ${pub.rows.length}, privados ${priv.rows.length}, aviationweather ${extra.length})`);
