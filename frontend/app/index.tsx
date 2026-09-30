import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { Colors } from "@/src/theme/colors";

export default function Index() {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.brandPrimary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/onboarding" />;
  if (user.role === "guru") return <Redirect href="/(guru)/dashboard" />;
  return <Redirect href="/(siswa)/home" />;
}
