import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, cancelAnimation,
} from "react-native-reanimated";
import { Colors, Spacing, Radius } from "@/src/theme/colors";
import { api } from "@/src/api/client";

export default function Record() {
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);

  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setPermissionGranted(!!status.granted);
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (e) {
        setPermissionGranted(false);
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const pulseStart = () => {
    scale.value = withRepeat(withTiming(1.18, { duration: 800 }), -1, true);
    ringOpacity.value = withRepeat(withTiming(0.9, { duration: 800 }), -1, true);
  };
  const pulseStop = () => {
    cancelAnimation(scale);
    cancelAnimation(ringOpacity);
    scale.value = withTiming(1);
    ringOpacity.value = withTiming(0.4);
  };

  const start = async () => {
    if (!permissionGranted) {
      setError("Izin mikrofon diperlukan");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setSeconds(0);
      pulseStart();
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      setError(e.message || "Gagal memulai rekaman");
    }
  };

  const stopAndUpload = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (timerRef.current) clearInterval(timerRef.current);
      pulseStop();
      setIsRecording(false);
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError("Rekaman tidak tersedia");
        return;
      }
      setUploading(true);

      // Determine mime & filename based on platform / actual blob
      let mime = "audio/m4a";
      let filename = "recording.m4a";
      if (Platform.OS === "web") {
        // On web, recorder.uri is a blob: URL — fetch it and read actual MIME
        try {
          const blob = await (await fetch(uri)).blob();
          const btype = blob.type || "audio/webm";
          mime = btype;
          const ext = btype.includes("webm") ? "webm"
            : btype.includes("mp4") ? "mp4"
            : btype.includes("ogg") ? "ogg"
            : btype.includes("wav") ? "wav"
            : "webm";
          filename = `recording.${ext}`;
        } catch {}
      } else {
        const raw = uri.split("/").pop() || "recording.m4a";
        const ext = raw.split(".").pop()?.toLowerCase() || "m4a";
        filename = raw;
        mime = ext === "wav" ? "audio/wav"
          : ext === "mp3" ? "audio/mpeg"
          : ext === "m4a" ? "audio/m4a"
          : "audio/mp4";
      }

      const title = `Latihan ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
      const result = await api.uploadAnalysis(uri, title, mime, filename);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/result/${result.id}`);
    } catch (e: any) {
      setError(e.message || "Gagal mengunggah rekaman");
      setUploading(false);
    }
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: ringOpacity.value,
  }));

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="record-close-btn"
          onPress={() => router.back()}
          disabled={uploading}
        >
          <Ionicons name="close" size={28} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekam Latihan</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.timer} testID="record-timer">{mmss}</Text>
        <Text style={styles.hint}>
          {uploading
            ? "Menganalisis suaramu dengan MFCC..."
            : isRecording
            ? "Rekam suara public speaking-mu"
            : "Tekan untuk mulai merekam"}
        </Text>

        <View style={styles.micWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <TouchableOpacity
            testID={isRecording ? "record-stop-btn" : "record-start-btn"}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={isRecording ? stopAndUpload : start}
            disabled={uploading || permissionGranted === false}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={56}
                color={Colors.onBrandPrimary}
              />
            )}
          </TouchableOpacity>
        </View>

        {permissionGranted === false && (
          <View style={styles.permBox}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
            <Text style={styles.permText}>
              Izin mikrofon ditolak. Aktifkan di pengaturan perangkat.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox} testID="record-error">
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tips: Bicara dengan jelas, jaga jarak 20cm dari mikrofon, hindari suara latar.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.onSurface },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  timer: { fontSize: 56, fontWeight: "300", color: Colors.onSurface, letterSpacing: 2 },
  hint: { fontSize: 14, color: Colors.onSurfaceTertiary, textAlign: "center" },
  micWrap: {
    width: 220, height: 220, alignItems: "center", justifyContent: "center", marginTop: Spacing.xl,
  },
  ring: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.brandTertiary,
  },
  micBtn: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.brandPrimary,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.brandPrimary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  micBtnActive: { backgroundColor: Colors.error, shadowColor: Colors.error },
  permBox: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: "#FEF3C7", padding: Spacing.md, borderRadius: Radius.md,
  },
  permText: { fontSize: 13, color: "#78350F", flex: 1 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF2F2", padding: Spacing.md, borderRadius: Radius.md,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  footer: { padding: Spacing.lg },
  footerText: { fontSize: 12, color: Colors.onSurfaceTertiary, textAlign: "center", lineHeight: 18 },
});
