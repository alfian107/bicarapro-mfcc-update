import { storage } from "@/src/utils/storage";

export const TOKEN_KEY = "bicarapro_auth_token";
export const USER_KEY = "bicarapro_user";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function getAudioSignedUrl(pathOrUrl: string): Promise<string> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${BASE}${pathOrUrl}`;
  return token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;
}

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: "siswa" | "guru";
  kelas?: string | null;
};

async function authHeader(): Promise<Record<string, string>> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export const api = {
  async register(payload: {
    email: string;
    password: string;
    name: string;
    role: "siswa" | "guru";
    kelas?: string | null;
  }) {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handle(res);
  },

  async me() {
    const res = await fetch(`${BASE}/api/auth/me`, { headers: await authHeader() });
    return handle(res);
  },

  async history() {
    const res = await fetch(`${BASE}/api/analyses/history`, { headers: await authHeader() });
    return handle(res);
  },

  async getAnalysis(id: string) {
    const res = await fetch(`${BASE}/api/analyses/${id}`, { headers: await authHeader() });
    return handle(res);
  },

  async uploadAnalysis(uri: string, title: string, mimeType = "audio/wav", filename = "recording.wav") {
    const form = new FormData();
    // Platform-safe FormData:
    // - Web: FormData needs a real Blob/File (RN's { uri, name, type } serializes as "[object Object]")
    // - Native (iOS/Android): FormData accepts { uri, name, type }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native");
    if (Platform.OS === "web") {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const file =
        typeof File !== "undefined"
          ? new File([blob], filename, { type: blob.type || mimeType })
          : blob;
      form.append("file", file as any, filename);
    } else {
      // @ts-expect-error React Native FormData shape
      form.append("file", { uri, name: filename, type: mimeType });
    }
    const headers = await authHeader();
    const res = await fetch(
      `${BASE}/api/analyses?title=${encodeURIComponent(title)}`,
      { method: "POST", headers, body: form as any },
    );
    return handle(res);
  },

  async materials() {
    const res = await fetch(`${BASE}/api/materials`, { headers: await authHeader() });
    return handle(res);
  },

  async teacherStats() {
    const res = await fetch(`${BASE}/api/teacher/stats`, { headers: await authHeader() });
    return handle(res);
  },

  async teacherStudents() {
    const res = await fetch(`${BASE}/api/teacher/students`, { headers: await authHeader() });
    return handle(res);
  },

  async teacherStudentAnalyses(studentId: string) {
    const res = await fetch(`${BASE}/api/teacher/students/${studentId}/analyses`, {
      headers: await authHeader(),
    });
    return handle(res);
  },
};
