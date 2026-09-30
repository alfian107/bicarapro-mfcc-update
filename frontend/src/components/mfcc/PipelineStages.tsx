import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";

export type Stage = {
  key: string;
  name: string;
  desc: string;
  params: Record<string, string | number>;
  stats?: { min: number; max: number; mean: number } | null;
  sample?: number[] | null;
};

export function PipelineStages({ pipeline }: {
  pipeline: { sample_rate: number; duration_seconds: number; stages: Stage[] };
}) {
  const [open, setOpen] = useState<string | null>("pre_emphasis");
  return (
    <View style={styles.wrap} testID="mfcc-pipeline-section">
      <Text style={styles.meta}>
        Sample rate {pipeline.sample_rate} Hz • Durasi {pipeline.duration_seconds}s • Ketuk tahap untuk melihat detail
      </Text>
      {pipeline.stages.map((st) => {
        const isOpen = open === st.key;
        return (
          <View key={st.key} style={styles.card}>
            <TouchableOpacity
              testID={`mfcc-stage-${st.key}`}
              style={styles.header}
              onPress={() => setOpen(isOpen ? null : st.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.name}>{st.name}</Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.onSurfaceTertiary}
              />
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.body}>
                <Text style={styles.desc}>{st.desc}</Text>
                {Object.entries(st.params).map(([k, v]) => (
                  <View key={k} style={styles.row}>
                    <Text style={styles.rowLabel}>{k}</Text>
                    <Text style={styles.rowValue}>{String(v)}</Text>
                  </View>
                ))}
                {st.stats && (
                  <Text style={styles.stats}>
                    min {st.stats.min} • max {st.stats.max} • mean {st.stats.mean}
                  </Text>
                )}
                {st.sample && st.sample.length > 0 && (
                  <View style={styles.sampleBox}>
                    <Text style={styles.sampleLabel}>Contoh nilai nyata dari rekaman ini:</Text>
                    <Text style={styles.sampleText}>[{st.sample.join(", ")}]</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  meta: { fontSize: 12, color: Colors.onSurfaceTertiary, marginBottom: 2 },
  card: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1, overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  name: { fontSize: 14, fontWeight: "700", color: Colors.onSurface },
  body: {
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: 6,
    borderTopColor: Colors.divider, borderTopWidth: 1, paddingTop: Spacing.md,
  },
  desc: { fontSize: 12, color: Colors.onSurfaceTertiary, lineHeight: 18, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.md },
  rowLabel: { fontSize: 12, color: Colors.onSurfaceTertiary },
  rowValue: { fontSize: 12, fontWeight: "700", color: Colors.onSurface, fontVariant: ["tabular-nums"] },
  stats: { fontSize: 11, color: Colors.brandSecondary, marginTop: 4, fontVariant: ["tabular-nums"] },
  sampleBox: {
    backgroundColor: Colors.surfaceTertiary, borderRadius: Radius.sm,
    padding: Spacing.md, marginTop: 4, gap: 4,
  },
  sampleLabel: { fontSize: 11, fontWeight: "600", color: Colors.onSurfaceTertiary },
  sampleText: { fontSize: 11, color: Colors.onSurfaceSecondary, fontVariant: ["tabular-nums"], lineHeight: 17 },
});
