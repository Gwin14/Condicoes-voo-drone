import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { factorIcon } from '@/components/now/FactorsCard';
import { SheetHeader } from '@/components/SheetHeader';
import { Button, Card, StatusPill, T } from '@/components/ui';
import { useConditions } from '@/hooks/useConditions';
import { useActiveLocation } from '@/hooks/useLocation';
import { fmtSpeed } from '@/lib/format';
import type { FactorId } from '@/lib/scoring';
import { verdictShort } from '@/lib/scoring';
import { useApp } from '@/store/app';
import { space, useTheme, verdictColor } from '@/theme/tokens';

const COPY: Record<FactorId, { title: string; why: string; tips: string[] }> = {
  wind: {
    title: 'Vento sustentado',
    why: 'O vento em altitude costuma ser bem mais forte que no chão. Perto do limite do fabricante o drone gasta muita bateria para se manter e pode não conseguir voltar.',
    tips: [
      'Decole contra o vento: o retorno, com a bateria mais baixa, fica a favor.',
      'Acima de 70% do limite, mantenha o drone perto e baixo.',
      'Drones de até 250 g sentem o vento antes — tenha margem extra.',
    ],
  },
  gust: {
    title: 'Rajadas e turbulência',
    why: 'Rajadas são picos curtos de vento. Uma diferença grande entre vento médio e rajada indica ar turbulento, que desestabiliza a imagem e pode derrubar drones leves.',
    tips: ['Evite voar a sotavento de prédios, morros e árvores.', 'Use o modo Cine/Tripé apenas com vento calmo.'],
  },
  precip: {
    title: 'Chuva',
    why: 'A maioria dos drones de consumo não tem proteção contra água. Umidade nos motores e na eletrônica pode causar pane em voo.',
    tips: ['Garoa também conta: gotas acumulam nas hélices e na lente.', 'Seque o drone antes de guardar.'],
  },
  visibility: {
    title: 'Visibilidade',
    why: 'As regras brasileiras exigem voo em linha de visada (VLOS). Névoa, fumaça e nevoeiro reduzem quanto você consegue enxergar o drone.',
    tips: ['Com visibilidade abaixo de 3 km, encurte a distância do voo.', 'Nevoeiro também atrapalha os sensores de obstáculo.'],
  },
  cloudbase: {
    title: 'Base de nuvens',
    why: 'Estimada pela diferença entre temperatura e ponto de orvalho (~125 m por °C). Entrar na nuvem significa perder a visão do drone e molhar a eletrônica.',
    tips: ['Mantenha pelo menos 30 m abaixo da base estimada.', 'Nuvens baixas e espessas costumam vir com umidade alta.'],
  },
  temperature: {
    title: 'Temperatura',
    why: 'Baterias de LiPo perdem capacidade no frio e podem desligar abruptamente. No calor, motores e eletrônica superaquecem.',
    tips: ['Abaixo de 10°, aqueça as baterias (no bolso ou no carro) antes de decolar.', 'Paire 1 minuto após decolar para aquecer as células.'],
  },
  kp: {
    title: 'Índice Kp (geomagnético)',
    why: 'O Kp mede a atividade geomagnética causada pelo Sol. Valores altos degradam a precisão do GPS/GNSS e podem afetar a bússola, o que leva a derivas e a um retorno impreciso.',
    tips: ['Kp ≥ 5: prefira voos curtos, com a posição de retorno bem gravada.', 'Calibre a bússola longe de metais se o app pedir.'],
  },
  daylight: {
    title: 'Luz do dia',
    why: 'Voo noturno exige luzes de navegação no drone e, dependendo da operação, autorização específica no SARPAS.',
    tips: ['Hora dourada e hora azul rendem as melhores imagens.', 'Ative as luzes de posição do drone ao entardecer.'],
  },
  satellites: {
    title: 'Satélites disponíveis',
    why: 'O drone precisa de satélites suficientes e bem distribuídos no céu para manter a posição, segurar o pairado e voltar ao ponto Home. O Teto calcula quantos satélites GPS, Galileo, GLONASS e BeiDou estão acima da máscara de elevação e a diluição de precisão (PDOP): quanto menor, melhor.',
    tips: [
      'Os números são para céu aberto: prédios, morros e árvores bloqueiam parte do céu.',
      'Espere o drone confirmar 10 ou mais satélites e gravar o Home antes de decolar.',
      'PDOP acima de 3 indica geometria ruim — o pairado pode derivar.',
    ],
  },
  ionosphere: {
    title: 'Ionosfera e rádio',
    why: 'O Brasil fica sob a Anomalia de Ionização Equatorial. Depois do pôr do sol, principalmente de setembro a março, surgem bolhas de plasma que fazem o sinal dos satélites cintilar: o receptor perde satélites e a precisão cai. Erupções solares (escala R da NOAA) também degradam sinais de rádio no lado iluminado da Terra.',
    tips: [
      'Prefira voar de dia em temporada de cintilação; entre 20h e 0h o risco é maior.',
      'Com cintilação alta, mantenha o drone próximo e esteja pronto para o modo ATTI.',
      'Escala R3 ou maior: espere instabilidade no GNSS e no link de rádio.',
    ],
  },
  airspace: {
    title: 'Espaço aéreo',
    why: 'Perto de aeródromos há rotas de aproximação e decolagem de aviões e helicópteros. O Teto estima uma zona por distância; quem autoriza de fato é o DECEA, pelo SARPAS NG.',
    tips: [
      'Dentro da zona estimada, só voe com autorização aprovada no SARPAS.',
      'Helipontos não aparecem no mapa do Teto — confira no SARPAS.',
      'Consulte NOTAMs no AISWEB para restrições temporárias.',
    ],
  },
  storm: {
    title: 'Instabilidade',
    why: 'CAPE alto indica atmosfera instável, com chance de trovoadas, rajadas fortes e descargas elétricas.',
    tips: ['Se ouvir trovões, pouse imediatamente.', 'Frentes de rajada chegam antes da chuva.'],
  },
};

