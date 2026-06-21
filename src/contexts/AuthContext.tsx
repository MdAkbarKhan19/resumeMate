'use client';

// Import for side-effect: Amplify.configure() must run on the client before
// any aws-amplify/auth call. AuthProvider wraps the whole app in layout.tsx,
// so this guarantees every client page has Amplify ready — without each
// auth-using page having to remember to import the config itself.
import '@/lib/amplify-config';

// Side-effect: install the global Response.json() guard before any component
// mounts or fires a fetch, so a non-JSON (HTML 502/504, empty, truncated)
// response can never surface the raw "Unexpected token '<'" error anywhere.
import '@/lib/json-guard';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

// Wipe every piece of per-user client state. Critical for account isolation:
// without this, signing in as a different account on the same browser can
// inherit the previous user's token, cached resume list, or in-progress draft.
function clearAppStorage() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('mock-resumes');
    localStorage.removeItem('test-user');
    // Drafts are keyed per-user (resume-draft:<userId>); also clears the legacy
    // global 'resume-draft' key. Iterate backwards since we mutate while looping.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('resume-draft')) localStorage.removeItem(key);
    }
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Always source a FRESH token from Amplify first. Amplify silently
      // refreshes a near/just-expired Cognito idToken using the stored refresh
      // token, so the session survives well past the ~1h idToken lifetime
      // instead of bouncing the user to login. We cache the token in
      // localStorage only as a convenience. If there's no Amplify session
      // (e.g. a local-JWT login), we fall back to the stored token.
      let token: string | null = null;
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession({ forceRefresh: false });
        if (session.tokens?.idToken) {
          token = session.tokens.idToken.toString();
          localStorage.setItem('token', token);
        }
      } catch {
        // Cognito not configured or no session — fall back to a stored token.
      }
      if (!token) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      let response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // On 401, attempt ONE forced Cognito refresh and retry before logging out.
      // This turns a transient idToken expiry into a silent refresh.
      if (response.status === 401) {
        try {
          const { fetchAuthSession } = await import('aws-amplify/auth');
          const refreshed = await fetchAuthSession({ forceRefresh: true });
          const newToken = refreshed.tokens?.idToken?.toString();
          if (newToken && newToken !== token) {
            localStorage.setItem('token', newToken);
            response = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${newToken}` },
            });
          }
        } catch {
          // No refreshable Cognito session — fall through to the logout below.
        }
      }

      // Genuine session failure after a refresh attempt — clear and bail.
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
    } catch (err: any) {
      console.error('[Auth] Logout error:', err);
    } finally {
      // Always run, even if Cognito sign-out throws. Hard-navigate (not
      // router.push) so the in-memory SWR cache — which holds the previous
      // user's resume list — is fully discarded for the next account.
      clearAppStorage();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/auth/login';
    }
  }, []);

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
