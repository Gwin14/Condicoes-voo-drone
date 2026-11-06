import { Stack } from 'expo-router';

import { useTheme } from '@/theme/tokens';

export default function MapLayout() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="index" options={{ title: 'Mapa' }} />
    </Stack>
  );
}
