import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { DramaProvider } from "@/context/DramaContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0D14" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(home)" />
      <Stack.Screen name="player" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <DramaProvider>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0A0D14" }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </DramaProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
