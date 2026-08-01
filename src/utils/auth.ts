// Authentication State Management with JWT
const AUTH_STORAGE_KEY = 'tutortrace_token';
const USER_STORAGE_KEY = 'tutortrace_user';

export interface User {
  email: string;
  loggedInAt: string;
}

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  },

  setToken: (token: string) => {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  },

  removeToken: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  getUser: (): User | null => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setUser: (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  removeUser: () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isAuthenticated: (): boolean => {
    return authStorage.getToken() !== null;
  },
};
