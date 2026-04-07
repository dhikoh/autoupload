'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI, setToken, removeToken, setRole, removeRole } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      const isPublicPage = pathname === '/' || isAuthPage || pathname === '/verify-email';
      const isDashboard = pathname.startsWith('/dashboard');
      const isAdmin = pathname.startsWith('/admin');

      if (!user && (isDashboard || isAdmin)) {
        router.replace('/login');
      }
      if (user && isAuthPage) {
        if (user.role === 'superadmin' || user.role === 'staff') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
      // Block tenants from admin
      if (user && isAdmin && user.role === 'tenant') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  async function checkAuth() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('autopost_token') : null;
      if (!token) { setLoading(false); return; }
      const userData = await authAPI.me();
      setUser(userData);
    } catch {
      removeToken();
      removeRole();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.access_token);
    setRole(data.role);
    const userData = await authAPI.me();
    setUser(userData);
    if (data.role === 'superadmin' || data.role === 'staff') {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
    return userData;
  }, [router]);

  const register = useCallback(async (email, name, password) => {
    const data = await authAPI.register(email, name, password);

    // If server requires email verification, don't auto-login
    // Return the raw data so the register page can show the "check email" state
    if (data.email_verification_required) {
      return data;
    }

    // Normal flow — set token, fetch user, redirect
    setToken(data.access_token);
    setRole(data.role);
    const userData = await authAPI.me();
    setUser(userData);
    router.replace('/dashboard');
    return data; // return raw data (not userData) so register page can check flag
  }, [router]);

  const logout = useCallback(() => {
    removeToken();
    removeRole();
    setUser(null);
    router.replace('/login');
  }, [router]);

  const isAdmin = user?.role === 'superadmin';
  const isStaff = user?.role === 'staff';
  const isAdminOrStaff = isAdmin || isStaff;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, isAdmin, isStaff, isAdminOrStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
