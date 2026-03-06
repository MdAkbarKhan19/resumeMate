'use client';

// Re-export from AuthContext so all components use the same auth state
export { useAuth } from '@/contexts/AuthContext';
export type { User } from '@/contexts/AuthContext';
