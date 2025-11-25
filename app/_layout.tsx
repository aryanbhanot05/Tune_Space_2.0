import { Stack } from "expo-router";
import React from "react";
import { NotificationProvider } from '../contexts/NotificationContext';
import '../globals.js';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="capture"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal'
          }}
        />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
}
