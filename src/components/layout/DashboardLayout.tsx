import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { usePermissionStore } from '@/store/permissionStore';

export default function DashboardLayout({ children }) {
  const { user } = useAuthStore();
  const { fetchCatalog, fetchUserPermissions, isLoaded } = usePermissionStore();

  useEffect(() => {
    if (user?.id && !isLoaded) {
      if (user.role === 'admin') fetchCatalog();
      fetchUserPermissions(user.id);
    }
  }, [user?.id, isLoaded]);

  return (
    <div>
      {/* Layout UI */}
      {children}
    </div>
  );
}
