import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { InlineError, PressableScale, Skeleton, StatusDot, T } from '@/components/ui';
import { useConstellations, useSpaceWeather } from '@/hooks/useConditions';
import { useNow } from '@/hooks/useNow';
import { CONSTELLATIONS, fmtDop, snapshot } from '@/lib/gnss';
import { kpLabel } from '@/lib/scoring';
import { scintillationRisk } from '@/lib/spaceWeather';
import { useApp } from '@/store/app';
import { radius, space, useConstellationColors, useTheme, type Verdict } from '@/theme/tokens';

/** Resumo na aba Agora: satélites visíveis por constelação + interferências. */
export function GnssCard({ lat, lon, elevation, kp }: { lat: number; lon: number; elevation: number; kp: number }) {
  const { c } = useTheme();
  const colors = useConstellationColors();
  const mask = useApp((s) => s.gnssMask);
  const altitude = useApp((s) => s.altitude);
  const sats = useConstellations();
  const sw = useSpaceWeather();
  const now = useNow(60_000);

  const snap = sats.data ? snapshot(sats.data.sats, lat, lon, elevation + altitude, now, mask) : null;
  const scint = scintillationRisk(new Date(now), lat, lon, sw.data?.f107 ?? null, kp);
  const kpV: Verdict = kp >= 7 ? 'nogo' : kp >= 5 ? 'caution' : 'go';
  const scV: Verdict = scint.level === 'alto' ? 'caution' : 'go';
  const r = sw.data?.now.r ?? 0;
  const rV: Verdict = r >= 3 ? 'caution' : 'go';

  return (
    <PressableScale
      onPress={() => router.push('/gnss')}
      accessibilityRole="button"
      accessibilityLabel="Abrir satélites e interferências"
      style={{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: space.lg, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <T v="caption" tone="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' }}>
            Satélites visíveis · acima de {mask}°
          </T>
          {snap ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
              <T v="largeTitle" num>
                {snap.visible.length}
              </T>
              <T v="subhead" tone="secondary" num>
                PDOP {fmtDop(snap.pdop)} · HDOP {fmtDop(snap.hdop)}
              </T>
            </View>
          ) : sats.isLoading ? (
            <Skeleton style={{ height: 36, width: 180, marginTop: 4 }} />
          ) : null}
        </View>
        <Icon name="chevronRight" size={13} color={c.tertiary} weight="semibold" />
      </View>

      {sats.error && !snap ? <InlineError message="Elementos orbitais indisponíveis agora." onRetry={() => sats.refetch()} /> : null}

      {snap ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {CONSTELLATIONS.map((k) => (
            <View key={k.id} style={{ flex: 1, backgroundColor: c.background, borderRadius: radius.inner, borderCurve: 'continuous', padding: space.sm, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors[k.id] }} />
                <T v="caption2" tone="secondary" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ flexShrink: 1 }}>
                  {k.label}
                </T>
              </View>
              <T v="headline" num>
                {sats.data?.failed.includes(k.id) ? '—' : snap.byConstellation[k.id]}
              </T>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Row v={kpV} label="Geomagnetismo" value={`Kp ${kp.toFixed(1).replace('.', ',')} · ${kpLabel(kp)}`} />
        <Row v={scV} label="Cintilação" value={`${cap(scint.level)} agora`} />
        <Row v={rV} label="Rádio (erupções)" value={sw.data ? (r > 0 ? `R${r}` : 'Calmo') : '—'} />
      </View>
    </PressableScale>
  );
}

function Row({ v, label, value }: { v: Verdict; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <StatusDot v={v} />
      <T v="subhead" tone="secondary" style={{ flex: 1 }}>
        {label}
      </T>
      <T v="subhead" num style={{ fontWeight: '600' }}>
        {value}
      </T>
    </View>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
