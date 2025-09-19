// src/contexts/AuthContext.tsx
import { createContext, useEffect, useState } from "react";
import { watchAuth } from "../firebase";
import type { User } from "firebase/auth";

export type AuthState = { user: User | null; loading: boolean };
export const AuthCtx = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const unsub = watchAuth((user) => setState({ user, loading: false }));
    return () => unsub();
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}
