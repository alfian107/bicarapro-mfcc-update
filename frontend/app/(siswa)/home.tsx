import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/api/client";

type HistoryItem = {
  id: string; title: string; intonation_score: number; clarity_score: number;
  overall_score: number; duration_seconds: number; created_at: string;
};

export default function StudentHome() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.history();
      setHistory(data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const avg = history.length
    ? Math.round(history.reduce((s, h) => s + h.overall_score, 0) / history.length)
    : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <SafeAreaView edges={["top"]}>
          <LinearGradient
            colors={[Colors.brandPrimary, Colors.brandSecondary]}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.hello}>Halo,</Text>
                <Text style={styles.name} numberOfLines={1}>{user?.name ?? "Siswa"}</Text>
                {user?.kelas && <Text style={styles.kelas}>Kelas {user.kelas}</Text>}
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.name?.[0] ?? "S").toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Skor Rata-rata" value={`${avg}`} suffix="/100" />
              <View style={styles.statDivider} />
              <StatCard label="Total Latihan" value={`${history.length}`} suffix="" />
            </View>
          </LinearGradient>
        </SafeAreaView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latihan Terakhir</Text>
          {loading ? (
            <ActivityIndicator color={Colors.brandPrimary} style={{ marginTop: Spacing.lg }} />
          ) : history.length === 0 ? (
            <View style={styles.emptyCard} testID="student-home-empty">
              <Ionicons name="mic-outline" size={36} color={Colors.brandPrimary} />
              <Text style={styles.emptyTitle}>Belum ada rekaman</Text>
              <Text style={styles.emptyText}>Mulai latihan pertamamu untuk melihat hasil analisis MFCC di sini.</Text>
            </View>
          ) : (
            history.slice(0, 5).map((h) => (
              <TouchableOpacity
                key={h.id}
                testID={`student-home-history-${h.id}`}
                style={styles.card}
                onPress={() => router.push(`/result/${h.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="mic" size={20} color={Colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{h.title}</Text>
                  <Text style={styles.cardMeta}>
                    {new Date(h.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })} • {h.duration_seconds.toFixed(0)}s
                  </Text>
                </View>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{Math.round(h.overall_score)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips Public Speaking</Text>
          <TouchableOpacity
            testID="student-home-materials-link"
            style={styles.tipCard}
            onPress={() => router.push("/(siswa)/materials")}
          >
            <View style={styles.tipIcon}>
              <Ionicons name="book" size={22} color={Colors.onBrandTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Panduan lengkap</Text>
              <Text style={styles.tipSub}>Pemanasan vokal, intonasi, artikulasi & lainnya</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.onSurfaceTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.stickyCta, { bottom: 60 + insets.bottom + 12 }]}>
        <TouchableOpacity
          testID="student-home-record-btn"
          style={styles.recordBtn}
          onPress={() => router.push("/record")}
          activeOpacity={0.9}
        >
          <Ionicons name="mic" size={22} color={Colors.onBrandPrimary} />
          <Text style={styles.recordBtnText}>Mulai Latihan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}<Text style={styles.statSuffix}>{suffix}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  hero: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hello: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  name: { color: "#fff", fontSize: 24, fontWeight: "700" },
  kelas: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: Spacing.lg },
  statDivider: { width: 1, height: 34, backgroundColor: "rgba(255,255,255,0.25)" },
  statLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 4 },
  statSuffix: { fontSize: 14, fontWeight: "500", color: "rgba(255,255,255,0.85)" },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, gap: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: Colors.onSurface },
  emptyCard: {
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: "center",
    gap: Spacing.sm,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface },
  emptyText: { fontSize: 13, color: Colors.onSurfaceTertiary, textAlign: "center", lineHeight: 18 },
  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    padding: Spacing.lg, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brandTertiary,
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: Colors.onSurface },
  cardMeta: { fontSize: 12, color: Colors.onSurfaceTertiary, marginTop: 2 },
  scorePill: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, minWidth: 44, alignItems: "center",
  },
  scoreText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tipCard: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.brandTertiary, padding: Spacing.lg, borderRadius: Radius.md,
  },
  tipIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  tipTitle: { fontSize: 15, fontWeight: "700", color: Colors.onBrandTertiary },
  tipSub: { fontSize: 12, color: Colors.onBrandTertiary, marginTop: 2 },
  stickyCta: { position: "absolute", left: Spacing.lg, right: Spacing.lg },
  recordBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    height: 56, backgroundColor: Colors.brandPrimary, borderRadius: Radius.lg,
    shadowColor: Colors.brandPrimary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  recordBtnText: { color: Colors.onBrandPrimary, fontSize: 16, fontWeight: "700" },
});
