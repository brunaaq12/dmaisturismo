import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "cliente";
}

interface AuthCtx {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
  setUser: (user: User | null) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null, isAdmin: false, loading: true, signOut: () => {}, setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('d_turismo_token');
    if (token) {
      api.get<User>("/auth/me")
        .then(data => {
          setUser(data);
        })
        .catch(() => {
          localStorage.removeItem('d_turismo_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('d_turismo_token');
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, signOut, setUser }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
