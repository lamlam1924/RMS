import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function PrivateRoute({ children, roles }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = authService.getAccessToken();

      if (!accessToken) {
        redirectToLogin();
        return;
      }

      // Check if token is expired
      if (authService.isTokenExpired(accessToken)) {
        // Try to refresh
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          try {
            await authService.refreshToken();
            setIsAuthenticated(true);
          } catch (error) {
            redirectToLogin();
          }
        } else {
          redirectToLogin();
        }
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      redirectToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    authService.clearTokens();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return isAuthenticated ? (
    roles && roles.length > 0 ? (
      checkRolePermission(roles) ? children : (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ color: '#e11d48' }}>⛔ Access Denied</h2>
          <p>Bạn không có quyền truy cập trang này.</p>

          <div style={{ marginTop: 20, padding: 15, background: '#f8fafc', borderRadius: 8, textAlign: 'left', display: 'inline-block', fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Debug Info:</strong><br />
            Required: {roles.join(', ')}<br />
            Your Roles: {authService.getUserInfo()?.roles?.join(', ') || 'None'}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => { authService.logout(); window.location.href = '/login'; }}
              style={{ padding: '8px 16px', cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4 }}
            >
              Đăng xuất & Thử lại
            </button>
          </div>
        </div>
      )
    ) : children
  ) : null;
}

function checkRolePermission(requiredRoles) {
  const user = authService.getUserInfo();

  console.log('--- Auth Debug ---');
  console.log('Required Roles:', requiredRoles);
  console.log('Current User:', user);
  console.log('User Roles:', user?.roles);

  if (!user || !user.roles) {
    console.warn('User roles not found!');
    return false;
  }

  // Case-insensitive check
  const userRolesNormalized = user.roles.map(r => r.toUpperCase());
  const requiredRolesNormalized = requiredRoles.map(r => r.toUpperCase());

  const hasPermission = requiredRolesNormalized.some(role => userRolesNormalized.includes(role));
  console.log('Has Permission:', hasPermission);

  return hasPermission;
}
