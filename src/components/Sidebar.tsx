import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../contexts/AuthContext';
import { FaUser } from 'react-icons/fa';

interface SidebarProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

// کامپوننت نمایش وضعیت کاربر
const UserStatus = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="user-status">
      <FaUser />
      <span className="username">{user.username}</span>
    </div>
  );
};

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ onLeftArrowPress, onRightArrowPress }, ref) => {
  const location = useLocation();
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isKeyHandlingEnabled, setIsKeyHandlingEnabled] = useState<boolean>(true);
  const [initialFocusSet, setInitialFocusSet] = useState<boolean>(false);
  const { isAuthenticated, logout } = useAuth();

  // Set initial focus based on current route
  useEffect(() => {
    // Find the index of the active link based on current location
    let activeIndex = 0;
    if (location.pathname === '/movies') {
      activeIndex = 1;
    } else if (location.pathname === '/series') {
      activeIndex = 2;
    }
    
    // Focus the active link if available - with a small delay to ensure DOM is ready
    if (menuItemsRef.current.length > 0 && menuItemsRef.current[activeIndex]) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (menuItemsRef.current[activeIndex]) {
          menuItemsRef.current[activeIndex]?.focus();
          setFocusedIndex(activeIndex);
          setInitialFocusSet(true);
        }
      }, 100);
    }
  }, [location.pathname]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Prevent double-firing
    if (!isKeyHandlingEnabled || !initialFocusSet) {
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Move focus to the next menu item
        const nextIndex = (index + 1) % menuItemsRef.current.length;
        menuItemsRef.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
        
        // Debounce
        setIsKeyHandlingEnabled(false);
        setTimeout(() => setIsKeyHandlingEnabled(true), 200);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        // Move focus to the previous menu item
        const prevIndex = (index - 1 + menuItemsRef.current.length) % menuItemsRef.current.length;
        menuItemsRef.current[prevIndex]?.focus();
        setFocusedIndex(prevIndex);
        
        // Debounce
        setIsKeyHandlingEnabled(false);
        setTimeout(() => setIsKeyHandlingEnabled(true), 200);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        // In RTL, left arrow moves from sidebar to content area
        if (onLeftArrowPress) {
          onLeftArrowPress();
          
          // Debounce
          setIsKeyHandlingEnabled(false);
          setTimeout(() => setIsKeyHandlingEnabled(true), 200);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        // Activate the menu item
        menuItemsRef.current[index]?.click();
        
        // Debounce
        setIsKeyHandlingEnabled(false);
        setTimeout(() => setIsKeyHandlingEnabled(true), 200);
        break;
    }
  };

  // Handle focus manually for each menu item
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
    setInitialFocusSet(true);
  };

  // آیکون‌های SVG برای منو
  const SearchIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const MoviesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.82 2H4.18C2.97602 2 2 2.97602 2 4.18V19.82C2 21.024 2.97602 22 4.18 22H19.82C21.024 22 22 21.024 22 19.82V4.18C22 2.97602 21.024 2 19.82 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 7H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 17H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 7H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const SeriesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 9L15 12L10 15V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const CategoriesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const LiveIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 3L12 5L17 3" stroke="currentColor" strokeWidth="2"/>
      <rect x="5" y="8" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="19" cy="7" r="1" fill="currentColor"/>
      <circle cx="19" cy="10" r="1" fill="currentColor"/>
      <circle cx="19" cy="13" r="1" fill="currentColor"/>
    </svg>
  );

  const MoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <circle cx="19" cy="12" r="2" fill="currentColor"/>
      <circle cx="5" cy="12" r="2" fill="currentColor"/>
    </svg>
  );

  const LoginIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const LogoutIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const UserIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // تابع برای خروج از حساب کاربری
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div 
      className="sidebar" 
      ref={ref}
      tabIndex={-1}
    >
      <button className="watch-button">تماشا</button>
      {isAuthenticated && <UserStatus />}
      <nav>
        <ul>
          <li>
            <Link 
              to="/search" 
              className={location.pathname === '/search' ? 'active' : ''}
              ref={el => { menuItemsRef.current[0] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 0)}
              onFocus={() => handleFocus(0)}
              tabIndex={0}
            >
              <SearchIcon />
              جستجو
            </Link>
          </li>
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
              ref={el => { menuItemsRef.current[1] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 1)}
              onFocus={() => handleFocus(1)}
              tabIndex={0}
            >
              <HomeIcon />
              خانه
            </Link>
          </li>
          <li>
            <Link 
              to="/movies" 
              className={location.pathname === '/movies' ? 'active' : ''}
              ref={el => { menuItemsRef.current[2] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 2)}
              onFocus={() => handleFocus(2)}
              tabIndex={0}
            >
              <MoviesIcon />
              فیلم
            </Link>
          </li>
          <li>
            <Link 
              to="/series" 
              className={location.pathname === '/series' ? 'active' : ''}
              ref={el => { menuItemsRef.current[3] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 3)}
              onFocus={() => handleFocus(3)}
              tabIndex={0}
            >
              <SeriesIcon />
              سریال
            </Link>
          </li>
          <li>
            <Link 
              to="/live" 
              className={location.pathname === '/live' ? 'active' : ''}
              ref={el => { menuItemsRef.current[4] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 4)}
              onFocus={() => handleFocus(4)}
              tabIndex={0}
            >
              <LiveIcon />
              پخش زنده
            </Link>
          </li>
          <li>
            <Link 
              to="/categories" 
              className={location.pathname === '/categories' ? 'active' : ''}
              ref={el => { menuItemsRef.current[5] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 5)}
              onFocus={() => handleFocus(5)}
              tabIndex={0}
            >
              <CategoriesIcon />
              دسته بندی
            </Link>
          </li>
          <li>
            <Link 
              to="/more" 
              className={location.pathname === '/more' ? 'active' : ''}
              ref={el => { menuItemsRef.current[6] = el; }}
              onKeyDown={(e) => handleKeyDown(e, 6)}
              onFocus={() => handleFocus(6)}
              tabIndex={0}
            >
              <MoreIcon />
              بیشتر
            </Link>
          </li>
          <li>
            {!isAuthenticated ? (
              <Link 
                to="/login" 
                className={location.pathname === '/login' ? 'active' : ''}
                ref={el => { menuItemsRef.current[7] = el; }}
                onKeyDown={(e) => handleKeyDown(e, 7)}
                onFocus={() => handleFocus(7)}
                tabIndex={0}
              >
                <LoginIcon />
                ورود به حساب
              </Link>
            ) : null}
          </li>
        </ul>
      </nav>
    </div>
  );
});

export default Sidebar;