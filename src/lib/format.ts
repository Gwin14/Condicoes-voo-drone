export type SpeedUnit = 'kmh' | 'ms' | 'kt' | 'mph';
export type TempUnit = 'c' | 'f';

export const speedUnitLabel: Record<SpeedUnit, string> = {
  kmh: 'km/h',
  ms: 'm/s',
  kt: 'kt',
  mph: 'mph',
};

/** Converte de km/h (unidade interna) para a unidade do usuário. */
export function convertSpeed(kmh: number, unit: SpeedUnit) {
  switch (unit) {
    case 'ms':
      return kmh / 3.6;
    case 'kt':
      return kmh / 1.852;
    case 'mph':
      return kmh / 1.609344;
    default:
      return kmh;
  }
}

export function toKmh(value: number, unit: SpeedUnit) {
  switch (unit) {
    case 'ms':
      return value * 3.6;
    case 'kt':
      return value * 1.852;
    case 'mph':
      return value * 1.609344;
    default:
      return value;
  }
}

export function fmtSpeed(kmh: number | null | undefined, unit: SpeedUnit, withUnit = true) {
  if (kmh == null || Number.isNaN(kmh)) return '—';
  const v = convertSpeed(kmh, unit);
  const n = unit === 'ms' ? trim(v, 1) : String(Math.round(v));
  return withUnit ? `${n} ${speedUnitLabel[unit]}` : n;
}

export function fmtTemp(c: number | null | undefined, unit: TempUnit, withUnit = false) {
  if (c == null || Number.isNaN(c)) return '—';
  const v = unit === 'f' ? c * 1.8 + 32 : c;
  return `${Math.round(v)}°${withUnit ? (unit === 'f' ? 'F' : 'C') : ''}`;
}

export function fmtDistance(m: number | null | undefined) {
  if (m == null || Number.isNaN(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  if (m < 10000) return `${trim(m / 1000, 1)} km`;
  return `${Math.round(m / 1000)} km`;
}

export function fmtVisibility(m: number | null | undefined) {
  if (m == null || Number.isNaN(m)) return '—';
  if (m >= 20000) return '> 20 km';
  return fmtDistance(m);
}

export function trim(v: number, digits: number) {
  return Number(v.toFixed(digits)).toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

const CARDINALS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
const CARDINAL_NAMES: Record<string, string> = {
  N: 'norte',
  NE: 'nordeste',
  L: 'leste',
  SE: 'sudeste',
  S: 'sul',
  SO: 'sudoeste',
  O: 'oeste',
  NO: 'noroeste',
};

export function cardinal(deg: number | null | undefined) {
  if (deg == null || Number.isNaN(deg)) return '—';
  return CARDINALS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

export function cardinalName(deg: number) {
  const c8 = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  return CARDINAL_NAMES[c8];
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtHour(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}h`;
}

export function fmtWeekday(d: Date, today = new Date()) {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  const b = new Date(today);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((a.getTime() - b.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  const s = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace('-feira', '');
}

export function fmtShortDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function fmtDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtMinutes(min: number) {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function fmtRelative(ts: number, now = Date.now()) {
  const diff = Math.round((now - ts) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `há ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(ts).toLocaleDateString('pt-BR');
}

export function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
