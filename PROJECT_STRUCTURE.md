# Cấu trúc dự án RMS (Recruitment Management System)

## Tổng quan

Dự án RMS là hệ thống quản lý tuyển dụng với hai phần chính:
- **Backend**: ASP.NET Core 8 Web API (C#)
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: SQL Server

---

## Cấu trúc thư mục

```
RMS/
├── Backend/                 # API ASP.NET Core
├── frontend/                # Ứng dụng React
├── docker-compose.yml      # Docker deployment
├── .gitignore
├── GUIDE.md
└── PROJECT_STRUCTURE.md    # File này
```

---

## 1. Backend (ASP.NET Core)

### 1.1. Cấu trúc tổng quan

```
Backend/
├── Controller/         # API Controllers
├── Service/            # Business logic
├── Repository/         # Data access
├── Entity/             # Database models
├── Dto/                # Data Transfer Objects
├── Mapping/            # AutoMapper profiles
├── Common/             # Utilities & helpers
├── Data/               # DbContext
├── RMS_DB/             # SQL scripts
├── Properties/         # launchSettings
├── Program.cs
├── appsettings.Example.json
└── RMS.csproj
```

### 1.2. Controller (API Endpoints)

| Controller | Route | Mô tả |
|------------|-------|-------|
| AuthController | api/auth | Đăng nhập, đăng ký, OTP, Google OAuth, Forgot Password |
| AdminUserController | api/admin/users | CRUD nhân viên |
| AdminRoleController | api/admin/roles | CRUD vai trò |
| AdminDepartmentController | api/admin/departments | CRUD phòng ban |
| AdminConfigController | api/admin/config | Cấu hình hệ thống |
| AdminWorkflowController | api/admin/workflow | Quản lý workflow |
| DirectorJobRequestsController | api/director/job-requests | Duyệt yêu cầu tuyển dụng |
| DirectorOffersController | api/director/offers | Duyệt offer |
| DeptManagerJobRequestsController | api/dept-manager/job-requests | Yêu cầu tuyển dụng (Trưởng phòng) |
| DeptManagerInterviewsController | api/dept-manager/interviews | Lịch phỏng vấn |
| DeptManagerDashboardController | api/dept-manager/dashboard | Dashboard trưởng phòng |
| HRJobRequestsController | api/hr/job-requests | Yêu cầu tuyển dụng (HR) |
| HRApplicationsController | api/hr/applications | Hồ sơ ứng tuyển |
| HRInterviewsController | api/hr/interviews | Quản lý phỏng vấn |
| HROffersController | api/hr/offers | Quản lý offer |
| HRJobPostingsController | api/hr/job-postings | Tin tuyển dụng công khai |
| HRStatisticsController | api/hr/statistics | Thống kê HR |
| EmployeeInterviewsController | api/employee/interviews | Lịch phỏng vấn (Nhân viên) |
| CandidateJobPostingsController | api/candidate/job-postings | Xem tin tuyển dụng (Công khai) |
| CandidateCvProfileController | api/candidate/cv | Tạo/Sửa CV (Ứng viên) |
| DevController | api/dev | Dev utilities (hash password, v.v.) |

### 1.3. Service & Repository

- **Service**: Gọi Repository, xử lý nghiệp vụ, trả DTO
- **Repository**: Truy vấn DbContext, thao tác Entity
- Interface đặt trong `Service/Interface/` và `Repository/Interface/`

### 1.4. Entity (Database Models)

| Entity | Mô tả |
|--------|-------|
| User, Role | Người dùng nội bộ |
| Department, UserDepartment | Phòng ban |
| Candidate | Ứng viên (đăng ký từ bên ngoài) |
| Cvprofile, Cvexperience, Cveducation, Cvcertificate | CV ứng viên |
| Position, JobRequest, JobPosting | Vị trí, yêu cầu tuyển dụng, tin tuyển dụng |
| Application | Hồ sơ ứng tuyển |
| Interview, InterviewParticipant, InterviewFeedback | Phỏng vấn |
| Offer, OfferApproval | Offer và duyệt offer |
| Status, StatusType, StatusHistory | Workflow trạng thái |
| WorkflowTransition | Chuyển trạng thái |

### 1.5. RMS_DB (Scripts SQL)

| File | Mô tả |
|------|-------|
| 01_CreateDB.sql | Tạo database |
| 02_CreateTable.sql | Tạo bảng |
| 03_SeedData.sql | Dữ liệu mẫu |
| 04_UpdateSchema.sql | Cập nhật schema, migration |
| 05_AuthenticationMigration.sql | Migration authentication |
| entrypoint.sh | Script khởi tạo cho Docker |

---

## 2. Frontend (React + Vite)

### 2.1. Cấu trúc tổng quan

```
frontend/
├── src/
│   ├── App.jsx              # Routing chính
│   ├── main.jsx
│   ├── components/          # Component dùng chung
│   ├── layouts/             # Layout theo vai trò
│   ├── pages/               # Trang theo module
│   ├── routes/              # PrivateRoute, bảo vệ route
│   ├── services/            # Gọi API
│   ├── constants/           # ROLES, v.v.
│   ├── utils/               # Formatters, validators, helpers
│   ├── hooks/               # Custom hooks
│   └── styles/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile, nginx.conf
```

### 2.2. Luồng hiển thị (theo GUIDE.md)

```
Routes → Pages → Components
Pages gọi Hooks/Service để lấy dữ liệu
```

### 2.3. Phân quyền & Routing

| Vai trò | Path | Layout |
|---------|------|--------|
| CANDIDATE | /app/* | CandidateLayout |
| ADMIN | /staff/admin/* | MainLayout |
| DIRECTOR | /staff/director | MainLayout |
| HR_MANAGER | /staff/hr-manager/* | MainLayout |
| HR_STAFF | /staff/hr-staff/* | MainLayout |
| DEPARTMENT_MANAGER | /staff/dept-manager/* | MainLayout |
| EMPLOYEE | /staff/employee/* | MainLayout |

### 2.4. Trang theo module

#### Công khai
- `/` — LandingPage
- `/login` — Đăng nhập
- `/register` — Đăng ký (Ứng viên)
- `/forgot-password` — Quên mật khẩu
- `/auth/google/callback` — Callback Google OAuth

#### Candidate Portal (`/app`)
| Path | Component | Mô tả |
|------|-----------|-------|
| /app/jobs | JobBoard | Danh sách tin tuyển dụng |
| /app/jobs/:id | JobDetail | Chi tiết tin |
| /app/applications | MyApplications | Hồ sơ ứng tuyển |
| /app/profile | MyProfile | CV của tôi (tạo/sửa CV) |

#### Admin (`/staff/admin`)
- AdminDashboard, UserList, UserDetail
- RoleList, RoleDetail
- DepartmentList, DepartmentDetail
- SystemConfiguration
- WorkflowManagement

#### Director (`/staff/director`)
- DirectorDashboard
- JobRequestApprovals
- OfferApprovals

#### Department Manager (`/staff/dept-manager`)
- DeptManagerDashboard
- DeptManagerJobRequestList, Create, Detail, Edit
- DeptManagerInterviewList, Detail

#### HR Manager (`/staff/hr-manager`)
- HRManagerDashboard
- HRJobRequestList, Detail
- HRApplicationList, Detail
- HRInterviewList
- HROfferList

#### HR Staff (`/staff/hr-staff`)
- HRJobPostingList, CreateJobPosting, EditJobPosting

#### Employee (`/staff/employee`)
- EmployeeInterviewList, EmployeeInterviewDetail

### 2.5. Services (Gọi API)

| Service | Mô tả |
|---------|-------|
| api.js | Cấu hình URL, headers, helpers (get, post, put, delete) |
| authService.js | Login, Register, OTP, Forgot Password, Token |
| adminService.js | User, Role, Department, Config, Workflow |
| directorService.js | JobRequest, Offer |
| deptManagerService.js | JobRequest, Interview |
| hrService.js | JobRequest, Application, Interview, Offer, JobPosting |
| employeeService.js | Interviews |
| candidateService.js | JobPostings, CV (getMyCv, createCv, updateCv) |

---

## 3. Luồng xử lý Backend (theo GUIDE.md)

```
Controller nhận request
    → Service xử lý (qua Mapping, Dto)
    → Repository truy cập Entity, Data
    → Common hỗ trợ toàn hệ thống
```

---

## 4. Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 8, Entity Framework Core, JWT, AutoMapper |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | SQL Server |
| Auth | JWT, Google OAuth 2.0 |
| Deploy | Docker, Docker Compose, nginx |

---

## 5. Vai trò (ROLES)

```
ADMIN              — Quản trị hệ thống
DIRECTOR           — Giám đốc
HR_MANAGER         — Trưởng phòng Nhân sự
HR_STAFF           — Nhân viên Nhân sự
DEPARTMENT_MANAGER — Trưởng phòng ban
EMPLOYEE           — Nhân viên
CANDIDATE          — Ứng viên (portal riêng)
```
