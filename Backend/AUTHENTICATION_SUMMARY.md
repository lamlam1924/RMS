# Tóm Tắt Chức Năng Authentication

## 📋 Tổng Quan

Đã implement đầy đủ các chức năng:
1. **Login** - Đăng nhập bằng Email/Password
2. **Login with Google** - Đăng nhập bằng Google OAuth 2.0
3. **Remember Me** - Ghi nhớ tài khoản (chỉ lưu email, KHÔNG lưu mật khẩu)
4. **JWT Token** - Access Token + Refresh Token
5. **Password Hashing** - BCrypt với work factor 12

---

## 🔧 Backend (ASP.NET Core 8.0)

### 1. Cấu Hình (`appsettings.json`)
```json
{
  "JWT": {
    "Secret": "YourSuperSecretKeyForJWT_MustBeAtLeast32Characters!",
    "Issuer": "RMS-Backend",
    "Audience": "RMS-Frontend",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 30
  },
  "Google": {
    "ClientId": "xxx.apps.googleusercontent.com",
    "ClientSecret": "GOCSPX-xxx",
    "RedirectUri": "http://localhost:5173/login"
  }
}
```

### 2. Entity (`Backend/Entity/`)

#### RefreshToken.cs
```csharp
public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public virtual User User { get; set; }
}
```

#### User.cs (đã có, thêm fields)
- `PasswordHash` - Lưu BCrypt hash
- `GoogleId` - Google OAuth ID
- `AuthProvider` - "Local" hoặc "Google"

### 3. DTOs (`Backend/Dto/Auth/`)

| File | Mô tả |
|------|-------|
| `LoginRequestDto.cs` | Email, Password, RememberMe |
| `LoginResponseDto.cs` | AccessToken, RefreshToken, UserInfo |
| `UserInfoDto.cs` | Id, FullName, Email, Roles, Departments |
| `GoogleCallbackDto.cs` | Code từ Google OAuth |
| `RefreshTokenRequestDto.cs` | RefreshToken để làm mới |

### 4. Helper (`Backend/Common/`)

#### PasswordHelper.cs
```csharp
public static class PasswordHelper
{
    // Hash password với BCrypt (work factor 12)
    public static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password, 12);

    // Verify password với hash
    public static bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}
```

#### JwtTokenHelper.cs
- `GenerateAccessToken()` - Tạo JWT access token (60 phút)
- `GenerateRefreshToken()` - Tạo random refresh token
- `ValidateToken()` - Xác thực JWT token

### 5. Repository (`Backend/Repository/`)

#### IAuthRepository.cs / AuthRepository.cs
| Method | Mô tả |
|--------|-------|
| `GetUserByEmailAsync()` | Tìm user theo email |
| `GetUserByGoogleIdAsync()` | Tìm user theo Google ID |
| `GetUserRolesAsync()` | Lấy danh sách roles của user |
| `GetUserDepartmentsAsync()` | Lấy danh sách departments |
| `CreateUserAsync()` | Tạo user mới (Google OAuth) |
| `CreateRefreshTokenAsync()` | Lưu refresh token |
| `GetRefreshTokenAsync()` | Lấy refresh token |
| `RevokeRefreshTokenAsync()` | Thu hồi refresh token |

### 6. Service (`Backend/Service/`)

#### IAuthService.cs / AuthService.cs
| Method | Mô tả |
|--------|-------|
| `LoginAsync()` | Đăng nhập email/password |
| `LoginWithGoogleAsync()` | Đăng nhập Google OAuth |
| `RefreshTokenAsync()` | Làm mới access token |
| `LogoutAsync()` | Đăng xuất (revoke token) |
| `ExchangeCodeForTokenAsync()` | Exchange Google code → token |
| `GetGoogleUserInfoAsync()` | Lấy thông tin user từ Google |

### 7. Controller (`Backend/Controller/`)

#### AuthController.cs
| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/auth/login` | POST | Đăng nhập |
| `/api/auth/google/url` | GET | Lấy Google OAuth URL |
| `/api/auth/google/callback` | POST | Xử lý Google callback |
| `/api/auth/refresh` | POST | Làm mới token |
| `/api/auth/logout` | POST | Đăng xuất |
| `/api/auth/me` | GET | Lấy thông tin user hiện tại |

### 8. Database Migration (`Backend/RMS_DB/`)

#### 05_AuthenticationMigration.sql
- Thêm columns `PasswordHash`, `GoogleId`, `AuthProvider` vào bảng `Users`
- Tạo bảng `RefreshTokens`

---

## 🎨 Frontend (React + Vite)

### 1. Service (`frontend/src/services/`)

#### authService.js
| Method | Mô tả |
|--------|-------|
| `login()` | Gọi API đăng nhập |
| `loginWithGoogle()` | Gọi API Google callback |
| `getGoogleAuthUrl()` | Lấy URL redirect Google |
| `refreshToken()` | Làm mới access token |
| `logout()` | Đăng xuất |
| `saveTokens()` | Lưu token vào localStorage/sessionStorage |
| `getAccessToken()` | Lấy access token |
| `isAuthenticated()` | Kiểm tra đã đăng nhập |

### 2. Pages (`frontend/src/pages/`)

#### Login.jsx
- Form đăng nhập với Email/Password
- Checkbox "Ghi nhớ tài khoản" (lưu email vào localStorage)
- Nút hiện/ẩn mật khẩu (con mắt)
- Nút "Đăng nhập với Google"
- Xử lý Google OAuth callback
- Xử lý browser Back button (pageshow event)

#### GoogleCallback.jsx
- Xử lý callback từ Google OAuth

### 3. Components (`frontend/src/components/`)

#### ProtectedRoute.jsx
- Bảo vệ routes yêu cầu đăng nhập
- Redirect về `/login` nếu chưa đăng nhập
- Tự động refresh token khi expired

### 4. Routing (`frontend/src/App.jsx`)
```jsx
<Routes>
  {/* Public */}
  <Route path="/login" element={<Login />} />
  <Route path="/auth/google/callback" element={<GoogleCallback />} />
  
  {/* Root → Login */}
  <Route path="/" element={<Navigate to="/login" />} />
  
  {/* Protected */}
  <Route path="/staff" element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
    <Route path="dashboard" element={<Dashboard />} />
    {/* ... other routes */}
  </Route>
