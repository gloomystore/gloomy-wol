"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  userUuid: string;
  userId: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<void>;
  register: (
    userId: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          return true;
        }
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const success = await fetchUser();
      if (!success) {
        await refreshAuth();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [fetchUser, refreshAuth]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshAuth();
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, refreshAuth]);

  const login = async (userId: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "로그인에 실패했습니다");
    }
    setUser(data.data.user);
    router.push("/");
  };

  const register = async (
    userId: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email, password, confirmPassword }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "회원가입에 실패했습니다");
    }
    setUser(data.data.user);
    router.push("/");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 에러가 나도 로컬 상태는 클리어
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}
