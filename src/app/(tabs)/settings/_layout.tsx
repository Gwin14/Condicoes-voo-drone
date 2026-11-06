import { Stack } from 'expo-router';

import { largeTitleOptions } from '@/components/stackOptions';
import { useTheme } from '@/theme/tokens';

export default function SettingsLayout() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={largeTitleOptions(c)}>
      <Stack.Screen name="index" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="drone-custom" options={{ title: 'Drone personalizado', headerLargeTitle: false }} />
      <Stack.Screen name="widgets" options={{ title: 'Widgets e Live Activity', headerLargeTitle: false }} />
      <Stack.Screen name="regulations" options={{ title: 'Regras no Brasil', headerLargeTitle: false }} />
    </Stack>
  );
}
