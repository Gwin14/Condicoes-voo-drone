import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, StatusPill, T } from '@/components/ui';
import { useMetar } from '@/hooks/useConditions';
import { kindLabel, type NearbyAirport } from '@/lib/airports';
import { cardinal, fmtDistance, fmtSpeed, fmtTime, type SpeedUnit } from '@/lib/format';
import { space, useTheme } from '@/theme/tokens';

const catColor = { VFR: 'go', MVFR: 'caution', IFR: 'nogo', LIFR: 'nogo' } as const;

/** Espaço aéreo: aeródromos cadastrados próximos, afastamento do DECEA e METAR decodificado. */
export function AirspaceCard({ airports, unit }: { airports: NearbyAirport[]; unit: SpeedUnit }) {
  const { c } = useTheme();
  const icaos = airports.slice(0, 3).map((a) => a.icao);
  const metar = useMetar(icaos);
  const nearest = airports[0];

  return (
    <Card style={{ gap: space.md }}>
      {nearest ? (
        airports.slice(0, 3).map((a, i) => {
          const m = metar.data?.find((x) => x.icao === a.icao);
          return (
            <View
              key={a.icao}
              style={{
                gap: space.sm,
                paddingBottom: i < Math.min(airports.length, 3) - 1 ? space.md : 0,
                borderBottomWidth: i < Math.min(airports.length, 3) - 1 ? 0.5 : 0,
                borderBottomColor: c.separator,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Icon name="airport" size={22} color={a.zone === 'critical' ? c.nogo : a.zone === 'caution' ? c.caution : c.secondary} />
                <View style={{ flex: 1 }}>
                  <T v="headline" numberOfLines={1}>
                    {a.icao} · {a.name}
                  </T>
                  <T v="footnote" tone="secondary" num>
                    {fmtDistance(a.distance)} a {cardinal(a.bearing)} · {kindLabel[a.kind]}
                    {a.city ? ` · ${a.city}` : ''}
                  </T>
                </View>
                {a.zone !== 'clear' ? (
                  <StatusPill v={a.zone === 'critical' ? 'nogo' : 'caution'} label={a.zone === 'critical' ? 'Restrita' : 'Até 30 m'} small />
                ) : null}
              </View>
              {m ? (
                <View style={{ gap: 4, paddingLeft: 34 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    {m.category ? <StatusPill v={catColor[m.category]} label={m.category} small /> : null}
                    <T v="footnote" tone="secondary" num>
                      {m.windKt != null ? `Vento ${fmtSpeed(m.windKt * 1.852, unit)}${m.windDir != null ? ` de ${cardinal(m.windDir)}` : ''}` : ''}
                      {m.gustKt ? ` · raj. ${fmtSpeed(m.gustKt * 1.852, unit)}` : ''}
                      {` · ${fmtTime(m.obsTime)}`}
                    </T>
                  </View>
                  <T v="caption" tone="tertiary" selectable style={{ fontFamily: process.env.EXPO_OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {m.raw}
                  </T>
                </View>
              ) : null}
            </View>
          );
        })
      ) : (
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <Icon name="check" size={22} color={c.go} />
          <T v="subhead" tone="secondary" style={{ flex: 1 }}>
            Nenhum aeródromo cadastrado na ANAC num raio de 60 km. Ainda assim, confira helipontos e áreas restritas no SARPAS.
          </T>
        </View>
      )}
      <T v="caption" tone="tertiary">
        Aeródromos: cadastro da ANAC. Afastamento: ICA 100-40 (3 NM até 30 m, 5 NM até 120 m). Todo voo precisa de autorização no SARPAS NG.
      </T>
      <Button
        title="Abrir SARPAS NG"
        kind="secondary"
        icon="link"
        onPress={() => WebBrowser.openBrowserAsync('https://sarpas.decea.mil.br')}
      />
    </Card>
  );
}
