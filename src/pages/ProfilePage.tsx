import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '../components/UserProfile';
import '../App.css';
import './ProfilePage.css';

interface ProfilePageProps {
  onLeftArrowPress?: () => void;
  onRightArrowPress?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onLeftArrowPress, onRightArrowPress }) => {
  const navigate = useNavigate();




  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (backButtonRef.current) {
      backButtonRef.current.focus();
    }
  }, []);

  // تابع برای پاسخ به کلیدهای جهت‌دار
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' && onRightArrowPress) {
      e.preventDefault();
      onRightArrowPress();
    } else if (e.key === 'ArrowLeft' && onLeftArrowPress) {
      e.preventDefault();
      onLeftArrowPress();
    } else if (e.key === 'ArrowDown' && onRightArrowPress) {
      e.preventDefault();
      onRightArrowPress();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // No action for ArrowUp from back button, as nothing is above it to focus within the page
    }
  };

  return (
    <div className="profile-page main-content">
      <div className="content-container">
        <div className="profile-header">
          <h1 className="page-title">پروفایل کاربری</h1>
        </div>
        <div 
          className="profile-content"
        >
          <UserProfile />
        </div>
       
      </div>
    </div>
  );
};

export default ProfilePage;