export default function FactorSheet() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: FactorId }>();
  const { location } = useActiveLocation();
  const { data, drone } = useConditions(location?.lat, location?.lon);
  const unit = useApp((s) => s.speedUnit);
  const copy = COPY[id as FactorId] ?? COPY.wind;
  const factor = data?.now.factors.find((f) => f.id === id);
  const next = data?.hours.slice(0, 12).map((h) => ({ t: h.hour.time, f: h.factors.find((x) => x.id === id) })) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <SheetHeader title={copy.title} left={null} right="OK" onRight={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 0, gap: space.lg, paddingBottom: 48 }}>
        {factor ? (
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Icon name={factorIcon[factor.id]} size={26} color={verdictColor(c, factor.status)} />
              <View style={{ flex: 1, gap: 4 }}>
                <T v="title3" num>
                  {factor.detail}
                </T>
                <StatusPill v={factor.status} label={verdictShort[factor.status]} small />
              </View>
            </View>
            {id === 'wind' || id === 'gust' ? (
              <T v="footnote" tone="secondary">
                Limite do {drone.brand} {drone.name}: {fmtSpeed(drone.maxWind, unit)}
              </T>
            ) : null}
            {next.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 4, marginTop: space.xs }}>
                {next.map((n) => (
                  <View key={n.t.getTime()} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <View
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: n.f ? verdictColor(c, n.f.status) : c.fill,
                      }}
                    />
                    <T v="caption2" tone="tertiary" num>
                      {String(n.t.getHours()).padStart(2, '0')}
                    </T>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        ) : null}
        <T v="body">{copy.why}</T>
        {id === 'satellites' || id === 'ionosphere' || id === 'kp' ? (
          <Button
            title="Ver satélites e interferências"
            kind="secondary"
            icon="satellite"
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/gnss'), 250);
            }}
          />
        ) : null}
        <View style={{ gap: space.md }}>
          {copy.tips.map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: space.md }}>
              <Icon name="check" size={18} color={c.go} />
              <T v="subhead" tone="secondary" style={{ flex: 1 }}>
                {t}
              </T>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
