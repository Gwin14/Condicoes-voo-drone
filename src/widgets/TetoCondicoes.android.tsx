import { Box, Column, Row, Spacer, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  height,
  paddingAll,
  size,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import { type ConditionsWidgetProps, EMPTY_WIDGET } from './types';

/** Widget Android (Glance via Jetpack Compose) — mesmo conteúdo do iOS medium. */
const TetoCondicoes = (props: ConditionsWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const BG = dark ? '#1C1C1E' : '#FFFFFF';
  const LABEL = dark ? '#F5F5F7' : '#0B0C10';
  const SECONDARY = dark ? '#A0A0A8' : '#62636B';
  const TRACK = dark ? '#2C2C2E' : '#E9E9EF';
  const tint = (v: string) =>
    v === 'go' ? (dark ? '#34D07A' : '#18995A') : v === 'caution' ? (dark ? '#FFC53D' : '#B97F00') : dark ? '#FF6166' : '#D6383E';

  return (
    <Column modifiers={[fillMaxSize(), background(BG), cornerRadius(24), paddingAll(16)]}>
      <Text style={{ fontSize: 12 }} color={SECONDARY} maxLines={1}>
        {props.place}
      </Text>
      <Row verticalAlignment="bottom" modifiers={[fillMaxWidth()]}>
        <Column>
          <Text style={{ fontSize: 40, fontWeight: 'bold' }} color={tint(props.verdict)}>
            {String(props.score)}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }} color={LABEL} maxLines={1}>
            {props.verdictLabel}
          </Text>
          <Text style={{ fontSize: 12 }} color={SECONDARY} maxLines={1}>
            {`${props.wind} ${props.unit} ${props.dir} · ${props.altitude} m`}
          </Text>
        </Column>
        <Spacer modifiers={[width(16)]} />
        <Row verticalAlignment="bottom">
          {props.hours.slice(0, 6).map((h, i) => (
            <Column key={`h${i}`} horizontalAlignment="center" modifiers={[width(22)]}>
              <Box contentAlignment="bottomCenter" modifiers={[size(12, 56), background(TRACK), cornerRadius(6)]}>
                <Box
                  modifiers={[
                    width(12),
                    height(Math.max(8, Math.round((h.s / 100) * 56))),
                    background(tint(h.v)),
                    cornerRadius(6),
                  ]}
                />
              </Box>
              <Text style={{ fontSize: 10 }} color={SECONDARY}>
                {h.t}
              </Text>
            </Column>
          ))}
        </Row>
      </Row>
      <Spacer modifiers={[height(8)]} />
      <Text style={{ fontSize: 12 }} color={LABEL} maxLines={1}>
        {props.next}
      </Text>
    </Column>
  );
};

export default createWidget<ConditionsWidgetProps>('TetoCondicoes', TetoCondicoes, EMPTY_WIDGET);
