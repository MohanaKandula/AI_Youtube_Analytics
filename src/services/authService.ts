const getApiBase = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://ai-youtube-analytics.onrender.com';
};

export const API_BASE_URL = getApiBase();

export interface UserProfile {
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  notification_settings?: Record<string, any>;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user?: UserProfile;
  valid?: boolean;
  otp?: string;
}

class AuthService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  getUser(): UserProfile | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  setSession(token: string, user: UserProfile): void {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth session', e);
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  }

  async login(email: string, password: string, rememberMe = false): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  async sendOtp(email: string, password: string, fullName = ''): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  async resendOtp(email: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }
    return data;
  }

  async register(email: string, password: string, fullName = ''): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  }

  async verifyToken(): Promise<{ valid: boolean; user?: UserProfile }> {
    const token = this.getToken();
    if (!token) {
      return { valid: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      if (!response.ok) {
        this.clearSession();
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: Boolean(data.valid),
        user: data.user,
      };
    } catch {
      return { valid: false };
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(true),
        });
      }
    } catch (e) {
      console.warn('Logout network error ignored', e);
    } finally {
      this.clearSession();
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({ message: 'Invalid response from server' }));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }
    return data;
  }
}

const authService = new AuthService();
export default authService;
