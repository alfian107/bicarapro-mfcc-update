import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type HistoryItem = {
  id: string; title: string; user_name: string;
  intonation_score: number; clarity_score: number;
  overall_score: number; duration_seconds: number; created_at: string;
};

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await api.teacherStudentAnalyses(String(id))); }
      catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  const studentName = items[0]?.user_name ?? "Siswa";
  const avg = items.length
    ? Math.round(items.reduce((s, i) => s + i.overall_score, 0) / items.length)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="student-detail-back-btn">
          <Ionicons name="chevron-back" size={26} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{studentName}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Rekaman</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Rata-rata</Text>
          <Text style={styles.summaryValue}>{avg}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brandPrimary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 60 }}>
          {items.length === 0 && (
            <Text style={{ textAlign: "center", color: Colors.onSurfaceTertiary, marginTop: Spacing.xxl }}>
              Belum ada rekaman untuk siswa ini.
            </Text>
          )}
          {items.map((h) => (
            <TouchableOpacity
              key={h.id}
              testID={`student-detail-item-${h.id}`}
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
                  {new Date(h.created_at).toLocaleString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{Math.round(h.overall_score)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.onSurface, flex: 1, textAlign: "center" },
  summary: { flexDirection: "row", gap: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, padding: Spacing.md, backgroundColor: Colors.brandTertiary,
    borderRadius: Radius.md, alignItems: "center",
  },
  summaryLabel: { fontSize: 12, color: Colors.onBrandTertiary },
  summaryValue: { fontSize: 24, fontWeight: "700", color: Colors.onBrandTertiary, marginTop: 2 },
  card: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.surfaceSecondary, padding: Spacing.lg,
    borderRadius: Radius.md, borderColor: Colors.border, borderWidth: 1,
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
});
