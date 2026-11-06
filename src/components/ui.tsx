import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { radius, space, type, useTheme, type Verdict, verdictColor, verdictSoft } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/* -------------------------------------------------------------------- Texto */

type Variant = keyof typeof type;
type Tone = 'label' | 'secondary' | 'tertiary' | 'accent' | 'go' | 'caution' | 'nogo' | 'onAccent';

export function T({
  v = 'body',
  tone = 'label',
  num,
  style,
  ...rest
}: TextProps & { v?: Variant; tone?: Tone; num?: boolean; style?: StyleProp<TextStyle> }) {
  const { c } = useTheme();
  return (
    <Text
      {...rest}
      style={[type[v], { color: c[tone] }, num && { fontVariant: ['tabular-nums'] }, style]}
    />
  );
}

/* ----------------------------------------------------------------- Cartões */

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: radius.card,
          borderCurve: 'continuous',
          padding: padded ? space.lg : 0,
          overflow: 'hidden',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
  icon,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: IconName;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.xs,
        marginBottom: space.sm,
        marginTop: space.sm,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {icon ? <Icon name={icon} size={15} color={c.secondary} /> : null}
        <T v="headline">{title}</T>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}>
          <T v="subhead" tone="accent">
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------- Press feedback */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  style,
  onPress,
  haptic = false,
  disabled,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean; children: ReactNode }) {
  const s = useSharedValue(1);
  const reduce = useReducedMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[style, anim]}
      onPressIn={(e) => {
        if (!reduce) s.set(withTiming(0.97, { duration: 110, easing: EASE_OUT }));
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withTiming(1, { duration: 160, easing: EASE_OUT }));
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}

/* ------------------------------------------------------------------ Botões */

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: 'primary' | 'secondary' | 'plain' | 'destructive';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const bg =
    kind === 'primary' ? c.accent : kind === 'secondary' ? c.accentSoft : kind === 'destructive' ? c.nogoSoft : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : kind === 'destructive' ? c.nogo : c.accent;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      haptic
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        {
          minHeight: 50,
          borderRadius: radius.pill,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: space.xl,
          gap: space.sm,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={17} color={fg} weight="semibold" /> : null}
          <Text style={[type.headline, { color: fg }]}>{title}</Text>
        </>
      )}
    </PressableScale>
  );
}

/* ---------------------------------------------------------------- Status */

export function StatusDot({ v, size = 8 }: { v: Verdict; size?: number }) {
  const { c } = useTheme();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: verdictColor(c, v) }} />;
}

export function StatusPill({ v, label, small }: { v: Verdict; label: string; small?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: verdictSoft(c, v),
        borderRadius: radius.pill,
        paddingHorizontal: small ? 8 : 10,
        paddingVertical: small ? 2 : 4,
        alignSelf: 'flex-start',
      }}>
      <StatusDot v={v} size={small ? 6 : 7} />
      <Text style={[small ? type.caption2 : type.footnote, { color: verdictColor(c, v), fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------- Linhas */

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  right,
  last,
  destructive,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
  destructive?: boolean;
}) {
  const { c } = useTheme();
  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingLeft: space.lg,
        backgroundColor: pressed ? c.fill : 'transparent',
        gap: space.md,
      }}>
      {icon ? (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: iconColor ?? c.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={icon} size={16} color="#FFFFFF" />
        </View>
      ) : null}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'stretch',
          paddingRight: space.lg,
          paddingVertical: space.md,
          borderBottomWidth: last ? 0 : 0.5,
          borderBottomColor: c.separator,
          gap: space.sm,
        }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="body" tone={destructive ? 'nogo' : 'label'} numberOfLines={1}>
            {title}
          </T>
          {subtitle ? (
            <T v="footnote" tone="secondary" numberOfLines={2}>
              {subtitle}
            </T>
          ) : null}
        </View>
        {value ? (
          <T v="body" tone="secondary" num numberOfLines={1}>
            {value}
          </T>
        ) : null}
        {right}
        {onPress && !right ? <Icon name="chevronRight" size={13} color={c.tertiary} weight="semibold" /> : null}
      </View>
    </View>
  );
  if (!onPress) return content(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

/* -------------------------------------------------------------- Skeleton */

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const o = useSharedValue(0.55);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!reduce) o.set(withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [o, reduce]);
  const anim = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[{ backgroundColor: c.fill, borderRadius: radius.inner, borderCurve: 'continuous' }, style, anim]} />;
}

/* ------------------------------------------------------------ Empty/Erro */

export function EmptyState({
  icon,
  title,
  message,
  action,
  onAction,
  secondary,
  onSecondary,
  tone = 'accent',
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: string;
  onAction?: () => void;
  secondary?: string;
  onSecondary?: () => void;
  tone?: 'accent' | 'nogo';
}) {
  const { c } = useTheme();
  const color = tone === 'nogo' ? c.nogo : c.accent;
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xxl, gap: space.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: tone === 'nogo' ? c.nogoSoft : c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.xs,
        }}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <T v="title3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T v="subhead" tone="secondary" style={{ textAlign: 'center', maxWidth: 320 }}>
        {message}
      </T>
      {action ? <Button title={action} onPress={onAction} style={{ marginTop: space.sm, alignSelf: 'stretch' }} /> : null}
      {secondary ? <Button title={secondary} kind="plain" onPress={onSecondary} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: c.nogoSoft,
        borderRadius: radius.inner,
        borderCurve: 'continuous',
        padding: space.md,
      }}>
      <Icon name="warning" size={18} color={c.nogo} />
      <T v="footnote" style={{ flex: 1 }}>
        {message}
      </T>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={10}>
          <T v="footnote" tone="accent" style={{ fontWeight: '600' }}>
            Tentar de novo
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: 0.5, backgroundColor: c.separator }} />;
}
