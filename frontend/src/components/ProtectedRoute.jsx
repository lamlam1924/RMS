import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children }) {
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

  return isAuthenticated ? children : null;
}
