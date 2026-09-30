import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/onboarding");
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name?.[0] ?? "U").toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={user?.role === "guru" ? "person" : "school"} size={14} color={Colors.onBrandTertiary} />
          <Text style={styles.roleText}>
            {user?.role === "guru" ? "Guru" : "Siswa"}
            {user?.kelas ? ` • ${user.kelas}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Tentang BicaraPro</Text>
        <Text style={styles.infoText}>
          Aplikasi analisis intonasi & kejelasan suara public speaking menggunakan algoritma
          Mel-Frequency Cepstral Coefficients (MFCC) untuk siswa SMK Swasta Binaguna Tanah Jawa.
        </Text>
      </View>

      <TouchableOpacity
        testID="profile-logout-btn"
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface, padding: Spacing.lg },
  header: {
    alignItems: "center", gap: Spacing.sm, padding: Spacing.xl,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.lg,
    borderColor: Colors.border, borderWidth: 1,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: Colors.onSurface, marginTop: Spacing.sm },
  email: { fontSize: 13, color: Colors.onSurfaceTertiary },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.brandTertiary, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, marginTop: Spacing.sm,
  },
  roleText: { fontSize: 12, fontWeight: "600", color: Colors.onBrandTertiary },
  info: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1,
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.onSurfaceTertiary, lineHeight: 20 },
  logoutBtn: {
    marginTop: Spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.md,
    backgroundColor: "#FEF2F2", borderColor: "#FECACA", borderWidth: 1,
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: "700" },
});
