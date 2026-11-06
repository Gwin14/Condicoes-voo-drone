import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Segmented } from '@/components/Segmented';
import { Card, EmptyState, Skeleton, StatusDot, T } from '@/components/ui';
import { type Conditions, useConditions } from '@/hooks/useConditions';
import { useActiveLocation } from '@/hooks/useLocation';
import { cardinal, convertSpeed, fmtHour, fmtShortDate, fmtTemp, fmtTime, fmtWeekday, speedUnitLabel, type SpeedUnit, type TempUnit } from '@/lib/format';
import type { HourScore } from '@/lib/scoring';
import { weatherIcon } from '@/lib/weather';
import { useApp } from '@/store/app';
import { radius, space, useTheme, verdictColor, verdictSoft } from '@/theme/tokens';

type Row = { type: 'header'; key: string; date: Date; good: number } | { type: 'hour'; key: string; h: HourScore };

export default function ForecastScreen() {
  const { c } = useTheme();
  const [tab, setTab] = useState(0);
  const { location } = useActiveLocation();
  const { data, isLoading, error, refetch, altitude } = useConditions(location?.lat, location?.lon);
  const unit = useApp((s) => s.speedUnit);
  const tempUnit = useApp((s) => s.tempUnit);

  const header = (
    <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md }}>
      <Segmented
        values={['Por hora', '7 dias']}
        selectedIndex={tab}
        onChange={(e) => {
          Haptics.selectionAsync().catch(() => {});
          setTab(e.nativeEvent.selectedSegmentIndex);
        }}
        style={{ height: 32 }}
      />
      {data && data.airspace.status === 'critical' && data.airspace.nearest ? (
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: c.cautionSoft, borderRadius: radius.inner, borderCurve: 'continuous', padding: space.md }}>
          <Icon name="airport" size={16} color={c.caution} />
          <T v="footnote" style={{ flex: 1 }}>
            Os scores incluem a zona estimada de {data.airspace.nearest.icao}: aqui o voo exige autorização no SARPAS.
          </T>
        </View>
      ) : null}
      {data && tab === 0 ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: space.md }}>
          <T v="caption2" tone="tertiary" style={{ width: 56 }}>
            HORA
          </T>
          <T v="caption2" tone="tertiary" style={{ flex: 1 }}>
            SCORE
          </T>
          <T v="caption2" tone="tertiary" style={{ width: 74, textAlign: 'right' }}>
            {`VENTO ${altitude} M`}
          </T>
          <T v="caption2" tone="tertiary" style={{ width: 52, textAlign: 'right' }}>
            RAJ.
          </T>
          <T v="caption2" tone="tertiary" style={{ width: 44, textAlign: 'right' }}>
            CHUVA
          </T>
          <T v="caption2" tone="tertiary" style={{ width: 40, textAlign: 'right' }}>
            TEMP
          </T>
        </View>
      ) : null}
    </View>
  );

  if (!location || isLoading || (!data && !error)) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }}>
        {header}
        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 52 }} />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!data) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: c.background }}>
        <EmptyState
          icon="cloud"
          tone="nogo"
          title="Previsão indisponível"
          message={error?.message ?? 'Verifique sua conexão.'}
          action="Tentar de novo"
          onAction={() => refetch()}
        />
      </ScrollView>
    );
  }

  if (tab === 1) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: c.background }}
        contentContainerStyle={{ paddingBottom: space.xxxl * 2 }}>
        {header}
        <DaysView data={data} unit={unit} tempUnit={tempUnit} />
      </ScrollView>
    );
  }

  const rows: Row[] = [];
  let lastDay = '';
  for (const h of data.hours) {
    const d = h.hour.time.toDateString();
    if (d !== lastDay) {
      lastDay = d;
      const good = data.hours.filter((x) => x.hour.time.toDateString() === d && x.verdict === 'go' && x.hour.isDay).length;
      rows.push({ type: 'header', key: `d-${d}`, date: h.hour.time, good });
    }
    rows.push({ type: 'hour', key: `h-${h.hour.time.getTime()}`, h });
  }

  return (
    <FlashList
      data={rows}
      keyExtractor={(r) => r.key}
      getItemType={(r) => r.type}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: space.xxxl * 2 }}
      ListHeaderComponent={header}
      renderItem={({ item }) =>
        item.type === 'header' ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space.lg + space.xs, paddingTop: space.lg, paddingBottom: space.sm, backgroundColor: c.background }}>
            <T v="headline">
              {fmtWeekday(item.date)} · {fmtShortDate(item.date)}
            </T>
            <T v="footnote" tone={item.good > 0 ? 'go' : 'tertiary'} num>
              {item.good > 0 ? `${item.good} h boas` : 'Sem horas boas'}
            </T>
          </View>
        ) : (
          <HourRow h={item.h} unit={unit} tempUnit={tempUnit} />
        )
      }
    />
  );
}

