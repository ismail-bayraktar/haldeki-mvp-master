/**
 * Users Hook
 * Phase 11 - Warehouse MVP
 *
 * Kullanıcı listesini çeker
 * Tablo: profiles, user_roles
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
  created_at: string;
}

/**
 * Hook: Kullanıcıları role göre filtreleyerek getirir
 */
export function useUsers(role?: string) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async (): Promise<UserWithRoles[]> => {
      const query = supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (role) {
        // Role göre filtrele - user_roles ile join
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, profiles(id, email, full_name, created_at)')
          .eq('role', role);

        if (error) throw error;

        return (data || []).map((ur: any) => ({
          id: ur.profiles.id,
          email: ur.profiles.email,
          full_name: ur.profiles.full_name,
          roles: [ur.role],
          created_at: ur.profiles.created_at,
        }));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Her kullanıcı için rolleri al
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          return {
            ...user,
            roles: roleData?.map((r: any) => r.role) || [],
          };
        })
      );

      return usersWithRoles;
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });
}

/**
 * Hook: Warehouse manager rolündeki kullanıcıları getirir
 */
export function useWarehouseManagers() {
  return useUsers('warehouse_manager');
}

/**
 * Hook: Aktif tüm kullanıcıları getirir (admin için dropdown)
 */
export function useAllUsers() {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: async (): Promise<UserWithRoles[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('email', { ascending: true });

      if (error) throw error;

      // Her kullanıcı için rolleri al
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          return {
            ...user,
            roles: roleData?.map((r: any) => r.role) || [],
          };
        })
      );

      return usersWithRoles;
    },
    staleTime: 5 * 60 * 1000,
  });
}
