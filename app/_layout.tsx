import { useEffect } from "react";
import { Stack } from "expo-router";
import { prefetch } from "../src/dataset/source";

export default function RootLayout() {
  useEffect(() => {
    prefetch();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
