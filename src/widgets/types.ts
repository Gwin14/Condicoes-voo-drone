/**
 * Props serializáveis (JSON) enviadas do app para widgets e Live Activity.
 * Widgets rodam num runtime isolado: tudo chega já formatado.
 */
export type WidgetVerdict = 'go' | 'caution' | 'nogo';

export type ConditionsWidgetProps = {
  place: string;
  score: number;
  verdict: WidgetVerdict;
  verdictLabel: string;
  verdictShort: string;
  wind: string;
  gust: string;
  unit: string;
  dir: string;
  temp: string;
  rain: string;
  kp: string;
  altitude: number;
  next: string;
  updated: string;
  drone: string;
  hours: { t: string; s: number; v: WidgetVerdict; w: string }[];
};

export type FlightActivityProps = {
  place: string;
  drone: string;
  startMs: number;
  /** Fim estimado da bateria útil (reserva de 20% já descontada). */
  batteryEndMs: number;
  landBy: string;
  score: number;
  verdict: WidgetVerdict;
  verdictLabel: string;
  wind: string;
  gust: string;
  unit: string;
  dir: string;
};

export const EMPTY_WIDGET: ConditionsWidgetProps = {
  place: 'Abra o Teto',
  score: 0,
  verdict: 'caution',
  verdictLabel: 'Sem dados',
  verdictShort: '—',
  wind: '—',
  gust: '—',
  unit: 'km/h',
  dir: '',
  temp: '—',
  rain: '—',
  kp: '—',
  altitude: 100,
  next: 'Abra o app para atualizar',
  updated: '',
  drone: '',
  hours: [],
};
