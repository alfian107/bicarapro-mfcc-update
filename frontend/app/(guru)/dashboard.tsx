import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  ImageBackground, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";

const HERO =
  "https://images.unsplash.com/photo-1604525241109-c3b7eecf4add?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHx0ZWFjaGVyJTIwc3R1ZGVudCUyMGNsYXNzcm9vbSUyMGhpZ2glMjBzY2hvb2x8ZW58MHx8fHwxNzg1MjU5MTExfDA&ixlib=rb-4.1.0&q=85";

type Student = {
  id: string; email: string; name: string; kelas?: string | null;
  latest: { overall_score: number; created_at: string; id: string } | null;
  recording_count: number; average_score: number;
};
type Stats = { total_students: number; total_analyses: number; class_average: number };

export default function GuruDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([api.teacherStudents(), api.teacherStats()]);
      setStudents(s);
      setStats(st);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <ImageBackground source={{ uri: HERO }} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={["rgba(15,23,42,0.35)", "rgba(15,23,42,0.9)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView edges={["top"]}>
            <View style={styles.heroContent}>
              <Text style={styles.hello}>Selamat datang,</Text>
              <Text style={styles.name}>{user?.name ?? "Guru"}</Text>

              <View style={styles.statsRow}>
                <StatBox label="Total Siswa" value={`${stats?.total_students ?? 0}`} />
                <StatBox label="Total Rekaman" value={`${stats?.total_analyses ?? 0}`} />
                <StatBox label="Rata Kelas" value={`${stats?.class_average ?? 0}`} />
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Siswa</Text>
          {loading ? (
            <ActivityIndicator color={Colors.brandPrimary} style={{ marginTop: Spacing.lg }} />
          ) : students.length === 0 ? (
            <View style={styles.empty} testID="guru-empty">
              <Ionicons name="people-outline" size={40} color={Colors.onSurfaceTertiary} />
              <Text style={styles.emptyText}>Belum ada siswa terdaftar</Text>
            </View>
          ) : (
            students.map((s) => (
              <TouchableOpacity
                key={s.id}
                testID={`guru-student-${s.id}`}
                style={styles.card}
                onPress={() => router.push(`/student/${s.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{s.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.studentMeta} numberOfLines={1}>
                    {s.kelas ?? "-"} • {s.recording_count} rekaman
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Rata-rata</Text>
                  <Text style={styles.scoreValue}>{s.average_score.toFixed(0)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  hero: { minHeight: 260 },
  heroContent: { padding: Spacing.xl, gap: Spacing.md },
  hello: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  name: { color: "#fff", fontSize: 26, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md },
  statBox: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.15)", padding: Spacing.md,
    borderRadius: Radius.md, alignItems: "center",
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: Colors.onSurface },
  empty: { alignItems: "center", padding: Spacing.xl, gap: Spacing.sm },
  emptyText: { color: Colors.onSurfaceTertiary },
  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.surfaceSecondary, padding: Spacing.lg,
    borderRadius: Radius.md, borderColor: Colors.border, borderWidth: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  studentName: { fontSize: 15, fontWeight: "600", color: Colors.onSurface },
  studentMeta: { fontSize: 12, color: Colors.onSurfaceTertiary, marginTop: 2 },
  scoreBox: { alignItems: "flex-end" },
  scoreLabel: { fontSize: 10, color: Colors.onSurfaceTertiary },
  scoreValue: { fontSize: 22, fontWeight: "700", color: Colors.brandSecondary },
});
