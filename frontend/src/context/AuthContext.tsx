import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api, ApiUser, TOKEN_KEY, USER_KEY } from "@/src/api/client";

type AuthState = {
  user: ApiUser | null;
  token: string | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signUp: (payload: {
    email: string;
    password: string;
    name: string;
    role: "siswa" | "guru";
    kelas?: string | null;
  }) => Promise<ApiUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await storage.secureGet<string>(TOKEN_KEY, "");
      const u = await storage.getItem<string>(USER_KEY, "");
      if (t && u) {
        try {
          setToken(t);
          setUser(JSON.parse(u));
        } catch {}
      }
      setReady(true);
    })();
  }, []);

  const persist = useCallback(async (t: string, u: ApiUser) => {
    await storage.secureSet(TOKEN_KEY, t);
    await storage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const signIn: AuthState["signIn"] = async (email, password) => {
    const data = await api.login(email, password);
    await persist(data.access_token, data.user);
    return data.user;
  };

  const signUp: AuthState["signUp"] = async (payload) => {
    const data = await api.register(payload);
    await persist(data.access_token, data.user);
    return data.user;
  };

  const signOut = async () => {
    await storage.secureRemove(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
