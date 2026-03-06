'use client';

import { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import Link from 'next/link';
import { toast } from '@/components/ui/Alert';
import '../../../lib/amplify-config';

export default function AuthDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Check localStorage first
      const storedToken = localStorage.getItem('token');
      console.log('Stored token:', storedToken?.substring(0, 50));

      // Check session
      const session = await fetchAuthSession({ forceRefresh: true });
      setSessionInfo({
        hasTokens: !!session.tokens,
        hasIdToken: !!session.tokens?.idToken,
        hasAccessToken: !!session.tokens?.accessToken,
        idTokenPreview: session.tokens?.idToken?.toString().substring(0, 50) + '...',
        storedTokenPreview: storedToken?.substring(0, 50) + '...',
        tokensMatch: storedToken === session.tokens?.idToken?.toString(),
      });

      // Check current user
      try {
        const user = await getCurrentUser();
        setUserInfo({
          userId: user.userId,
          username: user.username,
        });
      } catch (userErr: any) {
        setUserInfo({ error: userErr.message });
      }

      // Try API call
      if (session.tokens?.idToken) {
        const token = session.tokens.idToken.toString();
        localStorage.setItem('token', token);
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setApiResponse({ success: true, data });
          } else {
            setApiResponse({ 
              success: false, 
              status: response.status,
              statusText: response.statusText,
              body: await response.text()
            });
          }
        } catch (apiErr: any) {
          setApiResponse({ success: false, error: apiErr.message });
        }
      }
    } catch (err: any) {
      setSessionInfo({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      await signOut({ global: true });
      localStorage.clear();
      toast.success('Session cleared! Please refresh the page.');
    } catch (err) {
      localStorage.clear();
      toast.success('Local storage cleared! Please refresh the page.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cognito Session</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>

          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>

          {/* API Response */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Response (/api/auth/me)</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button
                onClick={checkAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh Check
              </button>
              <button
                onClick={handleClearSession}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Session
              </button>
              <Link
                href="/auth/login"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Go to Login
              </Link>
              <Link
                href="/dashboard"
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
