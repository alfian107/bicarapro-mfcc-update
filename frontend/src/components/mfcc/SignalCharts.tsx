import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Polygon, Polyline, Line } from "react-native-svg";
import { Colors, Spacing, Radius } from "@/src/theme/colors";

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function WaveformChart({ data }: {
  data: { min: number[]; max: number[]; samples: number; sr: number };
}) {
  const width = Math.max(240, Math.min(useWindowDimensions().width - 64, 640));
  const height = 120;
  const n = data.min.length;
  const toY = (v: number) => height / 2 - clamp(v) * (height / 2 - 6);
  const top = data.max.map((v, i) => [(i / (n - 1)) * width, toY(v)]);
  const bottom = data.min.map((v, i) => [(i / (n - 1)) * width, toY(v)]).reverse();
  const points = top.concat(bottom).map((p) => p.join(",")).join(" ");
  return (
    <View style={styles.card} testID="viz-waveform">
      <Text style={styles.caption}>Waveform — Gelombang Suara (domain waktu)</Text>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={Colors.borderStrong} strokeWidth={1} />
        <Polygon points={points} fill={Colors.brandPrimary} opacity={0.85} />
      </Svg>
      <Text style={styles.axis}>
        0 s → {(data.samples / data.sr).toFixed(1)} s • {data.samples.toLocaleString("id-ID")} sampel @ {data.sr} Hz
      </Text>
    </View>
  );
}

export function SpectrumChart({ data }: {
  data: { db: number[]; fmin: number; fmax: number };
}) {
  const width = Math.max(240, Math.min(useWindowDimensions().width - 64, 640));
  const height = 120;
  const n = data.db.length;
  const lo = Math.min(...data.db);
  const hi = Math.max(...data.db);
  const norm = (v: number) => (v - lo) / Math.max(1e-6, hi - lo);
  const points = data.db
    .map((v, i) => `${((i / (n - 1)) * width).toFixed(1)},${(height - 8 - norm(v) * (height - 20)).toFixed(1)}`)
    .join(" ");
  return (
    <View style={styles.card} testID="viz-spectrum">
      <Text style={styles.caption}>Spektrum Rata-rata — Domain Frekuensi (hasil FFT)</Text>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height - 6} x2={width} y2={height - 6} stroke={Colors.borderStrong} strokeWidth={1} />
        <Polyline points={points} fill="none" stroke={Colors.brandSecondary} strokeWidth={2} />
      </Svg>
      <Text style={styles.axis}>
        {data.fmin} Hz → {(data.fmax / 1000).toFixed(1)} kHz • sumbu vertikal: daya (dB)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1, padding: Spacing.lg, gap: Spacing.sm,
  },
  caption: { fontSize: 13, fontWeight: "700", color: Colors.onSurface },
  axis: { fontSize: 11, color: Colors.onSurfaceTertiary },
});
