import { useState } from 'react';
import { authService } from '../../services/authService';
import '../../styles/login.css';

export default function Register() {
  // Multi-step state
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Info

  // Form fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);

  // Step 1: Validate and send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.sendOtp(email);
      setOtpExpiry(response.expiresAt);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.verifyOtp(email, otpCode);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!fullName.trim()) {
      setError('Họ và tên là bắt buộc');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authService.register(fullName, email, password, confirmPassword);
      
      // Redirect based on user role
      const user = authService.getUserInfo();
      const roles = user?.roles?.map(r => r.toUpperCase()) || [];
      
      if (roles.includes('CANDIDATE')) {
        window.location.href = '/app/jobs';
      } else if (roles.includes('ADMIN')) {
        window.location.href = '/staff/admin';
      } else if (roles.includes('DIRECTOR')) {
        window.location.href = '/staff/director';
      } else {
        window.location.href = '/staff/dashboard';
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await authService.sendOtp(email);
      setOtpExpiry(response.expiresAt);
      setOtpCode('');
      setError('');
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Recruitment Management System</h1>
          <p>Tạo tài khoản mới - Bước {step}/3</p>
        </div>

        {/* Progress Stepper */}
        <div className="stepper">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <div className="step-label">Email</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Xác thực</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Thông tin</div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="login-form">
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
              <small className="form-hint">Nhập email để nhận mã xác thực</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Tiếp tục'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <p className="otp-info">
              Mã OTP đã được gửi đến <strong>{email}</strong>
            </p>

            <div className="form-group">
              <label htmlFor="otpCode">Mã OTP (6 số)</label>
              <input
                type="text"
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                disabled={loading}
                className="otp-input"
              />
              <small className="form-hint">Vui lòng kiểm tra email (kể cả thư mục spam)</small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </button>

            <div className="form-actions">
              <button
                type="button"
                className="link-button"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Thay đổi email
              </button>
              <button
                type="button"
                className="link-button"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Gửi lại mã
              </button>
            </div>
          </form>
        )}

        {/* Step 3: User Info */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
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
                  minLength={6}
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
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <span>Đã có tài khoản? </span>
          <a href="/login">Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  );
}
