import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function Index() {
  const { isLoading, hasCompletedOnboarding, provider } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.dark.background }}>
        <ActivityIndicator color={colors.dark.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!provider) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(home)" />;
}
