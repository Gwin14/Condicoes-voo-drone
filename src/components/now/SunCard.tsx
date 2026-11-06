import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PressableScale, T } from '@/components/ui';
import { fmtTime } from '@/lib/format';
import { lightPhase, lightPhaseLabel, sunPosition, sunTimes } from '@/lib/sun';
import { radius, space, useTheme } from '@/theme/tokens';

export function SunCard({ lat, lon }: { lat: number; lon: number }) {
  const { c } = useTheme();
  const now = new Date();
  const t = sunTimes(now, lat, lon);
  const pos = sunPosition(now, lat, lon);
  const phase = lightPhase(now, lat, lon);
  const dayLen = t.sunset.getTime() - t.sunrise.getTime();
  const progress = Math.min(1, Math.max(0, (now.getTime() - t.sunrise.getTime()) / dayLen));

  return (
    <PressableScale
      onPress={() => router.push('/flight/sun')}
      accessibilityRole="button"
      accessibilityLabel="Abrir planejador de luz"
      style={{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: space.lg, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <T v="caption" tone="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' }}>
            {lightPhaseLabel[phase]}
          </T>
          <T v="title3" num>
            Sol a {Math.round(pos.elevation)}° · azimute {Math.round(pos.azimuth)}°
          </T>
        </View>
        <Icon name="chevronRight" size={13} color={c.tertiary} weight="semibold" />
      </View>
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.fill }}>
        <View style={{ width: `${progress * 100}%`, height: 6, borderRadius: radius.pill, backgroundColor: c.accent }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SunStat icon="sunrise" label="Nascer" value={fmtTime(t.sunrise)} />
        <SunStat icon="camera" label="Hora dourada" value={fmtTime(t.goldenEveningStart)} />
        <SunStat icon="sunset" label="Pôr do sol" value={fmtTime(t.sunset)} />
      </View>
    </PressableScale>
  );
}

function SunStat({ icon, label, value }: { icon: 'sunrise' | 'sunset' | 'camera'; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 2, alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
        <Icon name={icon} size={12} color={c.secondary} />
        <T v="caption" tone="secondary">
          {label}
        </T>
      </View>
      <T v="headline" num>
        {value}
      </T>
    </View>
  );
}
