/**
 * useIsAdmin Hook
 * Phase 11 - Warehouse MVP
 *
 * Basit admin yetki kontrolü
 */

import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { isAdmin, isLoading } = useAuth();

  return {
    isAdmin,
    isLoading,
  };
}
