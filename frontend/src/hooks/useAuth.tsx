import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, getToken, setToken, clearToken, type AuthUser } from "@/lib/api";

interface AuthCtx {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
  setAuth: (token: string, user: AuthUser) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, isAdmin: false, loading: true,
  signOut: () => {}, setAuth: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const setAuth = (token: string, u: AuthUser) => {
    setToken(token);
    setUser(u);
  };

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isAdmin: user?.role === "admin", loading, signOut, setAuth }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
