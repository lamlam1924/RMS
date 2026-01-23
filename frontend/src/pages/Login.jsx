import { useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../services/authService';
import './login.css';

const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false); // Prevent double processing

  // Function to load remembered email
  const loadRememberedEmail = useCallback(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    } else {
      // Nếu không có saved email, reset form
      setEmail('');
      setRememberMe(false);
    }
    setPassword(''); // Luôn xóa password khi load lại
  }, []);

  // Load remembered email on mount
  useEffect(() => {
    loadRememberedEmail();
  }, [loadRememberedEmail]);

  // Handle browser Back/Forward navigation (bfcache)
  useEffect(() => {
    const handlePageShow = (event) => {
      // event.persisted = true khi page được load từ bfcache (back/forward)
      if (event.persisted) {
        loadRememberedEmail();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [loadRememberedEmail]);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !isProcessingRef.current) {
      isProcessingRef.current = true;
      // Clear code from URL to prevent re-processing
      window.history.replaceState({}, document.title, '/login');
      handleGoogleCallback(code);
    }
  }, []);

  const handleGoogleCallback = async (code) => {
    setLoading(true);
    setError('');
    
    try {
      await authService.loginWithGoogle(code);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Lưu hoặc xóa email dựa vào rememberMe
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      
      await authService.login(email, password, rememberMe);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi thay đổi checkbox
  const handleRememberMeChange = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    
    // Nếu bỏ tích → xóa email đã lưu ngay lập tức
    if (!checked) {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const url = await authService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError('Không thể kết nối với Google');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Recruitment Management System</h1>
          <p>Đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                disabled={loading}
              />
              <span>Ghi nhớ tài khoản</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="divider">
          <span>hoặc</span>
        </div>

        <button 
          type="button"
          className="btn btn-google btn-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng nhập với Google
        </button>

        <div className="login-footer">
          <a href="/forgot-password">Quên mật khẩu?</a>
        </div>
      </div>
    </div>
  );
}
