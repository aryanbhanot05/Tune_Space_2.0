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
        <Stack.Screen name="signin_followup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Define the capture screen as a full-screen modal */}
        <Stack.Screen
          name="capture"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal'
          }}
        />
      </Stack>
    </NotificationProvider>
  );
}
