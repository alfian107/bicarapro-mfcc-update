import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "@/src/theme/colors";

type Input = { label: string; value: string; detail?: string };
type Block = { title: string; formula: string; inputs: Input[]; substitution: string; score: number };

export function ScoreBreakdown({ data }: { data: { intonation: Block; clarity: Block } }) {
  return (
    <View style={styles.wrap} testID="score-breakdown-section">
      <FormulaBlock block={data.intonation} icon="musical-notes" testID="score-breakdown-intonation" />
      <FormulaBlock block={data.clarity} icon="volume-high" testID="score-breakdown-clarity" />
    </View>
  );
}

function FormulaBlock({ block, icon, testID }: { block: Block; icon: any; testID: string }) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.head}>
        <Ionicons name={icon} size={16} color={Colors.brandSecondary} />
        <Text style={styles.title}>{block.title}</Text>
        <View style={styles.scoreChip}>
          <Text style={styles.scoreChipText}>{block.score}</Text>
        </View>
      </View>
      <View style={styles.formulaBox}>
        <Text style={styles.formula}>{block.formula}</Text>
      </View>
      {block.inputs.map((inp) => (
        <View key={inp.label} style={styles.row}>
          <Text style={styles.rowLabel}>{inp.label}</Text>
          <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
            <Text style={styles.rowValue}>{inp.value}</Text>
            {inp.detail ? <Text style={styles.rowDetail}>{inp.detail}</Text> : null}
          </View>
        </View>
      ))}
      <Text style={styles.sub}>
        → {block.substitution} = <Text style={styles.subScore}>{block.score}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1, padding: Spacing.lg, gap: Spacing.sm,
  },
  head: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  title: { flex: 1, fontSize: 14, fontWeight: "700", color: Colors.onSurface },
  scoreChip: { backgroundColor: Colors.brandTertiary, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  scoreChipText: { fontSize: 13, fontWeight: "700", color: Colors.onBrandTertiary },
  formulaBox: {
    backgroundColor: Colors.surfaceTertiary, borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  formula: { fontSize: 13, fontWeight: "600", color: Colors.onSurfaceSecondary, fontVariant: ["tabular-nums"] },
  row: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.md },
  rowLabel: { fontSize: 12, color: Colors.onSurfaceTertiary },
  rowValue: { fontSize: 12, fontWeight: "700", color: Colors.onSurface, fontVariant: ["tabular-nums"] },
  rowDetail: { fontSize: 11, color: Colors.brandSecondary, fontVariant: ["tabular-nums"] },
  sub: { fontSize: 12, color: Colors.onSurfaceSecondary, marginTop: 2, fontVariant: ["tabular-nums"] },
  subScore: { fontWeight: "700", color: Colors.brandSecondary },
});
