'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import '../../../lib/amplify-config';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Signing out...');

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Sign out from Cognito
        await signOut({ global: true });
        
        // Clear local storage
        localStorage.clear();
        
        setStatus('Logged out successfully! Redirecting...');
        
        // Redirect to home
        setTimeout(() => {
          router.replace('/');
        }, 1000);
      } catch (error: any) {
        console.error('Logout error:', error);
        // Even if sign out fails, clear local storage and redirect
        localStorage.clear();
        setStatus('Session cleared! Redirecting...');
        setTimeout(() => {
          router.replace('/');
        }, 1000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">{status}</p>
      </div>
    </div>
  );
}
