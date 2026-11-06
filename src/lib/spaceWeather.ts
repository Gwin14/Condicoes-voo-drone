/**
 * Clima espacial que afeta GNSS e rádio:
 * - Escalas NOAA: R (rádio/erupções solares), S (radiação), G (geomagnética).
 * - Fluxo solar F10.7 (atividade do ciclo solar).
 * - Risco de cintilação ionosférica — estimativa própria do Teto. O Brasil fica sob a
 *   Anomalia de Ionização Equatorial: após o pôr do sol surgem "bolhas de plasma" que
 *   fazem o sinal GNSS oscilar, piorando a precisão e causando perda de satélites.
 */

export type ScaleLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ScaleDay = {
  date: Date;
  r: ScaleLevel;
  s: ScaleLevel;
  g: ScaleLevel;
  /** Probabilidades (%) de R1–R2, R3+ e S1+ quando é previsão. */
  rMinorProb?: number;
  rMajorProb?: number;
  sProb?: number;
};

export type SpaceWeather = {
  now: ScaleDay;
  forecast: ScaleDay[];
  f107: number | null;
  fetchedAt: number;
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const lvl = (v: unknown): ScaleLevel => {
  const n = Number(v);
  return (Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : 0) as ScaleLevel;
};
const num = (v: unknown) => (v == null || v === '' ? undefined : Number(v));

type ScalesEntry = {
  DateStamp?: string;
  TimeStamp?: string;
  R?: { Scale?: string | null; MinorProb?: string | null; MajorProb?: string | null };
  S?: { Scale?: string | null; Prob?: string | null };
  G?: { Scale?: string | null };
};

export async function fetchSpaceWeather(signal?: AbortSignal): Promise<SpaceWeather> {
  const [scales, flux] = await Promise.allSettled([
    getJson<Record<string, ScalesEntry>>('https://services.swpc.noaa.gov/products/noaa-scales.json', signal),
    getJson<{ Flux?: string | number } | { Flux?: string | number }[]>('https://services.swpc.noaa.gov/products/summary/10cm-flux.json', signal),
  ]);
  if (scales.status === 'rejected') throw scales.reason;
  const toDay = (e: ScalesEntry | undefined): ScaleDay => ({
    date: e?.DateStamp ? new Date(`${e.DateStamp}T${e.TimeStamp ?? '00:00:00'}Z`) : new Date(),
    r: lvl(e?.R?.Scale),
    s: lvl(e?.S?.Scale),
    g: lvl(e?.G?.Scale),
    rMinorProb: num(e?.R?.MinorProb),
    rMajorProb: num(e?.R?.MajorProb),
    sProb: num(e?.S?.Prob),
  });
  let f107: number | null = null;
  if (flux.status === 'fulfilled') {
    const v = Array.isArray(flux.value) ? flux.value[0]?.Flux : flux.value?.Flux;
    const n = Number(v);
    f107 = Number.isFinite(n) ? n : null;
  }
  return {
    now: toDay(scales.value['0']),
    forecast: ['1', '2', '3'].map((k) => toDay(scales.value[k])).filter((d) => !Number.isNaN(d.date.getTime())),
    f107,
    fetchedAt: Date.now(),
  };
}

export const scaleText = {
  r: ['Sem apagões de rádio', 'Menor', 'Moderado', 'Forte', 'Severo', 'Extremo'],
  s: ['Sem tempestade de radiação', 'Menor', 'Moderada', 'Forte', 'Severa', 'Extrema'],
  g: ['Sem tempestade geomagnética', 'Menor', 'Moderada', 'Forte', 'Severa', 'Extrema'],
};

/* -------------------------------------------------- Cintilação ionosférica */

/**
 * Latitude geográfica aproximada do equador magnético (dip equator).
 * Setor americano: passa por Lima (~12°S, 77°O) e pelo litoral norte do Brasil
 * (~3°S, 44°O). Fora dele usa a aproximação de dipolo.
 */
function dipEquatorLat(lon: number) {
  if (lon >= -90 && lon <= -30) {
    if (lon <= -44) return -12 + ((lon + 77) / 33) * 8.5;
    return -3.5 - ((lon + 44) / 14) * 2;
  }
  // Dipolo: polo geomagnético ~ (80.8°N, 72.8°O)
  const pLat = 80.8 * (Math.PI / 180);
  const pLon = -72.8 * (Math.PI / 180);
  const l = lon * (Math.PI / 180);
  // latitude onde a latitude magnética é zero ao longo deste meridiano
  return (Math.atan(-Math.cos(l - pLon) / Math.tan(pLat)) * 180) / Math.PI;
}

export type ScintLevel = 'baixo' | 'moderado' | 'alto';

export type ScintRisk = {
  level: ScintLevel;
  /** 0–1 */
  index: number;
  /** Distância (graus) ao equador magnético. */
  fromDipEq: number;
  reason: string;
};

/** Hora solar local (0–24). */
function solarHour(t: Date, lon: number) {
  const h = t.getUTCHours() + t.getUTCMinutes() / 60 + lon / 15;
  return ((h % 24) + 24) % 24;
}

export function scintillationRisk(t: Date, lat: number, lon: number, f107: number | null, kp: number): ScintRisk {
  const d = Math.abs(lat - dipEquatorLat(lon));
  // Zona: forte até ~20° do equador magnético (inclui as cristas da anomalia), some após ~35°.
  const zone = d <= 20 ? 1 : d >= 35 ? 0 : 1 - (d - 20) / 15;
  // Hora local: bolhas de plasma nascem após o pôr do sol (pico 20h–00h, até ~02h).
  const h = solarHour(t, lon);
  const time =
    h >= 19 && h < 24 ? (h < 20 ? h - 19 : 1) : h >= 0 && h < 3 ? 1 - h / 3 : 0;
  // Estação no setor brasileiro: setembro–março é a temporada; maio–julho é calmo.
  const m = t.getUTCMonth(); // 0 = jan
  const americas = lon >= -90 && lon <= -30;
  const seasonTable = americas
    ? [1, 1, 0.9, 0.6, 0.3, 0.15, 0.15, 0.3, 0.7, 1, 1, 1]
    : [0.6, 0.7, 0.9, 0.8, 0.5, 0.4, 0.4, 0.5, 0.8, 0.9, 0.7, 0.6];
  const season = seasonTable[m];
  // Atividade solar: F10.7 alto = ionosfera mais densa.
  const solar = f107 == null ? 0.75 : Math.max(0.25, Math.min(1.2, (f107 - 70) / 100));
  // Tempestades geomagnéticas fortes podem tanto suprimir quanto disparar bolhas: aumenta a incerteza.
  const storm = kp >= 6 ? 1.15 : 1;
  const index = Math.max(0, Math.min(1, zone * time * season * solar * storm));
  const level: ScintLevel = index >= 0.45 ? 'alto' : index >= 0.18 ? 'moderado' : 'baixo';
  let reason: string;
  if (zone === 0) reason = 'Fora da região equatorial da ionosfera';
  else if (time === 0) reason = h < 19 && h >= 3 ? 'Período diurno — bolhas de plasma só após o pôr do sol' : 'Fim da madrugada';
  else if (season < 0.4) reason = 'Fora da temporada (maio–agosto é calmo)';
  else reason = 'Pós-pôr do sol, temporada de bolhas de plasma';
  return { level, index, fromDipEq: d, reason };
}
