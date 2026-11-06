import type { Verdict } from '@/theme/tokens';

import type { DroneProfile } from './drones';
import { clamp } from './format';
import type { ScintReading } from './spaceWeather';
import type { Hour } from './weather';

export type FactorId =
  | 'wind'
  | 'gust'
  | 'precip'
  | 'visibility'
  | 'cloudbase'
  | 'temperature'
  | 'kp'
  | 'daylight'
  | 'storm'
  | 'airspace'
  | 'satellites'
  | 'ionosphere';

export type Factor = {
  id: FactorId;
  label: string;
  status: Verdict;
  penalty: number;
  /** Valor principal já interpretado, ex.: "18 km/h · 47% do limite". */
  detail: string;
};

export type HourScore = {
  hour: Hour;
  score: number;
  verdict: Verdict;
  windAlt: number;
  gustAlt: number;
  dirAlt: number;
  cloudBase: number;
  kp: number;
  gnss?: GnssInput;
  factors: Factor[];
};

/** Interpola vento entre os níveis de modelo (10/80/120/180 m). */
export function windAtAltitude(h: Hour, alt: number) {
  const levels = [
    { a: 10, v: h.wind10, d: h.dir10 },
    { a: 80, v: h.wind80, d: h.dir80 },
    { a: 120, v: h.wind120, d: h.dir120 },
    { a: 180, v: h.wind180, d: h.dir180 },
  ];
  if (alt <= 10) return { speed: h.wind10, dir: h.dir10 };
  for (let i = 0; i < levels.length - 1; i++) {
    const lo = levels[i];
    const hi = levels[i + 1];
    if (alt <= hi.a) {
      const t = (alt - lo.a) / (hi.a - lo.a);
      return { speed: lo.v + (hi.v - lo.v) * t, dir: interpAngle(lo.d, hi.d, t) };
    }
  }
  return { speed: h.wind180, dir: h.dir180 };
}

