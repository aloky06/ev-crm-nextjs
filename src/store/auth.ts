import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  _hasHydrated: boolean
  setHasHydrated: (val: boolean) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/login', { email, password })
          const { user, token } = res.data
          localStorage.setItem('ev_crm_token', token)
          set({ user, token, isLoading: false })

          // After login, fetch role permissions for non-admin users
          // so the sidebar filters correctly right away.
          if (user.role !== 'admin') {
            // Lazy import to avoid circular dependency
            const { usePermissionStore } = await import('@/store/permissionStore')
            usePermissionStore.getState().fetchRolePermissions(user.role)
          }
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('ev_crm_token')
        localStorage.removeItem('ev_crm_user')
        set({ user: null, token: null })

        // Clear permission state on logout
        const { usePermissionStore } = await import('@/store/permissionStore')
        usePermissionStore.getState().reset()
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'ev_crm_user',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