function HourRow({ h, unit, tempUnit }: { h: HourScore; unit: SpeedUnit; tempUnit: TempUnit }) {
  const { c } = useTheme();
  const color = verdictColor(c, h.verdict);
  return (
    <View style={{ paddingHorizontal: space.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.card,
          paddingHorizontal: space.md,
          height: 52,
          borderRadius: radius.inner,
          borderCurve: 'continuous',
          marginBottom: 4,
        }}
        accessible
        accessibilityLabel={`${fmtHour(h.hour.time)}, score ${h.score}`}>
        <View style={{ width: 56, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T v="subhead" num style={{ fontWeight: '600' }}>
            {fmtHour(h.hour.time)}
          </T>
          {!h.hour.isDay ? <Icon name="moon" size={11} color={c.tertiary} /> : null}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ minWidth: 38, paddingHorizontal: 8, height: 26, borderRadius: radius.pill, backgroundColor: verdictSoft(c, h.verdict), alignItems: 'center', justifyContent: 'center' }}>
            <T v="footnote" num style={{ color, fontWeight: '700' }}>
              {h.score}
            </T>
          </View>
          <Icon name={weatherIcon(h.hour.code, h.hour.isDay)} size={16} color={c.secondary} />
        </View>
        <View style={{ width: 74, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
          <T v="subhead" num style={{ fontWeight: '600' }}>
            {Math.round(convertSpeed(h.windAlt, unit))}
          </T>
          <T v="caption" tone="tertiary">
            {cardinal(h.dirAlt)}
          </T>
        </View>
        <T v="subhead" num tone="secondary" style={{ width: 52, textAlign: 'right' }}>
          {Math.round(convertSpeed(h.gustAlt, unit))}
        </T>
        <T v="subhead" num tone={h.hour.precipProb >= 50 ? 'label' : 'secondary'} style={{ width: 44, textAlign: 'right' }}>
          {Math.round(h.hour.precipProb)}%
        </T>
        <T v="subhead" num tone="secondary" style={{ width: 40, textAlign: 'right' }}>
          {fmtTemp(h.hour.temp, tempUnit)}
        </T>
      </View>
    </View>
  );
}

function DaysView({ data, unit, tempUnit }: { data: Conditions; unit: SpeedUnit; tempUnit: TempUnit }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
      {data.forecast.days.map((d) => {
        const dayKey = d.date.toDateString();
        const hours = data.hours.filter((h) => new Date(h.hour.time).toDateString() === dayKey);
        const good = hours.filter((h) => h.verdict === 'go' && h.hour.isDay);
        const best = [...hours].filter((h) => h.hour.isDay).sort((a, b) => b.score - a.score)[0];
        const byHour = new Map(hours.map((h) => [h.hour.time.getHours(), h]));
        return (
          <Card key={dayKey} style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Icon name={weatherIcon(d.code, true)} size={26} color={c.secondary} />
              <View style={{ flex: 1 }}>
                <T v="headline">{fmtWeekday(d.date)}</T>
                <T v="footnote" tone="secondary" num>
                  {fmtTemp(d.tMin, tempUnit)} / {fmtTemp(d.tMax, tempUnit)} · rajadas até {Math.round(convertSpeed(d.gustMax, unit))} {speedUnitLabel[unit]}
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T v="title3" num tone={good.length > 0 ? 'go' : 'tertiary'}>
                  {good.length} h
                </T>
                <T v="caption2" tone="tertiary">
                  BOAS
                </T>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {Array.from({ length: 24 }).map((_, hr) => {
                const s = byHour.get(hr);
                return (
                  <View
                    key={hr}
                    style={{
                      flex: 1,
                      height: 18,
                      borderRadius: 3,
                      backgroundColor: s ? verdictColor(c, s.verdict) : c.fill,
                      opacity: s && !s.hour.isDay ? 0.35 : 1,
                    }}
                  />
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {['0h', '6h', '12h', '18h', '23h'].map((l) => (
                <T key={l} v="caption2" tone="tertiary">
                  {l}
                </T>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="sunrise" size={13} color={c.secondary} />
                <T v="footnote" tone="secondary" num>
                  {fmtTime(d.sunrise)}
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="sunset" size={13} color={c.secondary} />
                <T v="footnote" tone="secondary" num>
                  {fmtTime(d.sunset)}
                </T>
              </View>
              {best ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  <StatusDot v={best.verdict} />
                  <T v="footnote" num>
                    Melhor: {fmtHour(best.hour.time)} ({best.score})
                  </T>
                </View>
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
