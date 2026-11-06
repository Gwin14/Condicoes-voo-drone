import Slider from '@react-native-community/slider';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { Segmented } from '@/components/Segmented';
import { Card, ListRow, T } from '@/components/ui';
import { useDrone } from '@/hooks/useConditions';
import { fmtSpeed, type SpeedUnit, type TempUnit } from '@/lib/format';
import { capabilities, inExpoGo } from '@/native/capabilities';
import { ensurePermission } from '@/native/notifications';
import { useApp } from '@/store/app';
import { space, useTheme } from '@/theme/tokens';

const SPEEDS: SpeedUnit[] = ['kmh', 'ms', 'kt', 'mph'];
const TEMPS: TempUnit[] = ['c', 'f'];

function Group({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      {title ? (
        <T v="footnote" tone="secondary" style={{ paddingHorizontal: space.lg, textTransform: 'uppercase' }}>
          {title}
        </T>
      ) : null}
      {children}
      {footer ? (
        <T v="footnote" tone="secondary" style={{ paddingHorizontal: space.lg }}>
          {footer}
        </T>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const { c } = useTheme();
  const drone = useDrone();
  const altitude = useApp((s) => s.altitude);
  const speedUnit = useApp((s) => s.speedUnit);
  const tempUnit = useApp((s) => s.tempUnit);
  const notify = useApp((s) => s.notifyWindows);
  const set = useApp((s) => s.set);
  // Valor local durante o arraste; grava no store ao soltar (sem re-render global por frame).
  const [alt, setAlt] = useState(altitude);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.xxl, paddingBottom: space.xxxl * 2 }}>
      <Group title="Aeronave" footer="O score de voo usa os limites oficiais deste drone.">
        <Card padded={false}>
          <ListRow
            icon="drone"
            title={`${drone.brand} ${drone.name}`}
            subtitle={`Vento até ${fmtSpeed(drone.maxWind, speedUnit)} · ${drone.flightTime} min · ${drone.weightG} g`}
            onPress={() => router.push('/drone')}
          />
          <ListRow icon="edit" iconColor={c.secondary} title="Drone personalizado" onPress={() => router.push('/settings/drone-custom')} last />
        </Card>
      </Group>

      <Group title="Altitude planejada" footer="O vento é interpolado entre os níveis de 10, 80, 120 e 180 m do modelo. Limite legal usual: 120 m (400 ft) acima do solo.">
        <Card style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T v="body">Altura de voo</T>
            <T v="title3" num tone="accent">
              {alt} m
            </T>
          </View>
          <Slider
            minimumValue={10}
            maximumValue={120}
            step={10}
            value={alt}
            onValueChange={(v) => {
              Haptics.selectionAsync().catch(() => {});
              setAlt(v);
            }}
            onSlidingComplete={(v) => set('altitude', v)}
            minimumTrackTintColor={c.accent}
            maximumTrackTintColor={c.fill}
            accessibilityLabel="Altitude planejada"
          />
        </Card>
      </Group>

      <Group title="Unidades">
        <Card style={{ gap: space.lg }}>
          <View style={{ gap: space.sm }}>
            <T v="subhead" tone="secondary">
              Velocidade do vento
            </T>
            <Segmented
              values={['km/h', 'm/s', 'kt', 'mph']}
              selectedIndex={SPEEDS.indexOf(speedUnit)}
              onChange={(e) => set('speedUnit', SPEEDS[e.nativeEvent.selectedSegmentIndex])}
            />
          </View>
          <View style={{ gap: space.sm }}>
            <T v="subhead" tone="secondary">
              Temperatura
            </T>
            <Segmented
              values={['°C', '°F']}
              selectedIndex={TEMPS.indexOf(tempUnit)}
              onChange={(e) => set('tempUnit', TEMPS[e.nativeEvent.selectedSegmentIndex])}
            />
          </View>
        </Card>
      </Group>

      <Group title="Alertas" footer="Durante o voo, o Teto avisa quando a bateria útil estimada acabar. Para alertas de janela ideal, toque no sino de uma janela na aba Agora.">
        <Card padded={false}>
          <ListRow
            icon="bell"
            title="Lembrete de bateria em voo"
            last
            right={
              <Switch
                value={notify}
                disabled={!capabilities.localNotifications}
                onValueChange={async (v) => {
                  if (v) {
                    const ok = await ensurePermission();
                    set('notifyWindows', ok);
                  } else set('notifyWindows', false);
                }}
                trackColor={{ true: c.go }}
              />
            }
          />
        </Card>
      </Group>

      <Group title="Integrações">
        <Card padded={false}>
          <ListRow
            icon="widgets"
            title="Widgets e Live Activity"
            subtitle={capabilities.widgets ? 'Ativos' : inExpoGo ? 'Prévias no Expo Go' : 'Prévias'}
            onPress={() => router.push('/settings/widgets')}
          />
          <ListRow icon="law" iconColor={c.secondary} title="Regras para voar no Brasil" subtitle="ANAC, DECEA e Anatel" onPress={() => router.push('/settings/regulations')} last />
        </Card>
      </Group>

      <T v="footnote" tone="tertiary" style={{ textAlign: 'center' }}>
        Teto {Application.nativeApplicationVersion ?? '1.0.0'} · Previsão Open-Meteo · Kp NOAA SWPC · METAR aviationweather.gov
      </T>
    </ScrollView>
  );
}
