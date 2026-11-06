import { useColorScheme } from 'react-native';

/**
 * Design tokens — Teto.
 *
 * Regras travadas (anti-slop):
 * - Um único acento (azul "céu"), usado só em ação primária, estado ativo e progresso.
 * - Uma única família de cinzas (frios, alinhados aos cinzas de sistema do iOS).
 * - Cores de status (go / cautela / no-go) são semânticas, não decorativas.
 * - Escala de raios: cartões 20 · elementos internos 12 · ações em pílula.
 * - Ritmo de espaçamento em base 4.
 */

const light = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  cardRaised: '#FFFFFF',
  fill: '#E9E9EF',
  fillStrong: '#DCDCE3',
  separator: '#E2E2E8',
  label: '#0B0C10',
  secondary: '#62636B',
  tertiary: '#9C9DA6',
  accent: '#2F6BFF',
  accentSoft: '#2F6BFF1A',
  onAccent: '#FFFFFF',
  go: '#18995A',
  goSoft: '#18995A1A',
  caution: '#B97F00',
  cautionSoft: '#E0A1001F',
  nogo: '#D6383E',
  nogoSoft: '#D6383E1A',
  mapZoneCritical: 'rgba(214,56,62,0.16)',
  mapZoneCaution: 'rgba(224,161,0,0.12)',
  overlay: 'rgba(0,0,0,0.4)',
};

const dark: typeof light = {
  background: '#000000',
  card: '#1C1C1E',
  cardRaised: '#2C2C2E',
  fill: '#2C2C2E',
  fillStrong: '#3A3A3D',
  separator: '#2E2E31',
  label: '#F5F5F7',
  secondary: '#A0A0A8',
  tertiary: '#636369',
  accent: '#5B8CFF',
  accentSoft: '#5B8CFF26',
  onAccent: '#FFFFFF',
  go: '#34D07A',
  goSoft: '#34D07A24',
  caution: '#FFC53D',
  cautionSoft: '#FFC53D24',
  nogo: '#FF6166',
  nogoSoft: '#FF616626',
  mapZoneCritical: 'rgba(255,97,102,0.22)',
  mapZoneCaution: 'rgba(255,197,61,0.16)',
  overlay: 'rgba(0,0,0,0.55)',
};

export type Palette = typeof light;
export const palettes = { light, dark };

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  card: 20,
  inner: 12,
  pill: 999,
} as const;

/** Rampa tipográfica do iOS. Um único tamanho "display" por tela. */
export const type = {
  display: { fontSize: 56, lineHeight: 60, fontWeight: '700' as const, letterSpacing: -1.5 },
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const, letterSpacing: 0.4 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.26 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const, letterSpacing: -0.45 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.43 },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.43 },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.31 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.23 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '500' as const, letterSpacing: 0.06 },
};

export type Verdict = 'go' | 'caution' | 'nogo';

export function verdictColor(p: Palette, v: Verdict) {
  return v === 'go' ? p.go : v === 'caution' ? p.caution : p.nogo;
}
export function verdictSoft(p: Palette, v: Verdict) {
  return v === 'go' ? p.goSoft : v === 'caution' ? p.cautionSoft : p.nogoSoft;
}

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { c: isDark ? dark : light, isDark };
}

/** Sombra única do app (elevação de cartões flutuantes sobre o mapa). */
export const floatingShadow = '0 6px 24px rgba(0,0,0,0.16)';
