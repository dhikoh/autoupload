'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI, setToken, removeToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Route protection
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isDashboard = pathname.startsWith('/dashboard');

      if (!user && isDashboard) {
        router.replace('/login');
      }
      if (user && isAuthPage) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  async function checkAuth() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('autopost_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const userData = await authAPI.me();
      setUser(userData);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    const userData = await authAPI.me();
    setUser(userData);
    router.replace('/dashboard');
    return userData;
  }, [router]);

  const register = useCallback(async (email, name, password) => {
    const data = await authAPI.register(email, name, password);
    setToken(data.access_token);
    const userData = await authAPI.me();
    setUser(userData);
    router.replace('/dashboard');
    return userData;
  }, [router]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
