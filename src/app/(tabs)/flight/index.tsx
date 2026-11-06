import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { IslandPreview } from '@/components/flight/IslandPreview';
import { Icon, type IconName } from '@/components/Icon';
import { Button, Card, ListRow, PressableScale, SectionHeader, StatusPill, T } from '@/components/ui';
import { useConditions } from '@/hooks/useConditions';
import { useActiveLocation } from '@/hooks/useLocation';
import { useNow } from '@/hooks/useNow';
import { confirmAction } from '@/lib/confirm';
import { endFlight } from '@/lib/flight';
import { cardinal, fmtDuration, fmtMinutes, fmtShortDate, fmtSpeed, fmtTime } from '@/lib/format';
import { verdictLabel } from '@/lib/scoring';
import { capabilities, capabilityNote } from '@/native/capabilities';
import { type FlightLog, useApp } from '@/store/app';
import { radius, space, useTheme, verdictColor } from '@/theme/tokens';

export default function FlightScreen() {
  const { c } = useTheme();
  const session = useApp((s) => s.session);
  const flights = useApp((s) => s.flights);
  const { location } = useActiveLocation();
  const { data, drone } = useConditions(location?.lat, location?.lon);
  const unit = useApp((s) => s.speedUnit);

  const totalMin = flights.reduce((s, f) => s + (f.endedAt - f.startedAt) / 60000, 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxxl * 2 }}>
      {session ? (
        <ActiveFlight />
      ) : (
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T v="title3">Pronto para decolar?</T>
              <T v="subhead" tone="secondary">
                {data && location
                  ? `${location.name} · ${drone.name} · ${fmtSpeed(data.now.windAlt, unit)} ${cardinal(data.now.dirAlt)}`
                  : 'Carregando as condições do local…'}
              </T>
            </View>
            {data ? <StatusPill v={data.now.verdict} label={`${data.now.score}`} /> : null}
          </View>
          {data && data.now.verdict === 'nogo' ? (
            <T v="footnote" tone="nogo">
              As condições atuais não são recomendadas para o seu drone. {data.now.factors[0]?.label}: {data.now.factors[0]?.detail}.
            </T>
          ) : null}
          <Button title="Checklist e decolagem" icon="checklist" onPress={() => router.push('/checklist')} disabled={!data} />
          <T v="caption" tone="tertiary" style={{ textAlign: 'center' }}>
            Ao decolar, o Teto cronometra o voo, estima a bateria útil e mostra tudo na{' '}
            {process.env.EXPO_OS === 'ios' ? 'Live Activity e na Dynamic Island' : 'notificação'}.
          </T>
        </Card>
      )}

      <View>
        <SectionHeader title="Ferramentas" icon="edit" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          <Tool icon="compass" title="Bússola de vento" subtitle="Aponte e veja proa ou cauda" onPress={() => router.push('/flight/compass')} />
          <Tool icon="route" title="Retorno seguro" subtitle="Bateria para voltar contra o vento" onPress={() => router.push('/flight/return')} />
          <Tool icon="camera" title="Planejador de luz" subtitle="Hora dourada, azul e sombras" onPress={() => router.push('/flight/sun')} />
          <Tool icon="checklist" title="Checklist" subtitle="Itens obrigatórios e boas práticas" onPress={() => router.push('/checklist')} />
        </View>
      </View>

      <View>
        <SectionHeader title="Diário de bordo" icon="history" />
        {flights.length === 0 ? (
          <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
            <Icon name="history" size={28} color={c.tertiary} />
            <T v="headline">Nenhum voo registrado</T>
            <T v="footnote" tone="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
              Seus voos aparecem aqui com duração, local e as condições na decolagem.
            </T>
          </Card>
        ) : (
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Stat label="Voos" value={String(flights.length)} />
              <Stat label="Tempo total" value={fmtMinutes(totalMin)} />
              <Stat label="Locais" value={String(new Set(flights.map((f) => f.place)).size)} />
            </View>
            <Card padded={false}>
              {flights.slice(0, 30).map((f, i) => (
                <FlightRow key={f.id} f={f} last={i === Math.min(flights.length, 30) - 1} />
              ))}
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ActiveFlight() {
  useKeepAwake();
  const { c } = useTheme();
  const session = useApp((s) => s.session)!;
  const unit = useApp((s) => s.speedUnit);
  const now = useNow(1000);
  const elapsed = now - session.startedAt;
  const total = session.usableMinutes * 60_000;
  const remaining = total - elapsed;
  const pct = Math.max(0, remaining / total);
  const landBy = fmtTime(new Date(session.startedAt + total));
  const color = remaining < 3 * 60_000 ? c.nogo : verdictColor(c, session.verdict);

  const land = () =>
    confirmAction({
      title: 'Registrar pouso?',
      message: `Voo de ${fmtDuration(elapsed)} em ${session.place}.`,
      cancel: 'Continuar voando',
      confirm: 'Pousei',
      onConfirm: () => endFlight(),
    });

  return (
    <View style={{ gap: space.md }}>
      <Card style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill v={session.verdict} label={`Em voo · ${verdictLabel[session.verdict]}`} />
          <T v="footnote" tone="secondary" num>
            desde {fmtTime(new Date(session.startedAt))}
          </T>
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <T v="display" num accessibilityLabel={`Tempo de voo ${fmtDuration(elapsed)}`}>
            {fmtDuration(elapsed)}
          </T>
          <T v="subhead" tone="secondary">
            {session.place} · {session.droneName}
          </T>
        </View>
        <View style={{ gap: space.sm }}>
          <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: c.fill, overflow: 'hidden' }}>
            <View style={{ width: `${pct * 100}%`, height: 10, backgroundColor: color, borderRadius: radius.pill }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T v="footnote" tone={remaining < 3 * 60_000 ? 'nogo' : 'secondary'} num>
              {remaining > 0 ? `${Math.ceil(remaining / 60_000)} min de bateria útil` : 'Reserva atingida — retorne agora'}
            </T>
            <T v="footnote" tone="secondary" num>
              pouse até {landBy}
            </T>
          </View>
        </View>
        <Button title="Registrar pouso" icon="landing" kind="destructive" onPress={land} />
      </Card>

      <View style={{ gap: space.sm }}>
        <T v="footnote" tone="secondary" style={{ paddingHorizontal: space.xs }}>
          {capabilities.liveActivities ? 'Live Activity ativa na tela bloqueada e na Dynamic Island.' : `Prévia da Live Activity · ${capabilityNote('liveActivities')}`}
        </T>
        {!capabilities.liveActivities ? (
          <IslandPreview
            elapsedMs={elapsed}
            wind={fmtSpeed(session.windAlt, unit)}
            batteryPct={pct}
            statusColor={color}
            landBy={landBy}
          />
        ) : null}
      </View>
    </View>
  );
}

function Tool({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: c.card,
        borderRadius: radius.card,
        borderCurve: 'continuous',
        padding: space.lg,
        gap: space.sm,
        minHeight: 120,
      }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, borderCurve: 'continuous', backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={c.accent} />
      </View>
      <T v="headline">{title}</T>
      <T v="footnote" tone="secondary" numberOfLines={2}>
        {subtitle}
      </T>
    </PressableScale>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: space.md, gap: 2 }}>
      <T v="caption" tone="secondary">
        {label}
      </T>
      <T v="headline" num numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </T>
    </View>
  );
}

function FlightRow({ f, last }: { f: FlightLog; last: boolean }) {
  const { c } = useTheme();
  const remove = useApp((s) => s.removeFlight);
  const unit = useApp((s) => s.speedUnit);
  const d = new Date(f.startedAt);
  return (
    <ListRow
      title={`${f.place} · ${fmtDuration(f.endedAt - f.startedAt)}`}
      subtitle={`${fmtShortDate(d)} ${fmtTime(d)} · ${f.droneName} · vento ${fmtSpeed(f.windAlt, unit)} · score ${f.score}`}
      icon="flight"
      iconColor={verdictColor(c, f.verdict)}
      last={last}
      onPress={() =>
        confirmAction({
          title: f.place,
          message: `${fmtShortDate(d)} às ${fmtTime(d)} · ${fmtDuration(f.endedAt - f.startedAt)} · ${f.droneName}`,
          cancel: 'Fechar',
          confirm: 'Apagar voo',
          destructive: true,
          onConfirm: () => remove(f.id),
        })
      }
    />
  );
}
