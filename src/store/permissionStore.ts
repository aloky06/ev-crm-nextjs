// src/store/permissionStore.ts
// Zustand store — fetches & caches role/user permissions from Laravel API

import { create } from 'zustand';
import api from '@/lib/axios';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
  description: string | null;
  is_assigned?: boolean;
}

interface UserOverride {
  id: number;
  permission_id: number;
  type: 'grant' | 'revoke';
  reason: string | null;
}

interface PermissionState {
  // All permissions in the system (for admin catalog page)
  catalog: Permission[];

  // Effective permission NAMES for the logged-in non-admin user
  rolePermissions: string[];

  // Raw overrides for current user (per-user exceptions)
  userOverrides: UserOverride[];

  isLoaded: boolean;
  isLoading: boolean;

  // Actions
  fetchCatalog: () => Promise<void>;
  fetchRolePermissions: (role: string) => Promise<void>;
  fetchUserPermissions: (userId: number) => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
  reset: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  catalog: [],
  rolePermissions: [],
  userOverrides: [],
  isLoaded: false,
  isLoading: false,

  // GET /api/admin/permissions — full catalog (admin only, for permission management page)
  fetchCatalog: async () => {
    try {
      const { data } = await api.get('/admin/permissions');
      const raw = data.permissions || data.data || data;
      const perms: Permission[] = Array.isArray(raw)
        ? raw
        : (Object.values(raw) as Permission[][]).flat();
      set({ catalog: perms });
    } catch (err) {
      console.error('[PermissionStore] catalog fetch failed', err);
    }
  },

  // GET /api/my-permissions
  // Self-service endpoint — any authenticated user can call this.
  // Returns the permission names assigned to their role from role_permissions table.
  // This is different from the admin-only /api/admin/permissions/role/{role} endpoint.
  fetchRolePermissions: async (_role: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/my-permissions');

      // data = { role: 'dealer', is_admin: false, permissions: ['view_customers', ...] }
      const names: string[] = data.permissions || [];

      set({
        rolePermissions: names,
        isLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('[PermissionStore] my-permissions fetch failed', err);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // GET /api/admin/permissions/user/{userId}
  // Per-user overrides — admin only, used on the permissions management page
  fetchUserPermissions: async (userId: number) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/admin/permissions/user/${userId}`);

      const effectiveNames: string[] =
        (data.effective_permissions || []).map((p: Permission | string) =>
          typeof p === 'string' ? p : p.name
        );

      set({
        rolePermissions: effectiveNames.length > 0 ? effectiveNames : get().rolePermissions,
        userOverrides: data.overrides || data.user_permissions || [],
        isLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('[PermissionStore] user permissions fetch failed', err);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // Quick boolean check — use everywhere in the app
  hasPermission: (permissionName: string) => {
    return get().rolePermissions.includes(permissionName);
  },

  reset: () =>
    set({
      catalog: [],
      rolePermissions: [],
      userOverrides: [],
      isLoaded: false,
      isLoading: false,
    }),
}));