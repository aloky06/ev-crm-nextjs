// src/hooks/usePermission.ts
// The ONE hook you import everywhere to check permissions
// Usage:
//   const { can, canAny, canAll, isAdmin } = usePermission();
//   if (can('view_sales')) { ... }

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';       // your existing auth store
import { usePermissionStore } from '@/store/permissionStore';

export function usePermission() {
  const { user } = useAuthStore();
  const { fetchCatalog, fetchUserPermissions, hasPermission, isLoaded, isLoading } =
    usePermissionStore();

  // Auto-fetch when user is available and permissions not yet loaded
  useEffect(() => {
    if (user?.id && !isLoaded && !isLoading) {
      // Admin fetches catalog too (needed for admin permission console)
      if (user.role === 'admin') {
        fetchCatalog();
      }
      fetchUserPermissions(user.id);
    }
  }, [user?.id, isLoaded, isLoading]);

  // Admin bypasses all permission checks — full access
  const isAdmin = user?.role === 'admin';

  return {
    isAdmin,
    isLoaded,

    /** Check a single permission. Admins always return true. */
    can: (permission: string): boolean => {
      if (isAdmin) return true;
      return hasPermission(permission);
    },

    /** True if user has ANY of the given permissions */
    canAny: (permissions: string[]): boolean => {
      if (isAdmin) return true;
      return permissions.some((p) => hasPermission(p));
    },

    /** True if user has ALL of the given permissions */
    canAll: (permissions: string[]): boolean => {
      if (isAdmin) return true;
      return permissions.every((p) => hasPermission(p));
    },

    /** For conditional rendering — shows null while permissions are loading */
    isReady: isLoaded || isAdmin,
  };
}