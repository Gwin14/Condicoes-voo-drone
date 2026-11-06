import type { Palette } from '@/theme/tokens';

/** Opções de header nativas, compartilhadas por todas as pilhas de abas. */
export function largeTitleOptions(c: Palette) {
  const ios = process.env.EXPO_OS === 'ios';
  return {
    headerLargeTitle: true,
    headerTransparent: ios,
    headerBlurEffect: ios ? ('systemChromeMaterial' as const) : undefined,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerLargeStyle: { backgroundColor: 'transparent' },
    headerStyle: ios ? undefined : { backgroundColor: c.background },
    headerTintColor: c.accent,
    headerTitleStyle: { color: c.label },
    headerLargeTitleStyle: { color: c.label },
    headerBackButtonDisplayMode: 'minimal' as const,
    contentStyle: { backgroundColor: c.background },
  };
}
