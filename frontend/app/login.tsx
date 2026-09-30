import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      if (user.role === "guru") router.replace("/(guru)/dashboard");
      else router.replace("/(siswa)/home");
    } catch (e: any) {
      setError(e.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="login-back-btn">
          <Ionicons name="chevron-back" size={26} color={Colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.title}>Masuk</Text>
        <Text style={styles.subtitle}>Lanjutkan latihan public speaking-mu</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="nama@sekolah.sch.id"
            placeholderTextColor={Colors.onSurfaceTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="login-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={Colors.onSurfaceTertiary}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </View>

        {error && (
          <View style={styles.errorBox} testID="login-error">
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          testID="login-submit-btn"
          style={[styles.primary, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onBrandPrimary} />
          ) : (
            <Text style={styles.primaryText}>Masuk</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Belum punya akun? </Text>
          <Link href="/onboarding" replace>
            <Text style={styles.registerLink} testID="login-register-link">Daftar sekarang</Text>
          </Link>
        </View>

        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Akun Demo</Text>
          <Text style={styles.demoLine}>Siswa: siswa@smkbinaguna.sch.id / siswa123</Text>
          <Text style={styles.demoLine}>Guru: guru@smkbinaguna.sch.id / guru123</Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  back: { alignSelf: "flex-start", padding: Spacing.xs, marginBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: "700", color: Colors.onSurface },
  subtitle: { fontSize: 15, color: Colors.onSurfaceTertiary, marginBottom: Spacing.lg },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.onSurfaceSecondary },
  input: {
    height: 52,
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
    color: Colors.onSurface,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF2F2", padding: Spacing.md, borderRadius: Radius.md,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  primary: {
    marginTop: Spacing.md, height: 54, backgroundColor: Colors.brandPrimary,
    borderRadius: Radius.md, alignItems: "center", justifyContent: "center",
  },
  primaryText: { color: Colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: Spacing.md },
  registerText: { color: Colors.onSurfaceTertiary, fontSize: 14 },
  registerLink: { color: Colors.brandPrimary, fontSize: 14, fontWeight: "700" },
  demoCard: {
    marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.brandTertiary,
    borderRadius: Radius.md, gap: 4,
  },
  demoTitle: { fontSize: 13, fontWeight: "700", color: Colors.onBrandTertiary, marginBottom: 4 },
  demoLine: { fontSize: 12, color: Colors.onBrandTertiary },
});
