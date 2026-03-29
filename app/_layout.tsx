import 'react-native-url-polyfill/auto';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/lib/queryClient';
import { Colors } from '@/constants/theme';
import SplashAnimation from '@/components/SplashAnimation';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="match/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="team/[id]" options={{ headerShown: false, presentation: 'card' }} />
        </Stack>
        {!splashDone && (
          <SplashAnimation onFinish={() => setSplashDone(true)} />
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
