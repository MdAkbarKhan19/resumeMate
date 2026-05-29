'use client';

// Import for side-effect: Amplify.configure() must run on the client before
// any aws-amplify/auth call. AuthProvider wraps the whole app in layout.tsx,
// so this guarantees every client page has Amplify ready — without each
// auth-using page having to remember to import the config itself.
import '@/lib/amplify-config';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  planType: 'FREE' | 'TIER1' | 'TIER2';
  resumeCredits: number;
  subscriptionActive: boolean;
  subscriptionExpiry: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prefer the local-JWT stored in localStorage (7-day TTL from /api/auth/login).
      // Only fall through to Cognito if no local token exists, so we never clobber a
      // long-lived local JWT with a 1h Cognito idToken (the main cause of frequent logouts).
      let token: string | null = localStorage.getItem('token');

      if (!token) {
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const session = await fetchAuthSession({ forceRefresh: false });
          if (session.tokens?.idToken) {
            token = session.tokens.idToken.toString();
            localStorage.setItem('token', token);
          }
        } catch {
          // Cognito not configured or no session - that's fine
        }
      }

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Genuine session failure — clear and bail.
      if (response.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Other transient errors (5xx, network) — keep existing session so the user
      // isn't bounced out on a flaky request.
      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      // Network/parse errors: don't drop the session, just stop loading.
      console.error('[Auth] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try Cognito sign out
      try {
        const { signOut } = await import('aws-amplify/auth');
        await signOut();
      } catch {
        // Cognito not available - that's fine
      }
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    } catch (err: any) {
      console.error('[Auth] Logout error:', err);
      // Force logout even on error
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        refreshUser: fetchUser,
        refresh: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
