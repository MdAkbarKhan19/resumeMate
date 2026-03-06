'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';

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

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = () => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Clear old test tokens
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token === 'test-token-bypass') {
      localStorage.removeItem('token');
      localStorage.removeItem('test-user');
    }
  }, []);

  // Fetch current user from Cognito
  const fetchUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Check if user is authenticated with Cognito
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      // Get Cognito user
      const cognitoUser = await getCurrentUser();
      
      // Get ID token for API calls
      const idToken = session.tokens.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No ID token available');
      }

      // Store token for API calls
      localStorage.setItem('token', idToken);

      // Fetch user data from our API
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      console.error('Auth error:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: error.message,
      });
    }
  }, []);

  // Refresh auth state on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    // This is handled by the Cognito auth pages now
    // Just refresh user state after successful sign in
    await fetchUser();
  }, [fetchUser]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    // This is handled by the Cognito auth pages now
    // Just refresh user state after successful sign up
    await fetchUser();
  }, [fetchUser]);

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      router.push('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, [router]);

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  // Refresh auth state
  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    signIn,
    signUp,
    logout,
    updateUser,
    refresh,
  };
};