</Routes>
```

### 5. Styles (`frontend/src/pages/login.css`)
- Giao diện form đăng nhập hiện đại
- Nút toggle password với icon con mắt
- Responsive design

---

## 🔐 Luồng Hoạt Động

### Login Email/Password
```
1. User nhập email/password
2. Frontend gọi POST /api/auth/login
3. Backend verify password với BCrypt
4. Backend tạo JWT access token + refresh token
5. Frontend lưu tokens vào localStorage/sessionStorage
6. Redirect về /dashboard
```

### Login Google OAuth
```
1. User click "Đăng nhập với Google"
2. Frontend gọi GET /api/auth/google/url
3. Redirect đến Google consent screen
4. Google callback về /login?code=xxx
5. Frontend gọi POST /api/auth/google/callback với code
6. Backend exchange code → Google access token
7. Backend lấy user info từ Google
8. Backend tạo/cập nhật user trong DB
9. Backend tạo JWT tokens
10. Frontend lưu tokens, redirect về /dashboard
```

### Ghi Nhớ Tài Khoản
```
☑️ TÍCH checkbox:
- Lưu EMAIL vào localStorage (key: rememberedEmail)
- Quay lại /login → Email tự động điền, checkbox tích sẵn

☐ KHÔNG TÍCH:
- Xóa email khỏi localStorage
- Form trống hoàn toàn

⚠️ MẬT KHẨU KHÔNG BAO GIỜ ĐƯỢC LƯU!
```

---

## 📁 Cấu Trúc Files Đã Tạo/Sửa

### Backend
```
Backend/
├── appsettings.json (sửa - thêm JWT, Google config)
├── Program.cs (sửa - thêm JWT auth, CORS)
├── Common/
│   ├── PasswordHelper.cs (mới)
│   └── JwtTokenHelper.cs (mới)
├── Controller/
│   └── AuthController.cs (mới)
├── Dto/
│   └── Auth/
│       ├── LoginRequestDto.cs (mới)
│       ├── LoginResponseDto.cs (mới)
│       ├── UserInfoDto.cs (mới)
│       ├── GoogleCallbackDto.cs (mới)
│       └── RefreshTokenRequestDto.cs (mới)
├── Entity/
│   ├── RefreshToken.cs (mới)
│   └── User.cs (sửa - thêm fields)
├── Repository/
│   ├── IAuthRepository.cs (mới)
│   └── AuthRepository.cs (mới)
├── Service/
│   ├── IAuthService.cs (mới)
│   └── AuthService.cs (mới)
├── Data/
│   └── RecruitmentDbContext.cs (sửa - thêm RefreshTokens)
├── RMS_DB/
│   └── 05_AuthenticationMigration.sql (mới)
└── Properties/
    └── launchSettings.json (sửa - port 3000)
```

### Frontend
```
frontend/src/
├── App.jsx (sửa - thêm routes)
├── services/
│   └── authService.js (mới)
├── pages/
│   ├── Login.jsx (mới)
│   ├── login.css (mới)
│   └── GoogleCallback.jsx (mới)
└── components/
    └── ProtectedRoute.jsx (mới)
```

---

## ⚙️ Cấu Hình Ports

| Service | Port |
|---------|------|
| Backend | http://localhost:3000 |
| Frontend | http://localhost:5173 |
| Database | localhost:1401 |

---

## 📦 Packages Đã Thêm

### Backend (NuGet)
- `BCrypt.Net-Next` - Password hashing
- `Microsoft.AspNetCore.Authentication.JwtBearer` - JWT auth
- `System.IdentityModel.Tokens.Jwt` - JWT token handling

### Frontend (npm)
- Đã có sẵn: `react-router-dom`

---

## ✅ Checklist Hoàn Thành

- [x] Login với Email/Password
- [x] Password hashing với BCrypt
- [x] JWT Access Token (60 phút)
- [x] Refresh Token (30 ngày)
- [x] Google OAuth 2.0
- [x] Ghi nhớ tài khoản (chỉ lưu email)
- [x] Hiện/ẩn mật khẩu (icon con mắt)
- [x] Protected routes
- [x] Auto token refresh
- [x] Logout
- [x] CORS configuration
- [x] Browser back button handling
