import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Speech from "expo-speech";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { api, getAudioSignedUrl } from "@/src/api/client";

type Analysis = {
  id: string; title: string; user_name: string;
  intonation_score: number; clarity_score: number; overall_score: number;
  transcript: string; ai_feedback: string;
  corrected_transcript?: string | null;
  pronunciation_tips?: string | null;
  audio_url?: string | null;
  duration_seconds: number; pitch_mean: number; pitch_std: number;
  rms_mean: number; zcr_mean: number; spectral_centroid_mean: number;
  mfcc_mean: number[]; mfcc_std: number[]; created_at: string;
};

export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<{ uri: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.getAnalysis(String(id));
        setData(d);
        if (d.audio_url) {
          const uri = await getAudioSignedUrl(d.audio_url);
          setAudioSource({ uri });
        }
      } catch (e: any) {
        setError(e.message || "Gagal memuat hasil");
      }
    })();
    return () => {
      // Stop any ongoing TTS when leaving the screen
      Speech.stop();
    };
  }, [id]);

  if (!data && !error) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.brandPrimary} size="large" />
        <Text style={styles.loadingText}>Memuat hasil analisis...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }
  if (!data) return null;

  const scoreColor = (s: number) =>
    s >= 80 ? Colors.success : s >= 60 ? Colors.brandPrimary : s >= 40 ? Colors.warning : Colors.error;

  const grade = data.overall_score >= 85 ? "Sangat Baik"
    : data.overall_score >= 70 ? "Baik"
    : data.overall_score >= 55 ? "Cukup"
    : "Perlu Latihan";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} testID="result-back-btn">
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Hasil Analisis</Text>
            <View style={{ width: 26 }} />
          </View>

          <LinearGradient
            colors={[Colors.brandPrimary, Colors.brandSecondary]}
            style={styles.overallCard}
          >
            <Text style={styles.overallLabel}>Skor Keseluruhan</Text>
            <Text style={styles.overallScore}>{Math.round(data.overall_score)}</Text>
            <Text style={styles.overallGrade}>{grade}</Text>
            <Text style={styles.overallMeta}>
              {data.title} • {data.duration_seconds.toFixed(0)}s
            </Text>
          </LinearGradient>
        </SafeAreaView>

        <View style={styles.scoreRow}>
          <ScoreCard
            label="Intonasi"
            value={data.intonation_score}
            color={scoreColor(data.intonation_score)}
            icon="musical-notes"
            testID="result-intonation-card"
          />
          <ScoreCard
            label="Kejelasan Suara"
            value={data.clarity_score}
            color={scoreColor(data.clarity_score)}
            icon="volume-high"
            testID="result-clarity-card"
          />
        </View>

        {audioSource && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Ionicons name="play-circle-outline" size={20} color={Colors.brandSecondary} />
              <Text style={styles.sectionTitle}>Putar Rekaman</Text>
            </View>
            <AudioPlayer source={audioSource} />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="megaphone" size={20} color={Colors.brandSecondary} />
            <Text style={styles.sectionTitle}>Dengarkan Perbaikan</Text>
          </View>
          <CorrectionPlayer
            correctedTranscript={data.corrected_transcript || data.transcript || ""}
            pronunciationTips={data.pronunciation_tips || ""}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="document-text-outline" size={20} color={Colors.brandSecondary} />
            <Text style={styles.sectionTitle}>Transkrip (Subtitle)</Text>
          </View>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcript} testID="result-transcript">
              {data.transcript || "(Transkrip tidak tersedia)"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="sparkles" size={20} color={Colors.brandSecondary} />
            <Text style={styles.sectionTitle}>Feedback AI</Text>
          </View>
          <View style={styles.aiBox} testID="result-ai-feedback">
            <Text style={styles.aiText}>{data.ai_feedback}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="stats-chart-outline" size={20} color={Colors.brandSecondary} />
            <Text style={styles.sectionTitle}>Detail Fitur MFCC</Text>
          </View>
          <View style={styles.featBox}>
            <FeatureRow label="Pitch rata-rata" value={`${data.pitch_mean.toFixed(1)} Hz`} />
            <FeatureRow label="Variasi pitch (std)" value={`${data.pitch_std.toFixed(1)} Hz`} />
            <FeatureRow label="Energi (RMS)" value={data.rms_mean.toFixed(4)} />
            <FeatureRow label="Zero crossing rate" value={data.zcr_mean.toFixed(4)} />
            <FeatureRow label="Spectral centroid" value={`${data.spectral_centroid_mean.toFixed(0)} Hz`} />
          </View>

          <Text style={styles.mfccHeader}>MFCC Coefficients (mean)</Text>
          <View style={styles.mfccBars}>
            {data.mfcc_mean.map((v, i) => {
              const max = Math.max(...data.mfcc_mean.map((x) => Math.abs(x)));
              const h = Math.max(4, (Math.abs(v) / max) * 100);
              return (
                <View key={i} style={styles.mfccCol}>
                  <View style={[styles.mfccBar, {
                    height: h,
                    backgroundColor: v >= 0 ? Colors.brandPrimary : Colors.warning,
                  }]} />
                  <Text style={styles.mfccIdx}>{i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          testID="result-new-recording-btn"
          style={styles.newBtn}
          onPress={() => router.replace("/record")}
        >
          <Ionicons name="mic" size={20} color={Colors.onBrandPrimary} />
          <Text style={styles.newBtnText}>Latihan Lagi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ScoreCard({ label, value, color, icon, testID }: {
  label: string; value: number; color: string; icon: any; testID: string;
}) {
  return (
    <View style={styles.scoreCard} testID={testID}>
      <View style={[styles.scoreIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, { color }]}>{Math.round(value)}</Text>
      <View style={styles.scoreBar}>
        <View style={[styles.scoreBarFill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function AudioPlayer({ source }: { source: { uri: string } }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const isPlaying = !!status?.playing;
  const durationSec = Math.max(0, status?.duration ?? 0);
  const currentSec = Math.max(0, status?.currentTime ?? 0);
  const progress = durationSec > 0 ? Math.min(1, currentSec / durationSec) : 0;

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const toggle = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (durationSec > 0 && currentSec >= durationSec - 0.05) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  return (
    <View style={styles.playerBox} testID="result-audio-player">
      <TouchableOpacity
        testID="result-audio-play-btn"
        style={styles.playBtn}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={28}
          color={Colors.onBrandPrimary}
          style={isPlaying ? undefined : { marginLeft: 3 }}
        />
      </TouchableOpacity>
      <View style={styles.playerInfo}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timerRow}>
          <Text style={styles.timerText}>{fmt(currentSec)}</Text>
          <Text style={styles.timerText}>{fmt(durationSec)}</Text>
        </View>
      </View>
    </View>
  );
}

function CorrectionPlayer({
  correctedTranscript,
  pronunciationTips,
}: {
  correctedTranscript: string;
  pronunciationTips: string;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<0.85 | 1.0 | 1.15>(1.0);
  const [mode, setMode] = useState<"transcript" | "tips">("transcript");

  const textToSpeak =
    mode === "transcript" ? correctedTranscript : pronunciationTips;

  const stop = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const speak = () => {
    if (!textToSpeak || !textToSpeak.trim()) return;
    // Stop any previous speech first
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      language: "id-ID",
      pitch: 1.0,
      rate: speed,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggle = () => {
    if (isSpeaking) stop();
    else speak();
  };

  return (
    <View style={styles.correctionBox} testID="result-correction-box">
      {/* Mode switcher */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          testID="correction-mode-transcript"
          style={[styles.modeChip, mode === "transcript" && styles.modeChipActive]}
          onPress={() => {
            stop();
            setMode("transcript");
          }}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={14}
            color={mode === "transcript" ? Colors.onBrandPrimary : Colors.onSurfaceSecondary}
          />
          <Text
            style={[
              styles.modeChipText,
              mode === "transcript" && styles.modeChipTextActive,
            ]}
          >
            Transkrip Terkoreksi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="correction-mode-tips"
          style={[styles.modeChip, mode === "tips" && styles.modeChipActive]}
          onPress={() => {
            stop();
            setMode("tips");
          }}
        >
          <Ionicons
            name="bulb"
            size={14}
            color={mode === "tips" ? Colors.onBrandPrimary : Colors.onSurfaceSecondary}
          />
          <Text
            style={[
              styles.modeChipText,
              mode === "tips" && styles.modeChipTextActive,
            ]}
          >
            Tips Pengucapan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Text to be spoken */}
      <View style={styles.correctionTextBox}>
        <Text style={styles.correctionText} testID="correction-text">
          {textToSpeak || "(Tidak ada teks perbaikan)"}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.correctionControls}>
        <TouchableOpacity
          testID="correction-play-btn"
          style={styles.correctionPlayBtn}
          onPress={toggle}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isSpeaking ? "stop" : "volume-high"}
            size={22}
            color={Colors.onBrandPrimary}
          />
          <Text style={styles.correctionPlayText}>
            {isSpeaking ? "Berhenti" : "Dengarkan"}
          </Text>
        </TouchableOpacity>

        <View style={styles.speedRow}>
          {[0.85, 1.0, 1.15].map((s) => (
            <TouchableOpacity
              key={s}
              testID={`correction-speed-${s}`}
              style={[styles.speedChip, speed === s && styles.speedChipActive]}
              onPress={() => {
                setSpeed(s as 0.85 | 1.0 | 1.15);
                if (isSpeaking) {
                  // Restart with new speed
                  Speech.stop();
                  setTimeout(() => {
                    setIsSpeaking(true);
                    Speech.speak(textToSpeak, {
                      language: "id-ID",
                      pitch: 1.0,
                      rate: s,
                      onDone: () => setIsSpeaking(false),
                      onStopped: () => setIsSpeaking(false),
                      onError: () => setIsSpeaking(false),
                    });
                  }, 120);
                }
              }}
            >
              <Text
                style={[
                  styles.speedChipText,
                  speed === s && styles.speedChipTextActive,
                ]}
              >
                {s === 1.0 ? "Normal" : s < 1 ? "Pelan" : "Cepat"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.correctionHint}>
        Dengarkan versi perbaikan dan tirukan intonasi serta jedanya untuk memperbaiki cara bicaramu.
      </Text>
    </View>
  );
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.featRow}>
      <Text style={styles.featLabel}>{label}</Text>
      <Text style={styles.featValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface, gap: Spacing.md },
  loadingText: { color: Colors.onSurfaceTertiary },
  errorText: { color: Colors.error, marginTop: Spacing.sm },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.brandPrimary,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  overallCard: {
    marginHorizontal: Spacing.lg, marginTop: 0,
    padding: Spacing.xl, borderRadius: Radius.lg,
    alignItems: "center",
  },
  overallLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  overallScore: { color: "#fff", fontSize: 72, fontWeight: "700", lineHeight: 80, marginTop: 4 },
  overallGrade: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 4 },
  overallMeta: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: Spacing.sm },
  scoreRow: { flexDirection: "row", gap: Spacing.md, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  scoreCard: {
    flex: 1, backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    padding: Spacing.lg, borderColor: Colors.border, borderWidth: 1, gap: 6,
  },
  scoreIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scoreLabel: { fontSize: 13, color: Colors.onSurfaceTertiary, marginTop: 4 },
  scoreValue: { fontSize: 32, fontWeight: "700" },
  scoreBar: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceTertiary, overflow: "hidden", marginTop: 4 },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  playerBox: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    padding: Spacing.lg, borderColor: Colors.border, borderWidth: 1,
  },
  playBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  playerInfo: { flex: 1, gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.brandPrimary, borderRadius: 3 },
  timerRow: { flexDirection: "row", justifyContent: "space-between" },
  timerText: { fontSize: 11, color: Colors.onSurfaceTertiary, fontVariant: ["tabular-nums"] },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, gap: Spacing.md },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.onSurface },
  transcriptBox: {
    backgroundColor: Colors.surfaceSecondary, padding: Spacing.lg, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1,
  },
  transcript: { fontSize: 14, lineHeight: 22, color: Colors.onSurfaceSecondary, fontStyle: "italic" },
  aiBox: {
    backgroundColor: Colors.brandTertiary, padding: Spacing.lg, borderRadius: Radius.md,
  },
  aiText: { fontSize: 14, lineHeight: 22, color: Colors.onBrandTertiary },
  featBox: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderColor: Colors.border, borderWidth: 1, overflow: "hidden",
  },
  featRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomColor: Colors.divider, borderBottomWidth: 1,
  },
  featLabel: { color: Colors.onSurfaceTertiary, fontSize: 13 },
  featValue: { color: Colors.onSurface, fontSize: 13, fontWeight: "700" },
  mfccHeader: { fontSize: 13, fontWeight: "600", color: Colors.onSurfaceSecondary, marginTop: Spacing.md },
  mfccBars: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    height: 130, padding: Spacing.md, backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md, borderColor: Colors.border, borderWidth: 1,
  },
  mfccCol: { flex: 1, alignItems: "center", gap: 4 },
  mfccBar: { width: "70%", borderRadius: 2 },
  mfccIdx: { fontSize: 9, color: Colors.onSurfaceTertiary },
  newBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.xxl,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    height: 54, backgroundColor: Colors.brandPrimary, borderRadius: Radius.md,
  },
  newBtnText: { color: Colors.onBrandPrimary, fontSize: 15, fontWeight: "700" },

  // Correction Player
  correctionBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modeRow: { flexDirection: "row", gap: Spacing.sm },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modeChipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.onSurfaceSecondary,
  },
  modeChipTextActive: { color: Colors.onBrandPrimary },
  correctionTextBox: {
    backgroundColor: Colors.brandTertiary,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    minHeight: 60,
  },
  correctionText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.onBrandTertiary,
    fontWeight: "500",
  },
  correctionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  correctionPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    minHeight: 44,
  },
  correctionPlayText: {
    color: Colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  speedRow: { flexDirection: "row", gap: 6, flex: 1, justifyContent: "flex-end" },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 52,
    alignItems: "center",
  },
  speedChipActive: {
    backgroundColor: Colors.brandSecondary,
    borderColor: Colors.brandSecondary,
  },
  speedChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.onSurfaceSecondary,
  },
  speedChipTextActive: { color: "#fff" },
  correctionHint: {
    fontSize: 12,
    color: Colors.onSurfaceTertiary,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
