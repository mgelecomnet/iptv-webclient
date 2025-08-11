import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/apiConfig';

// Define JWT token interface
interface JWTToken {
  exp: number;
  user_id: number;
  // Add other JWT claims as needed
}

// Define types for authentication
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  // Add other user fields as needed
}

// Local storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// Create axios instance with auth headers
export const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor to add token to requests
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh
authAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          // No refresh token, logout user
          logout();
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        // Save new tokens
        const { access } = response.data;
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        
        // Update the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication functions
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/login/`, 
      credentials
    );
    
    // Save tokens to local storage
    const { access, refresh } = response.data;
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    
    // Get user info
    const userResponse = await authAxios.get<User>(`${API_BASE_URL}/auth/profile/`);
    const user = userResponse.data;
    
    // Save user to local storage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Global variable to track the refresh interval (declared above)

export const logout = (): void => {
  // Remove tokens and user from local storage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Clear token refresh interval if it exists
  if (tokenRefreshInterval !== null) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Get token expiration time
export const getTokenExpiration = (token: string): number => {
  try {
    const decoded = jwtDecode<JWTToken>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error decoding token:', error);
    return 0;
  }
};

// Check if token is about to expire (within the next 2 minutes)
export const isTokenExpiringSoon = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  const now = Date.now();
  // Check if token will expire in the next 2 minutes (120000 ms)
  // This gives enough time to refresh the token before it expires
  return expiration - now < 120000;
};

// Refresh the access token using the refresh token
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.warn('No refresh token available');
      logout();
      return null;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
      refresh: refreshToken,
    });

    const { access } = response.data;
    if (!access) {
      console.error('No access token in refresh response');
      logout();
      return null;
    }
    
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    return access;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Only logout if it's an authentication error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn('Refresh token is invalid or expired, logging out');
      logout();
    }
    return null;
  }
};

// Global variable to track the refresh interval
let tokenRefreshInterval: number | null = null;

// Setup token refresh mechanism
export const setupTokenRefresh = (): void => {
  // Clear any existing interval to prevent duplicates
  if (tokenRefreshInterval !== null) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }

  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      // If no token exists, clear the interval
      if (tokenRefreshInterval !== null) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
      return;
    }

    try {
      if (isTokenExpiringSoon(token)) {
        console.log('Access token is about to expire, refreshing...');
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Error during token refresh check:', error);
    }
  };

  // Initial check
  checkAndRefreshToken();

  // Check token every 60 seconds (1 minute)
  // Since token lifetime is now 15 minutes, checking every minute is sufficient
  tokenRefreshInterval = window.setInterval(checkAndRefreshToken, 60000);

  // Also check when the page becomes visible again
  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible, checking token status...');
      // Force immediate check when tab becomes active
      checkAndRefreshToken();
    }
  };

  // Remove any existing event listener before adding a new one
  document.removeEventListener('visibilitychange', visibilityHandler);
  document.addEventListener('visibilitychange', visibilityHandler);

  // Clean up on page unload
  const unloadHandler = () => {
    if (tokenRefreshInterval !== null) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
    }
  };

  // Remove any existing event listener before adding a new one
  window.removeEventListener('beforeunload', unloadHandler);
  window.addEventListener('beforeunload', unloadHandler);
};

export default {
  login,
  logout,
  isAuthenticated,
  getUser,
  getAccessToken,
  refreshAccessToken,
  setupTokenRefresh,
  authAxios,
};