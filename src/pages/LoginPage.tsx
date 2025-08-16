import React, { useState, useEffect } from 'react';
import '../App.css';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

const LoginPage = ({ onLeftArrowPress, onRightArrowPress }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  
  // تنظیم فوکوس اولیه روی فیلد نام کاربری
  useEffect(() => {
    // استفاده از setTimeout برای اطمینان از اینکه DOM کاملاً رندر شده است
    setTimeout(() => {
      const usernameInput = document.getElementById('username');
      if (usernameInput instanceof HTMLElement) {
        usernameInput.focus();
      }
    }, 100);
  }, []);
  
  // تابع برای پاسخ به کلیدهای جهت‌دار و ناوبری با کیبرد
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      // حرکت به فیلد بعدی
      if (e.target === document.getElementById('username')) {
        document.getElementById('password')?.focus();
      } else if (e.target === document.getElementById('password')) {
  (document.querySelector('.login-button') as HTMLElement | null)?.focus();
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      // حرکت به فیلد قبلی
      if (e.target === document.querySelector('.login-button')) {
        document.getElementById('password')?.focus();
      } else if (e.target === document.getElementById('password')) {
        document.getElementById('username')?.focus();
      }
    }
  };

  // تابع برای ارسال فرم لاگین
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // بررسی اعتبار فرم
    if (!username || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }
    
    try {
      setError('');
      
      // ارسال درخواست لاگین
      await login(username, password);
      
      // هدایت کاربر به صفحه اصلی
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // نمایش پیام خطا
      if (err.response && err.response.status === 401) {
        setError('نام کاربری یا رمز عبور اشتباه است');
      } else {
        setError('خطا در ورود به سیستم. لطفاً دوباره تلاش کنید');
      }
    }
  };
  
  return (
    <div className="login-page main-content">
      <div className="login-container">
        <h1 className="login-title">ورود به حساب کاربری</h1>
        
        <div className="login-form-container">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}
          
          <form 
            className="login-form"
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
          >
            <div className="form-group">
              <label htmlFor="username">نام کاربری یا ایمیل</label>
              <input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                disabled={loading}
                tabIndex={1}
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">رمز عبور</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                disabled={loading}
                tabIndex={2}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
              tabIndex={3}
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
            
            <p className="register-link">حساب کاربری ندارید؟ <span>ثبت‌نام</span></p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;