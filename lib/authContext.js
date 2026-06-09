"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { getProfile } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load(authUser) {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = await getProfile(authUser.id);
    setUser(authUser);
    setProfile(p);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      load(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role       = profile?.role || null;
  const isAdmin    = role === "ADMIN";
  const isEmployee = role === "EMPLOYEE";

  return (
    <AuthContext.Provider value={{ user, profile, loading, role, isAdmin, isEmployee, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
