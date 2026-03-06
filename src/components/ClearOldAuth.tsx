'use client';

import { useEffect } from 'react';

export function ClearOldAuth() {
  useEffect(() => {
    // Clear old test tokens on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Check if it's an old test token or malformed token
      if (token === 'test-token-bypass' || !token.includes('.')) {
        console.log('[Cleanup] Removing old/invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('test-user');
        localStorage.removeItem('mock-resumes');
      }
    }
  }, []);

  return null;
}
