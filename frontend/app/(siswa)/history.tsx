import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type HistoryItem = {
  id: string; title: string; intonation_score: number; clarity_score: number;
  overall_score: number; duration_seconds: number; created_at: string;
};

export default function History() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.history();
      setHistory(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Latihan</Text>
        <Text style={styles.subtitle}>{history.length} rekaman total</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brandPrimary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={styles.empty} testID="history-empty">
              <Ionicons name="folder-open-outline" size={44} color={Colors.onSurfaceTertiary} />
              <Text style={styles.emptyText}>Belum ada rekaman</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`history-item-${item.id}`}
              style={styles.card}
              onPress={() => router.push(`/result/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="mic" size={20} color={Colors.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {new Date(item.created_at).toLocaleString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
                <View style={styles.miniStats}>
                  <MiniStat label="Intonasi" value={Math.round(item.intonation_score)} />
                  <MiniStat label="Kejelasan" value={Math.round(item.clarity_score)} />
                </View>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{Math.round(item.overall_score)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: "700", color: Colors.onSurface },
  subtitle: { fontSize: 13, color: Colors.onSurfaceTertiary, marginTop: 4 },
  empty: { alignItems: "center", marginTop: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { color: Colors.onSurfaceTertiary },
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
  cardMeta: { fontSize: 11, color: Colors.onSurfaceTertiary, marginTop: 2 },
  miniStats: { flexDirection: "row", gap: Spacing.md, marginTop: 6 },
  miniStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  miniLabel: { fontSize: 11, color: Colors.onSurfaceTertiary },
  miniValue: { fontSize: 11, fontWeight: "700", color: Colors.brandSecondary },
  scorePill: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, minWidth: 44, alignItems: "center",
  },
  scoreText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
