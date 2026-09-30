import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Material = {
  id: string; title: string; category: string; content: string; icon: string;
};

export default function Materials() {
  const [items, setItems] = useState<Material[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setItems(await api.materials()); } catch {}
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Materi & Tips</Text>
        <Text style={styles.subtitle}>Panduan menguasai public speaking</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brandPrimary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120, gap: Spacing.sm }}
          renderItem={({ item }) => {
            const open = expanded === item.id;
            return (
              <TouchableOpacity
                testID={`material-item-${item.id}`}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => setExpanded(open ? null : item.id)}
              >
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon as any} size={22} color={Colors.onBrandTertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cat}>{item.category}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.onSurfaceTertiary}
                  />
                </View>
                {open && <Text style={styles.body}>{item.content}</Text>}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: "700", color: Colors.onSurface },
  subtitle: { fontSize: 13, color: Colors.onSurfaceTertiary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    padding: Spacing.lg, borderColor: Colors.border, borderWidth: 1,
    gap: Spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brandTertiary,
    alignItems: "center", justifyContent: "center",
  },
  cat: { fontSize: 11, color: Colors.brandSecondary, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.onSurface, marginTop: 2 },
  body: { fontSize: 14, color: Colors.onSurfaceSecondary, lineHeight: 20 },
});
