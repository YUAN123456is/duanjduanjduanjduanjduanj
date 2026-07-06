import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0D14" } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
