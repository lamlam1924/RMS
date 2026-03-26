# Authentication System Information for Diagram

## 1. Core Authentication Entities

### **User Entity (Staff)**
```
- Id: int (PK)
- FullName: string
- Email: string (Unique)
- PasswordHash: string?
- GoogleId: string?
- AuthProvider: string (LOCAL/Google)
- AvatarUrl: string?
- IsActive: bool?
- IsDeleted: bool?
- CreatedAt: DateTime?
- UpdatedAt: DateTime?
```

### **Candidate Entity (Job Applicants)**
```
- Id: int (PK)
- FullName: string
- Email: string (Unique)
- Phone: string?
- PasswordHash: string?
- GoogleId: string?
- AuthProvider: string (LOCAL/Google)
- AvatarUrl: string?
- IsDeleted: bool?
- CreatedAt: DateTime?
```

### **Role Entity**
```
- Id: int (PK)
- Code: string (HR_STAFF, HR_MANAGER, DIRECTOR, etc.)
- Name: string
- ParentRoleId: int? (Hierarchical roles)
```

### **RefreshToken Entity**
```
- Id: int (PK)
- UserId: int (FK to User)
- Token: string (Base64 random)
- ExpiresAt: DateTime
- CreatedAt: DateTime
- IsRevoked: bool
- RevokedAt: DateTime?
```

### **UserDepartment Entity (Many-to-Many)**
```
- UserId: int (FK)
- DepartmentId: int (FK)
- IsPrimary: bool?
- JoinedAt: DateOnly?
- LeftAt: DateOnly?
```

## 2. Authentication Services & Components

### **AuthService (Main Service)**
```
+ EmailExistsAsync(email): bool
+ SendOtpAsync(email): OtpResponseDto
+ VerifyOtpAsync(email, otpCode): OtpResponseDto
+ RegisterAsync(request): LoginResponseDto
+ LoginAsync(request): LoginResponseDto
+ LoginWithGoogleAsync(code): LoginResponseDto
+ RefreshTokenAsync(refreshToken): LoginResponseDto
+ LogoutAsync(refreshToken): void
+ ChangePasswordAsync(userId, isCandidate, currentPassword, newPassword): void
+ UploadAvatarAsync(userId, isCandidate, fileStream, fileName): string
+ SendForgotPasswordOtpAsync(email): OtpResponseDto
+ VerifyForgotPasswordOtpAsync(email, otpCode): OtpResponseDto
+ ResetPasswordAsync(email, newPassword): bool
```

### **AuthRepository (Data Access)**
```
+ GetUserByEmailAsync(email): User?
+ GetUserByIdAsync(id): User?
+ GetUserByGoogleIdAsync(googleId): User?
+ GetCandidateByEmailAsync(email): Candidate?
+ GetCandidateByIdAsync(id): Candidate?
+ GetCandidateByGoogleIdAsync(googleId): Candidate?
+ CreateUserAsync(user): User
+ CreateCandidateAsync(candidate): Candidate
+ UpdateUserAsync(user): User
+ UpdateCandidateAsync(candidate): Candidate
+ CreateRefreshTokenAsync(refreshToken): RefreshToken
+ GetRefreshTokenAsync(token): RefreshToken?
+ RevokeRefreshTokenAsync(tokenId): void
+ GetUserRolesAsync(userId): List<string>
+ GetUserDepartmentsAsync(userId): List<string>
+ EmailExistsAsync(email): bool
+ CandidateEmailExistsAsync(email): bool
```

### **JwtTokenHelper (Token Management)**
```
+ GenerateAccessToken(user, roles): string
+ GenerateAccessToken(candidate): string
+ GenerateRefreshToken(): string
+ ValidateToken(token): ClaimsPrincipal?
```

### **PasswordHelper (Security)**
```
+ HashPassword(password): string (BCrypt)
+ VerifyPassword(password, hash): bool
```

### **CurrentUserHelper (Context)**
```
+ GetCurrentUserId(controller): int
```

### **OtpCacheData (Memory Cache)**
```
- Code: string (6 digits)
- ExpiresAt: DateTime
- Attempts: int (max 5)
```

## 3. Authentication Controller Endpoints

### **AuthController**
```
GET    /api/auth/check-email?email={email}
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google/callback
GET    /api/auth/google/url
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/change-password
POST   /api/auth/upload-avatar
GET    /api/auth/me
POST   /api/auth/forgot-password/send-otp
POST   /api/auth/forgot-password/verify-otp
POST   /api/auth/forgot-password/reset
```

## 4. Authentication DTOs

### **Request DTOs**
```
LoginRequestDto:
- Email: string
- Password: string
- RememberMe: bool

RegisterRequestDto:
- FullName: string
- Email: string
- Password: string
- ConfirmPassword: string

GoogleCallbackDto:
- Code: string

RefreshTokenRequestDto:
- RefreshToken: string

ChangePasswordRequestDto:
- CurrentPassword: string
- NewPassword: string
- ConfirmNewPassword: string

ResetPasswordRequestDto:
- Email: string
- NewPassword: string
- ConfirmPassword: string

SendOtpRequestDto:
- Email: string

VerifyOtpRequestDto:
- Email: string
- OtpCode: string

UploadAvatarRequestDto:
- File: IFormFile
```

