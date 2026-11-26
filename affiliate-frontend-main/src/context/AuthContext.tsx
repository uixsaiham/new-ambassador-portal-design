"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { emailLinkDestination } from "@/lib/email-link-destination";
import { api, getAuthToken, setAuthToken, clearAuthToken } from "@/lib/api";

// Per-document acceptance state mirrored from the backend PolicyStatus schema.
// needs_acceptance is true when the ambassador has not yet accepted the CURRENT
// version of that document (first time, or the version was bumped).
export interface PolicyDocStatus {
  required_version: string;
  accepted_version?: string | null;
  accepted_at?: string | null;
  needs_acceptance: boolean;
}

export interface PolicyStatus {
  needs_acceptance: boolean;
  rewards_terms: PolicyDocStatus;
  privacy_policy: PolicyDocStatus;
}

export interface User {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  university?: string | null;
  department_year?: string | null;
  counsellor_id?: string | null;
  counsellor_name?: string | null;
  role: "student" | "admin";
  tier: "standard" | "bronze" | "silver" | "gold" | "platinum";
  referral_code: string;
  wallet_balance: number;
  total_earned: number;
  bank_details?: {
    payout_accounts?: { id: string; payment_method: string; details: Record<string, string> }[];
    holder_name?: string;
    sort_code?: string;
    account_number?: string;
    // Billing address captured with bank details; required for bank-transfer payouts.
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      postcode?: string;
      country?: string;
    };
  } | null;
  created_at: string;
  updated_at: string;
  // Terms-acceptance gate signal from /auth/me. Absent on older API builds
  // (treated as "nothing to accept"); present once the accept-terms gate ships.
  policy?: PolicyStatus | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signInWithToken: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const userData = await api.get<User>("/auth/me");
      setUser(userData);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await api.get<User>("/auth/me");
          setUser(userData);
        } catch (err) {
          console.error("Session expired or invalid token", err);
          clearAuthToken();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Protect routes and handle routing based on authentication & roles
  useEffect(() => {
    if (loading) return;

    const token = getAuthToken();
    const isDashboard = pathname.startsWith("/dashboard");
    const isAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";

    if (!token) {
      if (isDashboard) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else if (isAdmin) {
        router.push("/admin/login");
      }
    } else if (user) {
      // Prevent students from entering admin portal, and vice versa
      if (user.role === "student" && isAdmin) {
        router.push("/dashboard");
      } else if (user.role === "admin" && isDashboard) {
        router.push("/admin");
      }
      // Signup remains available when the user explicitly starts a new registration.
      if (pathname === "/login") {
        router.push(user.role === "admin" ? "/admin" : emailLinkDestination(window.location.search));
      } else if (pathname === "/admin/login") {
        router.push("/admin");
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string; token_type: string }>("/auth/login", {
        email,
        password,
      });
      setAuthToken(data.access_token);

      const userData = await api.get<User>("/auth/me");
      if (userData.role === "admin" && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
        clearAuthToken("bhe_token");
        setAuthToken(data.access_token, "bhe_admin_token");
      }
      setUser(userData);
      setLoading(false);

      if (userData.role === "admin") {
        router.push("/admin");
      } else {
        router.push(emailLinkDestination(window.location.search));
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const data = await api.post<{ access_token: string; token_type: string }>("/auth/google", {
        credential,
      });
      setAuthToken(data.access_token);

      const userData = await api.get<User>("/auth/me");
      if (userData.role === "admin" && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
        clearAuthToken("bhe_token");
        setAuthToken(data.access_token, "bhe_admin_token");
      }
      setUser(userData);
      setLoading(false);

      if (userData.role === "admin") {
        router.push("/admin");
      } else {
        router.push(emailLinkDestination(window.location.search));
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signInWithToken = async (token: string) => {
    setLoading(true);
    try {
      setAuthToken(token);
      const userData = await api.get<User>("/auth/me");
      if (userData.role === "admin" && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
        clearAuthToken("bhe_token");
        setAuthToken(token, "bhe_admin_token");
      }
      setUser(userData);
      router.push(userData.role === "admin" ? "/admin" : emailLinkDestination(window.location.search));
    } catch (error) {
      clearAuthToken();
      throw error;
    } finally { setLoading(false); }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    if (pathname.startsWith("/admin")) {
      router.push("/admin/login");
    } else {
      router.push("/login");
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, signInWithToken, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
