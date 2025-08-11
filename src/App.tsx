import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MobileSidebar from './components/MobileSidebar';
import { Route, Routes, useLocation } from 'react-router-dom';
import { updateGridLayout } from './utils/deviceScaling';

import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import the new page components
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import SeriesPage from './pages/SeriesPage';
import SearchPage from './pages/SearchPage';
import LivePage from './pages/LivePage';
import CategoryPage from './pages/CategoryPage';
import MorePage from './pages/MorePage';
import LoginPage from './pages/LoginPage';
import MovieDetail from './pages/MovieDetail';
import SeriesDetail from './pages/SeriesDetail';
import ProfilePage from './pages/ProfilePage';

function App() {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [focusedArea, setFocusedArea] = useState<'sidebar' | 'content'>('sidebar');
  const [isInitialFocus, setIsInitialFocus] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Check if current page is detail page (movie or series) or login page
  const isDetailPage = location.pathname.startsWith('/movie/') || location.pathname.startsWith('/series/') || location.pathname === '/login';

  // Check if the device is mobile
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Effect to run device scaling on mount
  useEffect(() => {
    // Call updateGridLayout when app mounts
    updateGridLayout();
    
    // Also update on resize
    window.addEventListener('resize', updateGridLayout);
    
    return () => {
      window.removeEventListener('resize', updateGridLayout);
    };
  }, []);

  // Effect to set initial focus on sidebar when the app loads
  useEffect(() => {
    // Only proceed if not a detail page and not the profile page
    if (!isDetailPage && location.pathname !== '/profile') {
      // Set initial focus on the appropriate sidebar link based on current route
      let linkSelector = 'a[href="/"]';
      
      if (location.pathname === '/movies') {
        linkSelector = 'a[href="/movies"]';
      } else if (location.pathname === '/series') {
        linkSelector = 'a[href="/series"]';
      } else if (location.pathname === '/live') {
        linkSelector = 'a[href="/live"]';
      } else if (location.pathname === '/categories') {
        linkSelector = 'a[href="/categories"]';
      } else if (location.pathname === '/more') {
        linkSelector = 'a[href="/more"]';
      } else if (location.pathname === '/login') {
        // Do not set focus on sidebar for login page
        // This case is already covered by the outer if, but kept for clarity if logic changes
        return;
      }
      else if (location.pathname === '/search') {
        linkSelector = 'a[href="/search"]';
      }
      
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const activeLink = sidebarRef.current?.querySelector(linkSelector);
        if (activeLink instanceof HTMLElement) {
          activeLink.focus();
          setFocusedArea('sidebar');
          setIsInitialFocus(false);
        }
      }, 150);
    }
  }, [location.pathname, isDetailPage]);

  // Handle moving from sidebar to content area (left key in RTL)
  const handleMoveToContent = () => {
    // Set focus area to content (this helps manage keyboard navigation)
    setFocusedArea('content');
    
    // FOR MOVIES AND SERIES PAGES, DON'T FORCIBLY CHANGE FOCUS
    // This allows the page component to manage its own focus
    if (location.pathname === '/movies' || location.pathname === '/series') {
      console.log('Letting movies/series page manage its own focus');
      return;
    }
    
    if (location.pathname === '/') {
      // On home page, focus on play button
      const playButton = document.querySelector('.play-button');
      if (playButton instanceof HTMLElement) {
        playButton.focus();
      }
    } else if (location.pathname === '/live') {
      // On live page, focus on first channel card
      const firstChannel = document.querySelector('.channel-card');
      if (firstChannel instanceof HTMLElement) {
        firstChannel.focus();
      }
    } else if (location.pathname === '/categories') {
      // On categories page, focus on first category button
      const firstCategoryButton = document.querySelector('.category-button');
      if (firstCategoryButton instanceof HTMLElement) {
        firstCategoryButton.focus();
      }
    } else if (location.pathname === '/more') {
      // On more page, focus on the first option link
      const firstMoreOptionLink = document.querySelector('.more-option-link');
      if (firstMoreOptionLink instanceof HTMLElement) {
        firstMoreOptionLink.focus();
      }
    } else if (location.pathname === '/login') {
      // On login page, focus on form
      const loginForm = document.querySelector('.login-form-placeholder');
      if (loginForm instanceof HTMLElement) {
        loginForm.focus();
      }
    } else if (location.pathname === '/profile') {
      // On profile page, focus on profile content
      const profileContent = document.querySelector('.profile-content');
      if (profileContent instanceof HTMLElement) {
        setTimeout(() => {
          profileContent.focus();
        }, 100);
      }
    } else if (isDetailPage) {
      // در صفحه جزئیات، فوکوس روی دکمه پخش
      const playButton = document.querySelector('.play-button');
      if (playButton instanceof HTMLElement) {
        playButton.focus();
      }
    } else {
      // On other pages, focus on first tile (rightmost item)
      const firstTile = document.querySelector('.media-grid-container .media-tile');
      if (firstTile instanceof HTMLElement) {
        firstTile.focus();
      }
    }
  };

  // Handle moving from content area back to sidebar (right key in RTL)
  const handleMoveToSidebar = () => {
    setFocusedArea('sidebar');
    
    // Focus the correct sidebar link based on the current route
    let linkSelector = 'a[href="/"]';
    
    if (location.pathname === '/movies') {
      linkSelector = 'a[href="/movies"]';
    } else if (location.pathname === '/series') {
      linkSelector = 'a[href="/series"]';
    } else if (location.pathname === '/live') {
      linkSelector = 'a[href="/live"]';
    } else if (location.pathname === '/categories') {
      linkSelector = 'a[href="/categories"]';
    } else if (location.pathname === '/more') {
      linkSelector = 'a[href="/more"]';
    } else if (location.pathname === '/login') {
      linkSelector = 'a[href="/login"]';
    } else if (location.pathname === '/search') {
      linkSelector = 'a[href="/search"]';
    } else if (isDetailPage) {
      // برای صفحه جزئیات، منوی خانه انتخاب شود
      linkSelector = 'a[href="/"]';
    }
    
    const activeLink = sidebarRef.current?.querySelector(linkSelector);
    if (activeLink instanceof HTMLElement) {
      activeLink.focus();
    }
  };

  // اگر صفحه جزئیات فیلم یا سریال یا صفحه لاگین باشد، فقط صفحه را بدون سایدبار نمایش بده
  if (isDetailPage) {
    return (
      <AuthProvider>
        <div className="app-container fullscreen-app">
          <Routes>
            <Route 
              path="/movie/:id" 
              element={
                <ProtectedRoute>
                  <MovieDetail />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/series/:id" 
              element={
                <ProtectedRoute>
                  <SeriesDetail />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/login" 
              element={
                <LoginPage 
                  onLeftArrowPress={() => {}}
                  onRightArrowPress={() => {}}
                />
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="app-container">
        <div className="sidebar-wrapper">
          {/* نمایش سایدبار متناسب با نوع دستگاه */}
          {isMobileView ? (
            <MobileSidebar 
              onLeftArrowPress={handleMoveToContent}
              onRightArrowPress={handleMoveToSidebar}
            />
          ) : (
            <Sidebar 
              ref={sidebarRef} 
              onLeftArrowPress={handleMoveToContent}
              onRightArrowPress={handleMoveToSidebar}
            />
          )}
        </div>

        {/* Main content area where pages will be rendered */}
        <div className="content-wrapper">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movies" 
              element={
                <ProtectedRoute>
                  <MoviesPage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/series" 
              element={
                <ProtectedRoute>
                  <SeriesPage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live" 
              element={
                <ProtectedRoute>
                  <LivePage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute>
                  <CategoryPage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/more" 
              element={
                <ProtectedRoute>
                  <MorePage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            {/* مسیر لاگین به بخش تمام صفحه منتقل شده است */}
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <SearchPage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage 
                    onLeftArrowPress={handleMoveToContent}
                    onRightArrowPress={handleMoveToSidebar}
                  />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;