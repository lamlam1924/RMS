import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import '../../../styles/user-profile.css';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const userInfo = authService.getUserInfo();
    setUser(userInfo);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="user-profile">
      <button
        className="user-profile-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-avatar">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">{user.fullName}</div>
          <div className="user-email">{user.email}</div>
        </div>
        <svg className="dropdown-icon" width="20" height="20" viewBox="0 0 20 20">
          <path d="M5 7l5 5 5-5H5z" fill="currentColor" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div
            className="dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
          />
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="dropdown-user-name">{user.fullName}</div>
              <div className="dropdown-user-email">{user.email}</div>
              <div className="user-badges">
                {user.authProvider === 'Google' && (
                  <span className="badge badge-google">Google</span>
                )}
                {user.roles?.map(role => (
                  <span key={role} className="badge badge-role">{role}</span>
                ))}
              </div>
            </div>

            {user.departments && user.departments.length > 0 && (
              <div className="dropdown-section">
                <div className="section-title">Phòng ban</div>
                {user.departments.map(dept => (
                  <div key={dept} className="section-item">{dept}</div>
                ))}
              </div>
            )}

            <div className="dropdown-divider" />

            <button className="dropdown-item" onClick={() => window.location.href = '/profile'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2 2H6a5 5 0 00-5 5v1h12v-1a5 5 0 00-5-5z" />
              </svg>
              Thông tin cá nhân
            </button>

            <button className="dropdown-item" onClick={() => window.location.href = '/settings'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 01-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 01-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 01.52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 011.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 011.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 01.52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 01-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 01-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 002.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 001.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 00-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 00-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 00-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 001.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 003.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 002.692-1.115l.094-.319z" />
              </svg>
              Cài đặt
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z" />
                <path d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}
