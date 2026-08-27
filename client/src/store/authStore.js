import { create } from 'zustand';
import api from '../services/api';
import { joinUserRoom } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Initialize from localStorage on browser load
  checkAuth: async () => {
    if (typeof window === 'undefined') return;

    set({ isLoading: true });
    const token = localStorage.getItem('agentflow_token');
    const storedUser = localStorage.getItem('agentflow_user');

    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        set({ user: userObj, token, isAuthenticated: true });
        joinUserRoom(userObj.id);
      }

      // Verify token with backend
      const res = await api.get('/api/auth/me');
      const verifiedUser = res.data.data;

      localStorage.setItem('agentflow_user', JSON.stringify(verifiedUser));
      set({ user: verifiedUser, token, isAuthenticated: true, isLoading: false, error: null });
      joinUserRoom(verifiedUser.id);
    } catch (err) {
      console.warn('[Auth] Token validation error:', err.message);
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      joinUserRoom(user.id);
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please verify your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/api/auth/register', { name, email, password, role });
      const { user, token } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      joinUserRoom(user.id);
      return user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
