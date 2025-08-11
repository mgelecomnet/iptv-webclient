import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  login as authLogin, 
  logout as authLogout, 
  isAuthenticated as checkAuthenticated, 
  getUser,
  setupTokenRefresh
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // بررسی وضعیت احراز هویت در هنگام بارگذاری برنامه
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = checkAuthenticated();
      if (isLoggedIn) {
        const currentUser = getUser();
        setUser(currentUser);
        
        // راه‌اندازی مکانیزم رفرش خودکار توکن
        setupTokenRefresh();
      }
      setLoading(false);
    };

    checkAuth();
    
    // تمیز کردن در هنگام unmount
    return () => {
      // هیچ نیازی به تمیز کردن نیست، زیرا setupTokenRefresh خودش event listener ها را تمیز می‌کند
    };
  }, []);

  // تابع ورود به سیستم
  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const loggedInUser = await authLogin({ username, password });
      setUser(loggedInUser);
      
      // راه‌اندازی مکانیزم رفرش خودکار توکن پس از ورود
      setupTokenRefresh();
      
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  // تابع خروج از سیستم
  const logout = () => {
    authLogout();
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;