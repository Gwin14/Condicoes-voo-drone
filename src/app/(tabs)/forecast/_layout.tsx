import { Stack } from 'expo-router';

import { largeTitleOptions } from '@/components/stackOptions';
import { useTheme } from '@/theme/tokens';

export default function ForecastLayout() {
  const { c } = useTheme();
  return (
    <Stack screenOptions={largeTitleOptions(c)}>
      <Stack.Screen name="index" options={{ title: 'Previsão' }} />
    </Stack>
  );
}
