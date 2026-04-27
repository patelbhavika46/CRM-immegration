import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  can: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      setToken: (token) => set({ token }),

      updateUser: (user) => set({ user }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      can: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role?.slug === 'super_admin') return true;
        return user.permissions?.includes(permission) ?? false;
      },

      hasRole: (role) => get().user?.role?.slug === role,
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
