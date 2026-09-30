import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";

const HERO =
  "https://images.unsplash.com/photo-1715610258704-e8f9f5710fe0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwyfHxlZHVjYXRpb24lMjBwdWJsaWMlMjBzcGVha2luZyUyMHN0dWRlbnR8ZW58MHx8fHwxNzg1MjU5MTExfDA&ixlib=rb-4.1.0&q=85";

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root} testID="onboarding-screen">
      <StatusBar barStyle="light-content" />
      <ImageBackground source={{ uri: HERO }} style={styles.hero} resizeMode="cover">
        <LinearGradient
          colors={["rgba(15,23,42,0)", "rgba(15,23,42,0.55)", "rgba(15,23,42,0.95)"]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.content} edges={["top", "bottom"]}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="mic" size={18} color={Colors.onBrandPrimary} />
            </View>
            <Text style={styles.brandText}>BicaraPro</Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.cta}>
            <Text style={styles.headline}>Kuasai Public Speaking dengan Analisis MFCC</Text>
            <Text style={styles.sub}>
              Ukur intonasi & kejelasan suaramu secara ilmiah. Dapatkan feedback AI dan
              transkrip otomatis untuk latihan yang efektif.
            </Text>

            <View style={styles.roleRow}>
              <TouchableOpacity
                testID="onboarding-role-siswa"
                style={[styles.roleBtn, styles.roleSiswa]}
                onPress={() => router.push({ pathname: "/register", params: { role: "siswa" } })}
                activeOpacity={0.85}
              >
                <Ionicons name="school-outline" size={22} color={Colors.onBrandPrimary} />
                <Text style={styles.roleBtnText}>Saya Siswa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="onboarding-role-guru"
                style={[styles.roleBtn, styles.roleGuru]}
                onPress={() => router.push({ pathname: "/register", params: { role: "guru" } })}
                activeOpacity={0.85}
              >
                <Ionicons name="person-outline" size={22} color={Colors.onBrandSecondary} />
                <Text style={styles.roleBtnText}>Saya Guru</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="onboarding-login-link"
              onPress={() => router.push("/login")}
              style={{ paddingVertical: Spacing.md, marginBottom: Math.max(insets.bottom, Spacing.md) }}
            >
              <Text style={styles.loginText}>
                Sudah punya akun? <Text style={{ fontWeight: "700" }}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceInverse },
  hero: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.md },
  brandBadge: {
    width: 34, height: 34, borderRadius: Radius.md, backgroundColor: Colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  brandText: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  cta: { gap: Spacing.md },
  headline: { color: "#fff", fontSize: 30, fontWeight: "700", lineHeight: 36 },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22 },
  roleRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  roleBtn: {
    flex: 1, height: 56, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: Spacing.sm,
  },
  roleSiswa: { backgroundColor: Colors.brandPrimary },
  roleGuru: { backgroundColor: Colors.brandSecondary },
  roleBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  loginText: { textAlign: "center", color: "rgba(255,255,255,0.9)", fontSize: 14 },
});
