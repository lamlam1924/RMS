# RMS - Mermaid Code (Copy để chạy trên app)

## Cách sử dụng
- **Mermaid Live Editor:** https://mermaid.live → paste code vào
- **VS Code:** Cài extension "Mermaid" hoặc "Markdown Preview Mermaid Support"
- **Trình duyệt:** Mở file `auth-workflow-mermaid.html` trong thư mục này

---

## 1. Tổng quan Auth Flow

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React)"]
        Login["Login.jsx"]
        Register["Register.jsx"]
        ForgotPwd["ForgotPassword.jsx"]
        GoogleCB["GoogleCallback.jsx"]
        PrivateRoute["PrivateRoute.jsx"]
        authService["authService.js"]
    end

    subgraph Backend["Backend (.NET)"]
        AuthCtrl["AuthController"]
        AuthSvc["AuthService"]
        JWT["JwtTokenHelper"]
        AuthRepo["AuthRepository"]
    end

    subgraph Storage["Storage"]
        localStorage["localStorage (rememberMe=true)"]
        sessionStorage["sessionStorage (rememberMe=false)"]
    end

    subgraph External["External"]
        Google["Google OAuth"]
        Email["Email Service"]
    end

    Login -->|POST /api/auth/login| AuthCtrl
    AuthCtrl --> AuthSvc
    AuthSvc --> AuthRepo
    AuthSvc --> JWT
    AuthSvc --> Login
    Login --> authService
    authService --> Storage

    Login -->|GET /api/auth/google/url| AuthCtrl
    Login --> Google
    Google --> GoogleCB
    GoogleCB -->|POST /api/auth/google/callback| AuthCtrl
    AuthSvc --> Google

    Register --> AuthCtrl
    AuthSvc --> Email

    ForgotPwd --> AuthCtrl

    PrivateRoute --> authService
    authService --> Storage
```

---

## 2. Login Flow (Sequence)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as AuthController
    participant Svc as AuthService
    participant Repo as AuthRepository
    participant JWT as JwtTokenHelper

    U->>F: email, password, rememberMe
    F->>API: POST /api/auth/login
    API->>Svc: LoginAsync(request)

    alt Staff (User)
        Svc->>Repo: GetUserByEmailAsync
        Repo-->>Svc: user
        Svc->>Svc: VerifyPassword
        Svc->>Repo: GetUserRolesAsync
        alt rememberMe
            Svc->>Repo: CreateRefreshTokenAsync
        end
    else Candidate
        Svc->>Repo: GetCandidateByEmailAsync
        Repo-->>Svc: candidate
        Svc->>Svc: VerifyPassword
    end

    Svc->>JWT: GenerateAccessToken
    JWT-->>Svc: accessToken
    Svc-->>API: LoginResponseDto
    API-->>F: 200 OK
    F->>F: saveTokens
    F->>U: redirect by role
```

---

## 3. Google OAuth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as AuthController
    participant Svc as AuthService
    participant G as Google

    U->>F: Click Đăng nhập Google
    F->>API: GET /api/auth/google/url
    API-->>F: url
    F->>G: redirect
    U->>G: consent
    G->>F: callback?code=xxx
    F->>API: POST /api/auth/google/callback
    API->>Svc: LoginWithGoogleAsync

    Svc->>G: Exchange code
    G-->>Svc: tokenResponse
    Svc->>G: GET userinfo
    G-->>Svc: googleUser

    Svc->>Svc: GetUser/Candidate
    alt not found
        Svc->>Svc: CreateCandidate
    end
    Svc->>Svc: GenerateAccessToken
    Svc-->>API: LoginResponseDto
    API-->>F: 200 OK
    F->>F: saveTokens
    F->>U: redirect by role
```

---

## 4. Register Flow

```mermaid
flowchart LR
    subgraph Step1["Bước 1: OTP"]
        A1["sendOtp"] --> A2["Cache 5 phút"]
        A2 --> A3["Gửi email"]
    end

    subgraph Step2["Bước 2: Verify"]
        B1["verifyOtp"] --> B2{"Đúng?"}
        B2 -->|Có| B3["Cache verified"]
        B2 -->|Không| B4["Tăng attempts"]
    end

    subgraph Step3["Bước 3: Register"]
        C1["register"] --> C2{"Verified?"}
        C2 -->|Có| C3["Create Candidate"]
        C3 --> C4["JWT"]
        C4 --> C5["saveTokens"]
    end

    Step1 --> Step2 --> Step3
```

---

## 5. Refresh Token Flow

```mermaid
flowchart TB
    A["authFetch / PrivateRoute"] --> B{"Token hết hạn?"}
    B -->|Có| C{"Có refreshToken?"}
    B -->|Không| D["Gửi request"]
    C -->|Không| E["redirect /login"]
    C -->|Có| F["POST /api/auth/refresh"]
    F --> G["Validate DB"]
    G --> H["Revoke old"]
    H --> I["Create new refreshToken"]
    I --> J["New accessToken"]
    J --> K["saveTokens"]
    K --> D
```

---

## 6. Route Protection (PrivateRoute)

```mermaid
flowchart TB
    A["checkAuth"] --> B{"Có accessToken?"}
    B -->|Không| C["redirect /login"]
    B -->|Có| D{"Token hết hạn?"}
    D -->|Không| E["Authenticated"]
    D -->|Có| F{"refreshToken?"}
    F -->|Không| C
    F -->|Có| G["refreshToken()"]
    G --> H{"OK?"}
    H -->|Không| C
    H -->|Có| E
    E --> I{"Có roles?"}
    I -->|Không| J["render children"]
    I -->|Có| K{"checkRolePermission"}
    K -->|Có| J
    K -->|Không| L["Access Denied"]
```

---

## 7. API Auth Endpoints

```mermaid
flowchart LR
    subgraph Anonymous["Anonymous"]
        A1["/check-email"]
        A2["/send-otp"]
        A3["/verify-otp"]
        A4["/register"]
        A5["/forgot-password/*"]
        A6["/login"]
        A7["/google/url"]
        A8["/google/callback"]
        A9["/refresh"]
    end

    subgraph Authorize["Authorize Bearer"]
        B1["/logout"]
        B2["/change-password"]
        B3["/upload-avatar"]
        B4["/me"]
    end
```
