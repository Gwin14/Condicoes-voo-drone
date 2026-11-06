import * as WebBrowser from 'expo-web-browser';
import { ScrollView, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Card, ListRow, T } from '@/components/ui';
import { space, useTheme } from '@/theme/tokens';

const RULES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'altitude',
    title: 'Até 120 m (400 ft) acima do solo',
    body: 'É a altura máxima usual para operações sem autorização especial do DECEA. Acima disso, a operação precisa de análise específica.',
  },
  {
    icon: 'visibility',
    title: 'Linha de visada (VLOS)',
    body: 'Mantenha o drone sempre à vista, sem binóculos. Voos além da linha de visada (BVLOS) exigem autorização.',
  },
  {
    icon: 'people',
    title: '30 m de pessoas não anuentes',
    body: 'A ANAC exige distância mínima de 30 m de pessoas que não concordaram com a operação, salvo exceções do RBAC-E nº 94.',
  },
  {
    icon: 'airport',
    title: 'Longe de aeródromos e helipontos',
    body: 'Áreas de aproximação e decolagem têm restrições. Confira sempre no SARPAS NG antes do voo — o mapa do Teto é só uma estimativa.',
  },
  {
    icon: 'drone',
    title: 'Cadastro no SISANT acima de 250 g',
    body: 'Drones com peso de decolagem acima de 250 g precisam ser cadastrados na ANAC (SISANT), com a identificação visível na aeronave.',
  },
  {
    icon: 'satellite',
    title: 'Homologação na Anatel',
    body: 'O radiocontrole e a transmissão de vídeo do drone precisam ser homologados pela Anatel.',
  },
  {
    icon: 'warning',
    title: 'Seguro RETA',
    body: 'Para uso não recreativo acima de 250 g, é obrigatório seguro de responsabilidade civil contra terceiros (RETA).',
  },
];

const LINKS = [
  { title: 'SARPAS NG — solicitar voo (DECEA)', url: 'https://sarpas.decea.mil.br' },
  { title: 'SISANT — cadastro de drones (ANAC)', url: 'https://sistemas.anac.gov.br/sisant' },
  { title: 'Drones na ANAC', url: 'https://www.gov.br/anac/pt-br/assuntos/drones' },
  { title: 'Drones no DECEA', url: 'https://www.gov.br/decea/pt-br/assuntos/drone' },
  { title: 'Homologação na Anatel', url: 'https://www.gov.br/anatel/pt-br/regulado/certificacao-de-produtos/drones' },
  { title: 'AISWEB — NOTAMs e cartas', url: 'https://aisweb.decea.mil.br' },
];

export default function RegulationsScreen() {
  const { c } = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: 80 }}>
      <T v="subhead" tone="secondary" style={{ paddingHorizontal: space.xs }}>
        Resumo das principais regras para drones no Brasil. Sempre confira as normas vigentes nos sites oficiais.
      </T>
      <Card style={{ gap: space.lg }}>
        {RULES.map((r) => (
          <View key={r.title} style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, borderCurve: 'continuous', backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={16} color={c.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="headline">{r.title}</T>
              <T v="subhead" tone="secondary">
                {r.body}
              </T>
            </View>
          </View>
        ))}
      </Card>
      <View style={{ gap: space.sm }}>
        <T v="footnote" tone="secondary" style={{ paddingHorizontal: space.lg, textTransform: 'uppercase' }}>
          Fontes oficiais
        </T>
        <Card padded={false}>
          {LINKS.map((l, i) => (
            <ListRow
              key={l.url}
              title={l.title}
              right={<Icon name="link" size={14} color={c.tertiary} />}
              onPress={() => WebBrowser.openBrowserAsync(l.url)}
              last={i === LINKS.length - 1}
            />
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
