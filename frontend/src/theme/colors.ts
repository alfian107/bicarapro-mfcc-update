// Design tokens from /app/design_guidelines.json (light theme)
export const Colors = {
  surface: "#F8FAFC",
  onSurface: "#0F172A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1E293B",
  surfaceTertiary: "#F1F5F9",
  onSurfaceTertiary: "#475569",
  surfaceInverse: "#0F172A",
  onSurfaceInverse: "#FFFFFF",

  brand: "#0D9488",
  brandPrimary: "#0D9488",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#0F766E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#CCFBF1",
  onBrandTertiary: "#115E59",

  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",

  // Utility
  overlay: "rgba(15,23,42,0.55)",
  scrimTop: "rgba(15,23,42,0)",
  scrimBottom: "rgba(15,23,42,0.85)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const Fonts = {
  display: "System",
  text: "System",
};

export const FontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