### **Response DTOs**
```
LoginResponseDto:
- AccessToken: string
- RefreshToken: string?
- User: UserInfoDto

UserInfoDto:
- Id: int
- FullName: string
- Email: string
- AvatarUrl: string?
- AuthProvider: string
- Roles: List<string>
- Departments: List<string>

OtpResponseDto:
- Success: bool
- Message: string
- ExpiresAt: DateTime?

GoogleUserInfo:
- Sub: string (Google ID)
- Email: string
- Name: string
- Picture: string
- EmailVerified: bool
```

## 5. Authentication Workflow States

### **Registration Flow**
```
1. Check Email → 2. Send OTP → 3. Verify OTP → 4. Register → 5. Login Success
```

### **Login Flow**
```
1. Email/Password → 2. Validate Credentials → 3. Generate Tokens → 4. Return Response
```

### **Google OAuth Flow**
```
1. Get Auth URL → 2. User Consent → 3. Exchange Code → 4. Get User Info → 5. Create/Update User → 6. Generate Tokens
```

### **Forgot Password Flow**
```
1. Send OTP → 2. Verify OTP → 3. Reset Password → 4. Success
```

### **Token Refresh Flow**
```
1. Validate Refresh Token → 2. Generate New Access Token → 3. Optionally Rotate Refresh Token
```

## 6. Security Configuration

### **JWT Configuration**
```
- Secret: 32+ character key
- Issuer: "RMS-Backend"
- Audience: "RMS-Frontend"
- AccessToken Expiry: 60 minutes
- RefreshToken Expiry: 30 days
- Algorithm: HMAC SHA256
```

### **Google OAuth Configuration**
```
- ClientId: Google App Client ID
- ClientSecret: Google App Secret
- RedirectUri: Frontend callback URL
- Scopes: "openid email profile"
```

### **Password Security**
```
- Hashing: BCrypt with work factor 12
- Minimum Length: 6 characters
- Validation: Required, confirmed for registration
```

### **OTP Security**
```
- Length: 6 digits
- Expiry: 5 minutes
- Max Attempts: 5
- Storage: In-memory cache
- Rate Limiting: Per email
```

## 7. Role-Based Authorization

### **Role Hierarchy**
```
DIRECTOR (Highest)
├── HR_MANAGER
│   └── HR_STAFF
├── DEPT_MANAGER
└── EMPLOYEE
    └── INTERVIEWER

CANDIDATE (Separate hierarchy)
```

### **Permission Matrix**
```
| Endpoint | DIRECTOR | HR_MANAGER | HR_STAFF | DEPT_MANAGER | EMPLOYEE | CANDIDATE |
|----------|----------|------------|----------|--------------|----------|-----------|
| /api/hr/* | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| /api/director/* | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| /api/candidate/* | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| /api/auth/* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
```

## 8. Database Relationships

```
User ||--o{ RefreshToken : "has tokens"
User }|--|| Role : "has roles" (Many-to-Many)
User ||--o{ UserDepartment : "assigned to"
UserDepartment }o--|| Department : "belongs to"
Role ||--o{ Role : "parent role" (Self-referencing)

Candidate (Independent entity for job applicants)
```

## 9. External Integrations

### **Email Service**
```
- SMTP Configuration
- OTP Email Templates
- Password Reset Notifications
```

### **Cloudinary Service**
```
- Avatar Upload
- Image Optimization
- CDN Delivery
```

### **Google OAuth API**
```
- Authorization Code Exchange
- User Info Retrieval
- Token Validation
```

### **Memory Cache (IMemoryCache)**
```
- OTP Storage
- Session Data
- Rate Limiting
```

## 10. Authentication Middleware Pipeline

```
1. CORS Policy
2. JWT Bearer Authentication
3. Authorization Filters
4. Role-based Access Control
5. Controller Action Execution
```

## 11. Error Handling & Logging

### **Exception Types**
```
- UnauthorizedAccessException: Invalid credentials
- InvalidOperationException: Business logic errors
- ArgumentException: Validation errors
```

### **Logging Events**
```
- User Registration
- Login Attempts (Success/Failure)
- Password Changes
- Token Refresh
- OTP Generation/Verification
- Google OAuth Events
```

## 12. Performance Considerations

### **Caching Strategy**
```
- OTP Cache: 5 minutes expiry
- User Roles Cache: Per request
- JWT Validation: Stateless
```

### **Database Optimization**
```
- Indexes on Email fields
- Soft delete patterns
- Connection pooling
- Query optimization
```

This information provides a comprehensive foundation for creating authentication system diagrams including class diagrams, sequence diagrams, and architecture diagrams.