// src/components/withPermission.tsx
// Higher-Order Component for page-level route protection
// Redirects to /dashboard with a toast if user lacks permission
//
// Usage (wrap your page export):
//   export default withPermission(SalesPage, 'view_sales');
//   export default withPermission(AdminPage, 'manage_users', '/dashboard');

'use client';

import { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermission: string,
  redirectTo: string = '/dashboard'
) {
  const ProtectedComponent = (props: P) => {
    const router = useRouter();
    const { can, isReady } = usePermission();

    useEffect(() => {
      if (isReady && !can(requiredPermission)) {
        router.replace(redirectTo);
      }
    }, [isReady]);

    if (!isReady) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      );
    }

    if (!can(requiredPermission)) return null;

    return <WrappedComponent {...props} />;
  };

  ProtectedComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ProtectedComponent;
}
