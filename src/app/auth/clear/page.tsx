'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';

export default function ClearAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing authentication...');

  useEffect(() => {
    const clearAuth = async () => {
      try {
        // Sign out from Cognito
        await signOut();
        
        // Clear all localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        setStatus('Authentication cleared! Redirecting...');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } catch (error) {
        console.error('Error clearing auth:', error);
        // Even if sign out fails, clear storage
        localStorage.clear();
        sessionStorage.clear();
        setStatus('Storage cleared! Redirecting...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      }
    };

    clearAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Clearing Authentication
          </h1>
          <p className="text-gray-600 mb-4">{status}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <p className="text-blue-800 font-medium mb-2">What's being cleared:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Cognito session</li>
              <li>Local storage (old test tokens)</li>
              <li>Session storage</li>
              <li>Authentication state</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
