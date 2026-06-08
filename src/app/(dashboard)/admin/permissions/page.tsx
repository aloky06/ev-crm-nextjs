'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import {
  Key, Shield, Search, RefreshCw, Loader2,
  CheckSquare, Square, PlusCircle, MinusCircle,
  Users, UserX, ShieldAlert, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
  description: string | null;
  is_assigned?: boolean;
}

interface RoleUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

interface UserOverride {
  id: number;
  permission_id: number;
  type: 'grant' | 'revoke';
  reason: string | null;
}

type TabType = 'roles' | 'users' | 'catalog';
// FIX #6: removed 'admin' and 'customer' — backend validateRole() only allows these three
type Role = 'bde' | 'dealer' | 'distributor';

const ROLES: Role[] = ['bde', 'dealer', 'distributor'];

const ROLE_COLORS: Record<Role, string> = {
  bde:         'bg-blue-50 text-blue-700 border-blue-200',
  dealer:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  distributor: 'bg-amber-50 text-amber-700 border-amber-200',
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success'
        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        : <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
      {msg}
    </div>
  );
}

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<Role>('bde');
  const [rolePermIds, setRolePermIds] = useState<number[]>([]);
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
  const [loadingRoleData, setLoadingRoleData] = useState(false);
  const [syncingRole, setSyncingRole] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [searchUserId, setSearchUserId] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const modules = ['all', ...Array.from(new Set(catalog.map((p) => p.module)))];
  const filteredCatalog = moduleFilter === 'all' ? catalog : catalog.filter((p) => p.module === moduleFilter);
  const groupedCatalog = filteredCatalog.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  useEffect(() => {
  (async () => {
    setLoadingCatalog(true);
    try {
      const { data } = await api.get('/admin/permissions');
      const raw = data.data || data;
      const perms: Permission[] = Array.isArray(raw)
        ? raw
        : (Object.values(raw) as Permission[][]).flat();
      setCatalog(perms);
      const initial: Record<string, boolean> = {};
      perms.forEach((p) => { initial[p.module] = true; });
      setExpandedModules(initial);
    } catch {
      showToast('Failed to load permission catalog', 'error');
    } finally {
      setLoadingCatalog(false);
    }
  })();
}, []);

  const loadRoleData = useCallback(async () => {
    if (activeTab !== 'roles') return;
    setLoadingRoleData(true);
    try {
      const [permRes, userRes] = await Promise.all([
        api.get(`/admin/permissions/role/${selectedRole}`),
        api.get(`/admin/permissions/role/${selectedRole}/users`),
      ]);

      // FIX #3: backend returns permissions as a grouped object keyed by module,
      // not a flat array — flatten it, then filter by is_assigned flag.
      const raw = permRes.data.permissions;
      const flat: Permission[] = Array.isArray(raw)
        ? raw
        : (Object.values(raw) as Permission[][]).flat();
      const ids = flat.filter((p) => p.is_assigned).map((p) => p.id);

      setRolePermIds(ids);
      setRoleUsers(userRes.data.users || userRes.data.data || userRes.data || []);
    } catch {
      showToast('Failed to load role data', 'error');
    } finally {
      setLoadingRoleData(false);
    }
  }, [selectedRole, activeTab]);

  useEffect(() => { loadRoleData(); }, [loadRoleData]);

  const handleSyncRole = async () => {
    setSyncingRole(true);
    try {
      // FIX #2: key must be `permission_ids` (array), not `permissions`
      await api.put(`/admin/permissions/role/${selectedRole}`, { permission_ids: rolePermIds });
      showToast(`${selectedRole} permissions synced successfully`);
    } catch {
      showToast('Sync failed', 'error');
    } finally {
      setSyncingRole(false);
    }
  };

  const handleRoleAction = async (permId: number, action: 'grant' | 'revoke') => {
    const key = `role-${permId}-${action}`;
    setActioningId(key);
    try {
      // FIX #1: key must be `permission_ids` (array), not `permission_id`
      await api.post(`/admin/permissions/role/${selectedRole}/${action}`, { permission_ids: [permId] });
      setRolePermIds((prev) =>
        action === 'grant' ? [...prev, permId] : prev.filter((id) => id !== permId)
      );
      showToast(`Permission ${action}ed`);
    } catch {
      showToast(`Failed to ${action} permission`, 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleFetchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId) return;
    setLoadingUser(true);
    try {
      const { data } = await api.get(`/admin/permissions/user/${searchUserId}`);
      setUserOverrides(data.overrides || data.user_permissions || data.data || []);
      setActiveUserId(searchUserId);
    } catch {
      showToast('User not found', 'error');
      setActiveUserId(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleUserAction = async (permId: number, type: 'grant' | 'revoke') => {
    if (!activeUserId) return;
    const key = `user-${permId}-${type}`;
    setActioningId(key);
    try {
      // FIX #4: key must be `permission_ids` (array), not `permission_id`
      await api.post(`/admin/permissions/user/${activeUserId}/${type}`, { permission_ids: [permId] });
      const { data } = await api.get(`/admin/permissions/user/${activeUserId}`);
      setUserOverrides(data.overrides || data.user_permissions || data.data || []);
      showToast(`Override ${type}ed`);
    } catch {
      showToast('Failed to apply override', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleRemoveOverride = async (permId: number) => {
    if (!activeUserId) return;
    setActioningId(`del-${permId}`);
    try {
      await api.delete(`/admin/permissions/user/${activeUserId}/permission/${permId}`);
      setUserOverrides((prev) => prev.filter((o) => o.permission_id !== permId));
      showToast('Override removed');
    } catch {
      showToast('Failed to remove override', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleResetUser = async () => {
    if (!activeUserId || !confirm('Remove ALL permission exceptions for this user?')) return;
    setLoadingUser(true);
    try {
      await api.delete(`/admin/permissions/user/${activeUserId}/reset`);
      setUserOverrides([]);
      showToast('All exceptions cleared');
    } catch {
      showToast('Reset failed', 'error');
    } finally {
      setLoadingUser(false);
    }
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Key className="h-6 w-6 text-blue-600" />
            Permissions Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage role defaults and per-user permission overrides
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border bg-slate-100 p-1">
          {(['roles', 'users', 'catalog'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'roles' && <Shield className="mr-1 inline h-3.5 w-3.5" />}
              {tab === 'users' && <Search className="mr-1 inline h-3.5 w-3.5" />}
              {tab === 'catalog' && <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loadingCatalog ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4">
            {activeTab === 'roles' && (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-blue-500" /> Select Role
                </p>
                <div className="space-y-1">
                  {ROLES.map((role) => (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium capitalize transition-all ${
                        selectedRole === role ? 'border-l-4 border-blue-600 bg-blue-50 pl-2 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${ROLE_COLORS[role]}`}>{role}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{rolePermIds.length}</span> permissions assigned
                  </div>
                  <button onClick={handleSyncRole} disabled={syncingRole || loadingRoleData}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                    {syncingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Save All Changes
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Search className="h-3.5 w-3.5 text-blue-500" /> Find User
                </p>
                <form onSubmit={handleFetchUser} className="space-y-2">
                  <input type="number" required placeholder="Enter User ID..."
                    value={searchUserId} onChange={(e) => setSearchUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" disabled={loadingUser}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    {loadingUser ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load Permissions'}
                  </button>
                </form>
                {activeUserId && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-slate-600">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div><span className="block font-bold text-slate-800">Override Active</span>Editing User <span className="font-mono font-bold">#{activeUserId}</span></div>
                    </div>
                    <button onClick={handleResetUser}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                      <UserX className="h-4 w-4" /> Clear All Exceptions
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'catalog' && (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Filter Module
                </p>
                <div className="space-y-1">
                  {modules.map((mod) => (
                    <button key={mod} onClick={() => setModuleFilter(mod)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm capitalize transition-all ${
                        moduleFilter === mod ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      {mod}<span className="ml-2 text-xs text-slate-400">({mod === 'all' ? catalog.length : catalog.filter((p) => p.module === mod).length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'roles' && (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
                  <h2 className="text-sm font-bold capitalize text-slate-800">
                    Permissions for role: <span className={`ml-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${ROLE_COLORS[selectedRole]}`}>{selectedRole}</span>
                  </h2>
                  {loadingRoleData && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </div>
                {loadingRoleData ? (
                  <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="divide-y">
                    {Object.entries(catalog.reduce<Record<string, Permission[]>>((acc, p) => {
                      if (!acc[p.module]) acc[p.module] = [];
                      acc[p.module].push(p);
                      return acc;
                    }, {})).map(([module, perms]) => {
                      const assignedInModule = perms.filter((p) => rolePermIds.includes(p.id)).length;
                      const isExpanded = expandedModules[module] !== false;
                      return (
                        <div key={module}>
                          <button onClick={() => setExpandedModules((prev) => ({ ...prev, [module]: !isExpanded }))}
                            className="flex w-full items-center justify-between bg-slate-50/70 px-5 py-2.5 text-left hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{module}</span>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{assignedInModule}/{perms.length}</span>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </button>
                          {isExpanded && (
                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                              {perms.map((perm) => {
                                const isAssigned = rolePermIds.includes(perm.id);
                                return (
                                  <div key={perm.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                                    isAssigned ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white hover:bg-slate-50/50'
                                  }`}>
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <button onClick={() => setRolePermIds((prev) =>
                                        prev.includes(perm.id) ? prev.filter((id) => id !== perm.id) : [...prev, perm.id]
                                      )} className="mt-0.5 shrink-0 text-blue-600 hover:text-blue-700">
                                        {isAssigned ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-300" />}
                                      </button>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 leading-tight">{perm.display_name}</p>
                                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">{perm.name}</p>
                                        {perm.description && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{perm.description}</p>}
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-1">
                                      <button disabled={isAssigned || actioningId === `role-${perm.id}-grant`}
                                        onClick={() => handleRoleAction(perm.id, 'grant')}
                                        className="rounded border px-2 py-1 text-[10px] font-bold transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                        {actioningId === `role-${perm.id}-grant` ? '...' : 'Grant'}
                                      </button>
                                      <button disabled={!isAssigned || actioningId === `role-${perm.id}-revoke`}
                                        onClick={() => handleRoleAction(perm.id, 'revoke')}
                                        className="rounded border px-2 py-1 text-[10px] font-bold transition hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-30 disabled:cursor-not-allowed">
                                        {actioningId === `role-${perm.id}-revoke` ? '...' : 'Revoke'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!loadingRoleData && roleUsers.length > 0 && (
                  <div className="border-t bg-slate-50/50 p-5">
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Users className="h-4 w-4" /> Users with this role
                    </h4>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {roleUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{user.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{user.email}</p>
                          </div>
                          <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h2 className="text-sm font-bold text-slate-800">
                    {activeUserId ? `Per-User Overrides — User #${activeUserId}` : 'User Permission Exceptions'}
                  </h2>
                </div>
                {!activeUserId ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
                    <Search className="h-8 w-8" />
                    <p className="text-sm">Enter a User ID on the left to manage their exceptions</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {catalog.map((perm) => {
                      const override = userOverrides.find((o) => o.permission_id === perm.id);
                      const isProcessing = actioningId === `user-${perm.id}-grant` || actioningId === `user-${perm.id}-revoke` || actioningId === `del-${perm.id}`;
                      return (
                        <div key={perm.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{perm.display_name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{perm.name} · {perm.module}</p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isProcessing ? (
                              <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</span>
                            ) : override ? (
                              <>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                  override.type === 'grant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>{override.type === 'grant' ? 'Granted' : 'Revoked'}</span>
                                <button onClick={() => handleRemoveOverride(perm.id)} className="text-xs text-slate-400 underline hover:text-slate-700">Remove</button>
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleUserAction(perm.id, 'grant')}
                                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" /> Force Allow
                                </button>
                                <button onClick={() => handleUserAction(perm.id, 'revoke')}
                                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                                  <MinusCircle className="h-3.5 w-3.5 text-red-500" /> Force Deny
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b bg-slate-50 px-5 py-3">
                  <h2 className="text-sm font-bold text-slate-800">
                    Master Permission Catalog
                    <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{filteredCatalog.length} permissions</span>
                  </h2>
                </div>
                <div className="divide-y">
                  {Object.entries(groupedCatalog).map(([module, perms]) => (
                    <div key={module}>
                      <div className="bg-slate-50/70 px-5 py-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{module}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                        {perms.map((perm) => (
                          <div key={perm.id} className="rounded-xl border bg-slate-50/50 p-4 shadow-inner">
                            <p className="text-sm font-bold text-slate-900">{perm.display_name}</p>
                            <p className="mt-1 font-mono text-[10px] text-slate-400">slug: {perm.name} | module: {perm.module}</p>
                            {perm.description && <p className="mt-2 text-xs italic text-slate-500">"{perm.description}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}