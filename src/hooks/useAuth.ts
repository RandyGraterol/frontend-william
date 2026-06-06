import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthUser } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { AuthUser };
