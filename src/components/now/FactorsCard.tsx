import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Card, StatusDot, T } from '@/components/ui';
import type { Factor, FactorId } from '@/lib/scoring';
import { space, useTheme } from '@/theme/tokens';

export const factorIcon: Record<FactorId, IconName> = {
  wind: 'wind',
  gust: 'gust',
  precip: 'rain',
  visibility: 'visibility',
  cloudbase: 'cloud',
  temperature: 'thermometer',
  kp: 'satellite',
  daylight: 'sun',
  storm: 'bolt',
  airspace: 'airport',
};

export function FactorsCard({ factors }: { factors: Factor[] }) {
  const { c } = useTheme();
  return (
    <Card padded={false}>
      {factors.map((f, i) => (
        <Pressable
          key={f.id}
          onPress={() => router.push({ pathname: '/factor/[id]', params: { id: f.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${f.label}: ${f.detail}`}>
          {({ pressed }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingLeft: space.lg,
                backgroundColor: pressed ? c.fill : 'transparent',
              }}>
              <Icon name={factorIcon[f.id]} size={18} color={c.secondary} />
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.sm,
                  paddingVertical: 13,
                  paddingRight: space.lg,
                  borderBottomWidth: i === factors.length - 1 ? 0 : 0.5,
                  borderBottomColor: c.separator,
                }}>
                <View style={{ flex: 1, gap: 1 }}>
                  <T v="callout" style={{ fontWeight: '500' }}>
                    {f.label}
                  </T>
                  <T v="footnote" tone="secondary" numberOfLines={1}>
                    {f.detail}
                  </T>
                </View>
                <StatusDot v={f.status} size={10} />
                <Icon name="chevronRight" size={12} color={c.tertiary} weight="semibold" />
              </View>
            </View>
          )}
        </Pressable>
      ))}
    </Card>
  );
}
