import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="signin" options={{headerShown: false}}/>
      <Stack.Screen name="(tabs)" options={{headerShown: false }} />
      <Stack.Screen name="capture" options={{headerShown: false}}/>
    </Stack>
  );
}
