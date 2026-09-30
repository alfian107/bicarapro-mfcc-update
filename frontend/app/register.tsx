import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: "siswa" | "guru" }>();
  const { signUp } = useAuth();

  const [role, setRole] = useState<"siswa" | "guru">(params.role ?? "siswa");
  const [name, setName] = useState("");
  const [kelas, setKelas] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError("Nama, email, dan password wajib diisi");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const user = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
        kelas: role === "siswa" ? (kelas.trim() || null) : null,
      });
      if (user.role === "guru") router.replace("/(guru)/dashboard");
      else router.replace("/(siswa)/home");
    } catch (e: any) {
      setError(e.message || "Gagal mendaftar");
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
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="register-back-btn">
          <Ionicons name="chevron-back" size={26} color={Colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.subtitle}>Bergabunglah dengan BicaraPro</Text>

        <View style={styles.roleSwitch}>
          <TouchableOpacity
            testID="register-role-siswa"
            style={[styles.roleChip, role === "siswa" && styles.roleChipActive]}
            onPress={() => setRole("siswa")}
          >
            <Text style={[styles.roleChipText, role === "siswa" && styles.roleChipTextActive]}>Siswa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="register-role-guru"
            style={[styles.roleChip, role === "guru" && styles.roleChipActive]}
            onPress={() => setRole("guru")}
          >
            <Text style={[styles.roleChipText, role === "guru" && styles.roleChipTextActive]}>Guru</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            testID="register-name-input"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nama lengkap"
            placeholderTextColor={Colors.onSurfaceTertiary}
          />
        </View>

        {role === "siswa" && (
          <View style={styles.field}>
            <Text style={styles.label}>Kelas</Text>
            <TextInput
              testID="register-kelas-input"
              style={styles.input}
              value={kelas}
              onChangeText={setKelas}
              placeholder="Contoh: XII-TKJ"
              placeholderTextColor={Colors.onSurfaceTertiary}
              autoCapitalize="characters"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="register-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="nama@sekolah.sch.id"
            placeholderTextColor={Colors.onSurfaceTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="register-password-input"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Minimal 6 karakter"
            placeholderTextColor={Colors.onSurfaceTertiary}
            secureTextEntry
          />
        </View>

        {error && (
          <View style={styles.errorBox} testID="register-error">
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          testID="register-submit-btn"
          style={[styles.primary, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onBrandPrimary} />
          ) : (
            <Text style={styles.primaryText}>Daftar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")} style={{ marginTop: Spacing.md }}>
          <Text style={styles.loginLink} testID="register-login-link">
            Sudah punya akun? <Text style={{ fontWeight: "700" }}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  back: { alignSelf: "flex-start", padding: Spacing.xs, marginBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: "700", color: Colors.onSurface },
  subtitle: { fontSize: 15, color: Colors.onSurfaceTertiary, marginBottom: Spacing.md },
  roleSwitch: {
    flexDirection: "row", backgroundColor: Colors.surfaceTertiary,
    borderRadius: Radius.pill, padding: 4, alignSelf: "flex-start",
  },
  roleChip: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  roleChipActive: { backgroundColor: Colors.brandPrimary },
  roleChipText: { fontSize: 13, fontWeight: "600", color: Colors.onSurfaceTertiary },
  roleChipTextActive: { color: Colors.onBrandPrimary },
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
  loginLink: { textAlign: "center", color: Colors.onSurfaceTertiary, fontSize: 14 },
});
