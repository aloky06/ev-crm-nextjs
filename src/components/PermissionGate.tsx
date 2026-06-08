// src/components/PermissionGate.tsx
// Wrap any JSX with this component to show/hide based on permission
//
// Usage examples:
//   <PermissionGate permission="view_sales">
//     <SalesTable />
//   </PermissionGate>
//
//   <PermissionGate permission="create_sales" fallback={<p>Access denied</p>}>
//     <NewSaleButton />
//   </PermissionGate>
//
//   <PermissionGate anyOf={['view_dealers', 'view_distributors']}>
//     <NetworkTab />
//   </PermissionGate>

'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  children: ReactNode;
  /** Single permission required */
  permission?: string;
  /** User needs ANY one of these */
  anyOf?: string[];
  /** User needs ALL of these */
  allOf?: string[];
  /** What to render when access is denied (default: null) */
  fallback?: ReactNode;
  /** What to render while permissions are loading (default: null) */
  loadingFallback?: ReactNode;
}

export default function PermissionGate({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll, isReady } = usePermission();

  if (!isReady) return <>{loadingFallback}</>;

  let allowed = true;

  if (permission) allowed = can(permission);
  else if (anyOf && anyOf.length > 0) allowed = canAny(anyOf);
  else if (allOf && allOf.length > 0) allowed = canAll(allOf);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
