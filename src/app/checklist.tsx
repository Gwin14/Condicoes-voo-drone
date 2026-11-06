import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { SheetHeader } from '@/components/SheetHeader';
import { Button, Card, StatusPill, T } from '@/components/ui';
import { useConditions } from '@/hooks/useConditions';
import { useActiveLocation } from '@/hooks/useLocation';
import { startFlight } from '@/lib/flight';
import { verdictLabel } from '@/lib/scoring';
import { useApp } from '@/store/app';
import { space, useTheme } from '@/theme/tokens';

type Item = { id: string; label: string; hint?: string; required?: boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Documentação',
    items: [
      { id: 'sarpas', label: 'Solicitação no SARPAS aprovada', hint: 'Ou operação enquadrada nas regras sem solicitação', required: true },
      { id: 'sisant', label: 'Drone cadastrado no SISANT (ANAC)', hint: 'Obrigatório acima de 250 g' },
      { id: 'seguro', label: 'Seguro RETA válido', hint: 'Obrigatório para uso não recreativo acima de 250 g' },
    ],
  },
  {
    title: 'Aeronave',
    items: [
      { id: 'baterias', label: 'Baterias carregadas e aquecidas', required: true },
      { id: 'helices', label: 'Hélices sem trincas e bem presas', required: true },
      { id: 'firmware', label: 'Firmware e mapas atualizados' },
      { id: 'cartao', label: 'Cartão de memória com espaço' },
      { id: 'home', label: 'Ponto de retorno (Home) gravado', required: true },
      { id: 'rth', label: 'Altura de RTH acima dos obstáculos', required: true },
    ],
  },
  {
    title: 'Ambiente',
    items: [
      { id: 'area', label: 'Área de decolagem livre e plana', required: true },
      { id: 'pessoas', label: 'Distância segura de pessoas não anuentes', hint: 'Mínimo de 30 m (ANAC)', required: true },
      { id: 'obstaculos', label: 'Fios, antenas e árvores mapeados' },
      { id: 'vlos', label: 'Linha de visada garantida (VLOS)', required: true },
    ],
  },
];

export default function ChecklistScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const checks = useApp((s) => s.checklist);
  const toggle = useApp((s) => s.toggleCheck);
  const reset = useApp((s) => s.resetChecklist);
  const { location } = useActiveLocation();
  const { data, drone } = useConditions(location?.lat, location?.lon);
  const [starting, setStarting] = useState(false);

  const all = GROUPS.flatMap((g) => g.items);
  const required = all.filter((i) => i.required);
  const doneRequired = required.filter((i) => checks[i.id]).length;
  const done = all.filter((i) => checks[i.id]).length;
  const ready = doneRequired === required.length && !!data && !!location;

  const takeoff = async () => {
    if (!data || !location || starting) return;
    setStarting(true);
    await startFlight(data, location, drone);
    // Porta de mão única: o checklist não volta para a pilha.
    router.dismissTo('/flight');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <SheetHeader title="Checklist pré-voo" right={done > 0 ? 'Limpar' : undefined} onRight={reset} modal />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 0, gap: space.lg, paddingBottom: 140 }}>
        {data ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T v="headline">{location?.name}</T>
              <T v="footnote" tone="secondary">
                {drone.brand} {drone.name} · score {data.now.score}
              </T>
            </View>
            <StatusPill v={data.now.verdict} label={verdictLabel[data.now.verdict]} small />
          </Card>
        ) : null}

        {GROUPS.map((g) => (
          <View key={g.title} style={{ gap: space.sm }}>
            <T v="footnote" tone="secondary" style={{ paddingHorizontal: space.xs, textTransform: 'uppercase' }}>
              {g.title}
            </T>
            <Card padded={false}>
              {g.items.map((it, i) => {
                const on = !!checks[it.id];
                return (
                  <Pressable
                    key={it.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      toggle(it.id);
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}>
                    {({ pressed }) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.lg, backgroundColor: pressed ? c.fill : 'transparent' }}>
                        <Icon name={on ? 'check' : 'circle'} size={24} color={on ? c.go : c.tertiary} />
                        <View
                          style={{
                            flex: 1,
                            paddingVertical: space.md,
                            paddingRight: space.lg,
                            borderBottomWidth: i === g.items.length - 1 ? 0 : 0.5,
                            borderBottomColor: c.separator,
                            gap: 2,
                          }}>
                          <T v="body" tone={on ? 'secondary' : 'label'}>
                            {it.label}
                            {it.required ? <T v="body" tone="nogo">{' *'}</T> : null}
                          </T>
                          {it.hint ? (
                            <T v="footnote" tone="tertiary">
                              {it.hint}
                            </T>
                          ) : null}
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))}
        <T v="caption" tone="tertiary" style={{ paddingHorizontal: space.xs }}>
          * Itens obrigatórios para liberar a decolagem no app.
        </T>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, space.lg),
          backgroundColor: c.background,
          borderTopWidth: 0.5,
          borderTopColor: c.separator,
          gap: space.sm,
        }}>
        <T v="footnote" tone="secondary" num style={{ textAlign: 'center' }}>
          {doneRequired} de {required.length} obrigatórios · {done} de {all.length} no total
        </T>
        <Button title="Decolar" icon="flight" onPress={takeoff} disabled={!ready} loading={starting} />
      </View>
    </View>
  );
}