function interpAngle(a: number, b: number, t: number) {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

/** Base de nuvens estimada (fórmula do spread: ~125 m por °C entre temperatura e orvalho). */
export function cloudBaseMeters(h: Hour) {
  return Math.max(0, (h.temp - h.dewPoint) * 125);
}

export type AirspaceInput = { status: 'clear' | 'caution' | 'critical'; icao?: string; distanceM?: number };

/** Satélites visíveis (céu aberto, acima da máscara) e geometria estimada. */
export type GnssInput = { visible: number; gps: number; pdop: number };

/** Clima espacial: cintilação medida pelo INPE (só na hora corrente) e escalas NOAA de rádio (R) e radiação (S). */
export type SpaceInput = { scint: ScintReading | null; r: number; s: number };

export type ExtraInputs = { airspace?: AirspaceInput; gnss?: GnssInput; space?: SpaceInput };

export function scoreHour(
  h: Hour,
  drone: DroneProfile,
  altitude: number,
  kp: number,
  fmtWind: (kmh: number) => string,
  extra: ExtraInputs = {}
): HourScore {
  const { airspace, gnss, space } = extra;
  const factors: Factor[] = [];
  const w = windAtAltitude(h, altitude);
  // Rajadas em altitude: escala a rajada de 10 m pelo gradiente do vento médio.
  const ratio = h.wind10 > 1 ? w.speed / h.wind10 : 1;
  const gustAlt = Math.max(h.gust10, h.gust10 * clamp(ratio, 1, 1.6));
  const base = cloudBaseMeters(h);

  // Vento sustentado
  const rw = w.speed / drone.maxWind;
  let pw = 0;
  let sw: Verdict = 'go';
  if (rw >= 0.9) {
    pw = 60 + (rw - 0.9) * 100;
    sw = 'nogo';
  } else if (rw >= 0.7) {
    pw = 25 + ((rw - 0.7) / 0.2) * 20;
    sw = 'caution';
  } else if (rw >= 0.5) {
    pw = 8 + ((rw - 0.5) / 0.2) * 17;
    sw = 'caution';
  } else {
    pw = rw * 10;
  }
  factors.push({
    id: 'wind',
    label: 'Vento',
    status: sw,
    penalty: pw,
    detail: `${fmtWind(w.speed)} a ${altitude} m · ${Math.round(rw * 100)}% do limite`,
  });

  // Rajadas
  const rg = gustAlt / (drone.maxWind * 1.15);
  const spread = gustAlt - w.speed;
  let pg = 0;
  let sg: Verdict = 'go';
  if (rg >= 1) {
    pg = 45;
    sg = 'nogo';
  } else if (rg >= 0.75 || spread >= 20) {
    pg = 18;
    sg = 'caution';
  } else if (rg >= 0.55 || spread >= 14) {
    pg = 8;
    sg = 'caution';
  }
  factors.push({
    id: 'gust',
    label: 'Rajadas',
    status: sg,
    penalty: pg,
    detail: `${fmtWind(gustAlt)} · variação de ${fmtWind(Math.max(0, spread))}`,
  });

  // Trovoada / instabilidade
  const storm = h.code >= 95 || h.cape > 1500;
  if (storm || h.cape > 800) {
    factors.push({
      id: 'storm',
      label: 'Instabilidade',
      status: storm ? 'nogo' : 'caution',
      penalty: storm ? 80 : 12,
      detail: storm ? 'Risco de trovoada e descargas' : `Atmosfera instável (CAPE ${Math.round(h.cape)})`,
    });
  }

  // Precipitação
  let pp = 0;
  let sp: Verdict = 'go';
  const raining = h.precip >= 0.2 || (h.code >= 51 && h.code <= 82);
  if (raining) {
    pp = drone.rainProof ? 12 : 55;
    sp = drone.rainProof ? 'caution' : 'nogo';
  } else if (h.precipProb >= 60) {
    pp = drone.rainProof ? 6 : 28;
    sp = 'caution';
  } else if (h.precipProb >= 30) {
    pp = drone.rainProof ? 2 : 10;
    sp = 'caution';
  }
  factors.push({
    id: 'precip',
    label: 'Chuva',
    status: sp,
    penalty: pp,
    detail: raining ? `${h.precip.toFixed(1)} mm/h agora` : `${Math.round(h.precipProb)}% de chance`,
  });

  // Visibilidade (VLOS)
  const fog = h.code === 45 || h.code === 48;
  let pv = 0;
  let sv: Verdict = 'go';
  if (h.visibility < 1000 || fog) {
    pv = 50;
    sv = 'nogo';
  } else if (h.visibility < 3000) {
    pv = 20;
    sv = 'caution';
  } else if (h.visibility < 5000) {
    pv = 8;
    sv = 'caution';
  }
  factors.push({
    id: 'visibility',
    label: 'Visibilidade',
    status: sv,
    penalty: pv,
    detail: fog ? 'Nevoeiro' : Number.isNaN(h.visibility) ? 'Sem dado do modelo' : h.visibility >= 20000 ? 'Acima de 20 km' : `${(h.visibility / 1000).toFixed(1)} km`,
  });

  // Base de nuvens vs altitude planejada
  let pc = 0;
  let sc: Verdict = 'go';
  if (h.cloudLow >= 50 && base < altitude + 30) {
    pc = 40;
    sc = 'nogo';
  } else if (h.cloudLow >= 30 && base < altitude + 150) {
    pc = 10;
    sc = 'caution';
  }
  factors.push({
    id: 'cloudbase',
    label: 'Base de nuvens',
    status: sc,
    penalty: pc,
    detail: `~${Math.round(base / 10) * 10} m · nuvens baixas ${Math.round(h.cloudLow)}%`,
  });

  // Temperatura (bateria e eletrônica)
  let pt = 0;
  let st: Verdict = 'go';
  if (h.temp < drone.minTemp || h.temp > drone.maxTemp) {
    pt = 40;
    st = 'nogo';
  } else if (h.temp < 5) {
    pt = 12;
    st = 'caution';
  } else if (h.temp > 36) {
    pt = 10;
    st = 'caution';
  }
  factors.push({
    id: 'temperature',
    label: 'Temperatura',
    status: st,
    penalty: pt,
    detail:
      h.temp < 10
        ? `${Math.round(h.temp)}° · aqueça as baterias`
        : h.temp > 33
          ? `${Math.round(h.temp)}° · risco de superaquecimento`
          : `${Math.round(h.temp)}° · faixa ideal`,
  });

  // Kp — atividade geomagnética
  let pk = 0;
  let sk: Verdict = 'go';
  if (kp >= 7) {
    pk = 40;
    sk = 'nogo';
  } else if (kp >= 5) {
    pk = 20;
    sk = 'caution';
  } else if (kp >= 4) {
    pk = 6;
    sk = 'caution';
  }
  factors.push({
    id: 'kp',
    label: 'GNSS / Kp',
    status: sk,
    penalty: pk,
    detail: `Kp ${kp.toFixed(1).replace('.', ',')} · ${kpLabel(kp)}`,
  });

  // Satélites GNSS disponíveis (contagem e geometria em céu aberto)
  if (gnss) {
    let pn = 0;
    let sn: Verdict = 'go';
    if (gnss.visible < 6 || gnss.pdop > 6) {
      pn = 40;
      sn = 'nogo';
    } else if (gnss.visible < 12 || gnss.pdop > 3) {
      pn = 12;
      sn = 'caution';
    } else if (gnss.pdop > 2) {
      pn = 4;
    }
    factors.push({
      id: 'satellites',
      label: 'Satélites',
      status: sn,
      penalty: pn,
      detail: `${gnss.visible} visíveis (${gnss.gps} GPS) · PDOP ${Number.isFinite(gnss.pdop) ? gnss.pdop.toFixed(1).replace('.', ',') : '—'}`,
    });
  }

  // Ionosfera e rádio (cintilação, erupções solares, radiação)
  if (space) {
    let pi = 0;
    let si: Verdict = 'go';
    const parts: string[] = [];
    if (space.scint) {
      parts.push(`Cintilação ${space.scint.level} (S4 ${space.scint.s4.toFixed(2).replace('.', ',')})`);
      if (space.scint.level === 'forte') {
        pi += 14;
        si = 'caution';
      } else if (space.scint.level === 'moderada') {
        pi += 5;
      }
    }
    if (space.r >= 3) {
      pi += 12;
      si = 'caution';
    } else if (space.r >= 1) pi += 3;
    if (space.s >= 3) {
      pi += 6;
      si = 'caution';
    }
    if (space.r > 0) parts.push(`rádio R${space.r}`);
    if (space.s > 0) parts.push(`radiação S${space.s}`);
    if (parts.length === 0) parts.push('Sem alertas da NOAA');
    factors.push({ id: 'ionosphere', label: 'Ionosfera', status: si, penalty: pi, detail: parts.join(' · ') });
  }

  // Luz do dia
  factors.push({
    id: 'daylight',
    label: 'Luz do dia',
    status: h.isDay ? 'go' : 'caution',
    penalty: h.isDay ? 0 : 15,
    detail: h.isDay ? 'Dia claro' : 'Noite · exige luzes e autorização',
  });

  // Espaço aéreo: afastamento mínimo de aeródromos cadastrados (ICA 100-40 / DECEA)
  if (airspace && airspace.status !== 'clear') {
    const km = airspace.distanceM != null ? ` a ${(airspace.distanceM / 1000).toFixed(1).replace('.', ',')} km` : '';
    factors.push({
      id: 'airspace',
      label: 'Espaço aéreo',
      status: airspace.status === 'critical' ? 'nogo' : 'caution',
      penalty: airspace.status === 'critical' ? 40 : 6,
      detail:
        airspace.status === 'critical'
          ? `${airspace.icao}${km} · abaixo do afastamento do DECEA para ${altitude <= 30.48 ? 'até 30 m (5,6 km)' : 'acima de 30 m (9,3 km)'}`
          : `${airspace.icao}${km} · voo permitido só até 30 m`,
    });
  }

  const total = factors.reduce((s, f) => s + f.penalty, 0);
  let score = Math.round(clamp(100 - total, 0, 100));
  const hasNoGo = factors.some((f) => f.status === 'nogo');
  if (hasNoGo) score = Math.min(score, 35);
  // À noite o melhor veredito possível é "cautela" (luzes + autorização).
  if (!h.isDay) score = Math.min(score, 69);
  const verdict: Verdict = score >= 70 ? 'go' : score >= 40 ? 'caution' : 'nogo';

  return {
    hour: h,
    score,
    verdict,
    windAlt: w.speed,
    gustAlt,
    dirAlt: w.dir,
    cloudBase: base,
    kp,
    gnss,
    factors: factors.sort((a, b) => b.penalty - a.penalty),
  };
}

export function kpLabel(kp: number) {
  if (kp >= 7) return 'tempestade forte';
  if (kp >= 5) return 'tempestade geomagnética';
  if (kp >= 4) return 'atividade elevada';
  return 'GPS estável';
}

export const verdictLabel: Record<Verdict, string> = {
  go: 'Bom para voar',
  caution: 'Voe com cautela',
  nogo: 'Não recomendado',
};

export const verdictShort: Record<Verdict, string> = {
  go: 'Bom',
  caution: 'Cautela',
  nogo: 'Evite',
};

/* ------------------------------------------------------------------ Janelas */

export type FlightWindow = {
  start: Date;
  end: Date;
  avgScore: number;
  peak: number;
  hours: number;
};

/** Encontra blocos contínuos de horas "boas" (score ≥ 70, com luz) nas próximas N horas. */
export function findWindows(scores: HourScore[], horizonHours = 48, minScore = 70): FlightWindow[] {
  const now = Date.now();
  const limit = now + horizonHours * 3600_000;
  const out: FlightWindow[] = [];
  let cur: HourScore[] = [];
  const flush = () => {
    if (cur.length >= 1) {
      const avg = cur.reduce((s, x) => s + x.score, 0) / cur.length;
      out.push({
        start: cur[0].hour.time,
        end: new Date(cur[cur.length - 1].hour.time.getTime() + 3600_000),
        avgScore: Math.round(avg),
        peak: Math.max(...cur.map((x) => x.score)),
        hours: cur.length,
      });
    }
    cur = [];
  };
  for (const s of scores) {
    const t = s.hour.time.getTime();
    if (t + 3600_000 < now || t > limit) continue;
    if (s.score >= minScore && s.hour.isDay) cur.push(s);
    else flush();
  }
  flush();
  return out.sort((a, b) => b.avgScore * Math.sqrt(b.hours) - a.avgScore * Math.sqrt(a.hours));
}

/* ----------------------------------------------------------------- Bateria */

/** Autonomia útil estimada (min) considerando vento, frio e reserva de 20%. */
export function usableFlightMinutes(drone: DroneProfile, windKmh: number, tempC: number) {
  const rw = clamp(windKmh / drone.maxWind, 0, 1.2);
  const windFactor = 1 - 0.35 * Math.pow(rw, 1.5);
  const coldFactor = tempC < 10 ? 1 - (10 - tempC) * 0.012 : tempC > 35 ? 0.95 : 1;
  return Math.max(0, drone.flightTime * windFactor * coldFactor * 0.8);
}

/** Altitude-densidade aproximada (m) a partir de pressão de superfície e temperatura. */
export function densityAltitude(surfacePressureHpa: number, tempC: number) {
  // Altitude-pressão (ft) a partir da pressão de superfície
  const paFt = (1 - Math.pow(surfacePressureHpa / 1013.25, 0.190284)) * 145366.45;
  const isaC = 15 - 1.98 * (paFt / 1000);
  const daFt = paFt + 118.8 * (tempC - isaC);
  const da = daFt * 0.3048;
  return Number.isFinite(da) ? da : NaN;
}
