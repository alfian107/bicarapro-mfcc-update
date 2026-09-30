import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Colors, Spacing, Radius } from "@/src/theme/colors";

function heatColor(t: number): string {
  const a = [240, 253, 250]; // pale teal (nilai rendah)
  const b = [17, 94, 89]; // dark teal (nilai tinggi)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function MfccHeatmap({ data }: {
  data: { rows: number; cols: number; values: number[][]; frame_ms: number; total_frames: number };
}) {
  const avail = Math.max(220, Math.min(useWindowDimensions().width - 96, 600));
  const cw = avail / data.cols;
  const ch = 15;
  const flat = data.values.flat();
  const lo = Math.min(...flat);
  const hi = Math.max(...flat);
  const range = Math.max(1e-6, hi - lo);
  return (
    <View style={styles.card} testID="mfcc-heatmap">
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 26 }}>
          {data.values.map((_, r) => (
            <Text key={r} style={[styles.rowLabel, { height: ch, lineHeight: ch }]}>C{r + 1}</Text>
          ))}
        </View>
        <Svg width={avail} height={data.rows * ch}>
          {data.values.map((row, r) =>
            row.map((v, c) => (
              <Rect
                key={`${r}-${c}`}
                x={c * cw}
                y={r * ch}
                width={cw + 0.6}
                height={ch + 0.6}
                fill={heatColor((v - lo) / range)}
              />
            ))
          )}
        </Svg>
      </View>
      <Text style={styles.axis}>
        Sumbu X: frame → ({data.total_frames} frame @ {data.frame_ms} ms) • nilai {lo.toFixed(0)} (terang) s.d {hi.toFixed(0)} (gelap)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1, padding: Spacing.lg, gap: Spacing.sm,
  },
  rowLabel: { fontSize: 9, color: Colors.onSurfaceTertiary, textAlign: "right", paddingRight: 4 },
  axis: { fontSize: 11, color: Colors.onSurfaceTertiary },
});
