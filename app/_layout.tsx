import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AccountsProvider } from '@/lib/AccountsContext';
import { colors } from '@/components/ui';

export default function RootLayout() {
  return (
    <AccountsProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'BillWise PK' }} />
        <Stack.Screen name="add" options={{ title: 'Add a bill', presentation: 'modal' }} />
        <Stack.Screen name="enter" options={{ title: 'Enter a bill', presentation: 'modal' }} />
        <Stack.Screen name="account/[id]" options={{ title: 'Bill details' }} />
      </Stack>
    </AccountsProvider>
  );
}
