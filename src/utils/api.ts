// API Configuration and Utilities with JWT
import { authStorage } from './auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://ai-youtube-analytics.onrender.com').replace(/\/+$/, '');

// API Error Handler
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API Request Handler with JWT
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Network error occurred');
  }
}

// Authentication API
export const authApi = {
  register: async (email: string, password: string) => {
    return apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  verifyOtp: async (email: string, password: string, otp: string) => {
    const response = await apiRequest<{ token: string; email: string }>('/api/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp }),
    });
    
    // Store token and user
    authStorage.setToken(response.token);
    authStorage.setUser({ email: response.email, loggedInAt: new Date().toISOString() });
    
    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; email: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token and user
    authStorage.setToken(response.token);
    authStorage.setUser({ email: response.email, loggedInAt: new Date().toISOString() });
    
    return response;
  },

  changePassword: async (email: string, currentPassword: string, newPassword: string) => {
    return apiRequest('/api/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
  },
};

// Search History API
export const searchHistoryApi = {
  getHistory: async () => {
    return apiRequest<Array<{ query: string; feature_type: string; created_at: string }>>('/api/search-history', {
      method: 'GET',
    });
  },

  addSearch: async (query: string, featureType: string) => {
    return apiRequest('/api/search-history', {
      method: 'POST',
      body: JSON.stringify({ query, feature_type: featureType }),
    });
  },

  clearHistory: async () => {
    return apiRequest('/api/search-history', {
      method: 'DELETE',
    });
  },
};

// Predictions API
export const predictionsApi = {
  getPredictions: async () => {
    return apiRequest('/api/predictions', {
      method: 'GET',
    });
  },

  predictPerformance: async (title: string, description: string, tags: string) => {
    return apiRequest<{ predicted_views_30d: number; engagement_score: number; ctr: number }>('/api/predict_performance', {
      method: 'POST',
      body: JSON.stringify({ title, description, tags }),
    });
  },
};

// Downloaded Reports API
export const reportsApi = {
  getReports: async () => {
    return apiRequest<Array<{ report_name: string; report_type: string; created_at: string }>>('/api/downloaded-reports', {
      method: 'GET',
    });
  },

  addReport: async (reportName: string, reportType: string) => {
    return apiRequest('/api/downloaded-reports', {
      method: 'POST',
      body: JSON.stringify({ report_name: reportName, report_type: reportType }),
    });
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async () => {
    return apiRequest('/api/notifications', {
      method: 'GET',
    });
  },

  markAsRead: async (notificationId: number) => {
    return apiRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },
};

// Trending Topics API (Real-time YouTube Data)
export const trendingApi = {
  getTrendingTopics: async (region: string = 'US') => {
    return apiRequest<Array<{ keyword: string; frequency: number; trend: string }>>(`/api/trending-topics?region=${region}`, {
      method: 'GET',
    });
  },
};

export default apiRequest;
