import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="user-profile-container">
        <p>لطفا وارد حساب کاربری خود شوید.</p>
        <button 
          className="login-button" 
          onClick={() => navigate('/login')}
        >
          ورود به حساب
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <div className="user-avatar">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="user-name">{user.username}</h2>
      </div>

      <div className="user-profile-info">
        <div className="info-item">
          <span className="info-label">نام کاربری:</span>
          <span className="info-value">{user.username}</span>
        </div>
        {user.email && (
          <div className="info-item">
            <span className="info-label">ایمیل:</span>
            <span className="info-value">{user.email}</span>
          </div>
        )}
      </div>

      <div className="user-profile-actions">
        
      </div>
    </div>
  );
};

export default UserProfile;