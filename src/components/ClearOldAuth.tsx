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
    // The legacy global 'resume-draft' key was shared across accounts on the
    // same browser and could leak one user's in-progress resume into another's
    // builder. Drafts are now keyed per-user (resume-draft:<userId>); purge the
    // unsafe legacy key once so existing contaminated drafts can't resurface.
    localStorage.removeItem('resume-draft');
  }, []);

  return null;
}
