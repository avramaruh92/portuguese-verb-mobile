import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { prefetch } from "../src/dataset/source";

export default function RootLayout() {
  useEffect(() => {
    prefetch();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: true }} />
    </SafeAreaProvider>
  );
}
