# HR System - Phân Tích Quyền Hạn & Chức Năng

## 📋 **Tổng Quan**

Hệ thống HR được thiết kế dựa trên workflow thực tế từ database, phân tách rõ ràng giữa:
- **HR Manager**: Strategic oversight + Approval authority (View + Approve + Reject)
- **HR Staff**: Operational tasks (View + Update Status + Send)

### **Kiến Trúc Hệ Thống**
- **Shared Pages**: Applications, Interviews, Offers - Cùng UI, khác quyền
- **Separate Pages**: Dashboard (Manager only), Job Postings (Staff only), Job Requests (Manager only)
- **Authorization**: Backend controller + Frontend UI conditional rendering

---

## 🔐 **HR MANAGER (Role ID: 3)**

### **Quyền Phê Duyệt (Approval Authority)**

#### 1️⃣ **Recruitment Request Workflow**
```
SUBMITTED (2) → IN_REVIEW (3)     [Tiếp nhận yêu cầu]
IN_REVIEW (3) → IN_REVIEW (3)     [Duyệt trung gian]
IN_REVIEW (3) → REJECTED (5)      [Từ chối]
```
**Vai trò**: Xem xét và phê duyệt yêu cầu tuyển dụng từ các phòng ban trước khi chuyển lên Director

#### 2️⃣ **Job Posting Workflow**
```
PUBLISHED (7) → CLOSED (8)        [Đóng tin tuyển dụng]
```
**Vai trò**: Đóng tin tuyển dụng khi đã tuyển đủ hoặc hủy bỏ

#### 3️⃣ **Application Workflow**
```
INTERVIEWING (11) → REJECTED (13) [Từ chối ứng viên]
```
**Vai trò**: Quyết định loại ứng viên không phù hợp sau phỏng vấn

#### 4️⃣ **Offer Workflow**
```
IN_REVIEW (15) → IN_REVIEW (15)   [Duyệt trung gian]
IN_REVIEW (15) → REJECTED (17)    [Từ chối offer]
```
**Vai trò**: Xem xét offer package trước khi Director phê duyệt cuối

---

### **Chức Năng Dashboard**

#### **Statistics Cards**
- Pending Job Requests
- Total Applications (với breakdown: screening/interviewing)
- Upcoming Interviews
- Pending Offers

#### **Recruitment Funnel**
Hiển thị pipeline từ Job Requests → Applications → Screening → Interviewing → Offers

#### **Recent Job Requests**
Top 5 yêu cầu tuyển dụng đang chờ duyệt với:
- Priority badge (Urgent/High/Normal)
- Department info
- Time ago format

#### **Upcoming Interviews**
Top 5 cuộc phỏng vấn sắp tới

#### **Pending Offers**
Grid 6 offers đang chờ duyệt với salary display

#### **Key Responsibilities Cards**
4 cards giải thích vai trò:
- Job Request Approval
- Offer Management
- Job Posting Control
- Rejection Authority

---

### **Menu Items**
```
HR Manager
├── Dashboard              [/staff/hr-manager]          ← Manager only
├── Job Requests          [/staff/hr-manager/job-requests] ← Manager only
├── Applications          [/staff/hr-manager/applications] ← Manager only (show in menu)
├── Interviews            [/staff/hr-manager/interviews]   ← Manager only (show in menu)
└── Offers                [/staff/hr-manager/offers]       ← Manager only (show in menu)

━━━ Divider ━━━

Shared Operations (HR Manager + HR Staff can access)
├── Applications          [Shared route, different permissions]
├── Interviews            [Shared route, different permissions]
└── Offers                [Shared route, different permissions]
```

### **Detailed Permissions per Feature**

#### **Applications Page**
| Feature | HR_MANAGER | HR_STAFF |
|---------|------------|----------|
| View list | ✅ All statuses | ✅ All statuses |
| View detail | ✅ Full access | ✅ Full access |
| Filter by status | ✅ Yes | ✅ Yes |
| Screen (APPLIED→SCREENING) | ✅ Yes | ✅ Yes |
| Move to Interview (SCREENING→INTERVIEWING) | ✅ Yes | ✅ Yes |
| Reject (any→REJECTED) | ✅ Yes | ❌ No |
| Update status button | ✅ All transitions | ✅ Forward only |
| Schedule interview | ✅ Yes | ✅ Yes |
| Create offer | ✅ Yes | ✅ Yes (draft) |

#### **Interviews Page**
| Feature | HR_MANAGER | HR_STAFF |
|---------|------------|----------|
| View list | ✅ All | ✅ All |
| Filter upcoming/all | ✅ Yes | ✅ Yes |
| Schedule new | ✅ Yes | ✅ Yes |
| Update time/location | ✅ Yes | ✅ Yes |
| Cancel interview | ✅ Yes | ❌ No |
| View candidate info | ✅ Yes | ✅ Yes |

#### **Offers Page**
| Feature | HR_MANAGER | HR_STAFF |
|---------|------------|----------|
| View list | ✅ All | ✅ All |
| Filter pending/all | ✅ Yes | ✅ Yes |
| Create draft | ✅ Yes | ✅ Yes |
| Submit for review (DRAFT→IN_REVIEW) | ✅ Yes | ✅ Yes |
| Approve (IN_REVIEW→APPROVED) | ✅ Yes | ❌ No |
| Reject (IN_REVIEW→REJECTED) | ✅ Yes | ❌ No |
| Send to candidate (APPROVED→SENT) | ❌ No | ✅ Yes |
| View salary details | ✅ Yes | ✅ Yes |

---

## 🛠️ **HR STAFF (Role ID: 4)**

### **Quyền Thao Tác (Operational Authority)**

#### 1️⃣ **Job Posting Workflow**
```
DRAFT (6) → PUBLISHED (7)         [Đăng tin tuyển dụng]
```
**Vai trò**: Tạo và đăng tin tuyển dụng sau khi Job Request được approved

#### 2️⃣ **Application Workflow**
```
APPLIED (9) → SCREENING (10)      [Sàng lọc hồ sơ]
SCREENING (10) → INTERVIEWING (11) [Chuyển sang phỏng vấn]
```
**Vai trò**: Sàng lọc CV, chuyển ứng viên phù hợp sang phỏng vấn

#### 3️⃣ **Offer Workflow**
```
DRAFT (14) → IN_REVIEW (15)       [Gửi offer lên duyệt]
APPROVED (16) → SENT (18)         [Gửi offer cho ứng viên]
```
**Vai trò**: Tạo offer package và gửi cho ứng viên sau khi được approved

---

### **Đặc Điểm**

- ❌ **KHÔNG có Dashboard riêng**
- ❌ **KHÔNG có Job Requests menu** (không cần xem yêu cầu từ departments)
- ✅ **Có Job Postings menu riêng** (tạo và publish tin tuyển dụng)
- ✅ **Truy cập Shared Operations** (Applications, Interviews, Offers với quyền hạn chế)
- ✅ **Redirect về `/staff/hr-staff/job-postings` khi đăng nhập**

### **Menu Items**
```
HR Staff
└── Job Postings          [/staff/hr-staff/job-postings] ← Staff only

━━━ Divider ━━━

Shared Operations (HR Manager + HR Staff)
├── Applications          [/staff/hr-manager/applications] ← Different permissions
├── Interviews            [/staff/hr-manager/interviews]   ← Different permissions
└── Offers                [/staff/hr-manager/offers]       ← Different permissions
```

### **Operational Focus**

#### **Primary Responsibilities**
1. **Job Postings Management**
   - Create job postings from approved requests
   - Publish to job boards (DRAFT → PUBLISHED)
   - Monitor application flow

2. **Application Screening**
   - Review incoming CVs (APPLIED → SCREENING)
   - Filter qualified candidates
   - Move to interview stage (SCREENING → INTERVIEWING)

3. **Interview Coordination**
   - Schedule interviews with candidates
   - Coordinate with interviewers (dept managers)
   - Update meeting details and locations

4. **Offer Processing**
   - Create draft offers
   - Send approved offers to candidates (APPROVED → SENT)
   - Track candidate responses

---

## 🎯 **So Sánh HR Manager vs HR Staff**

| Tiêu chí | HR Manager | HR Staff |
|----------|------------|----------|
| **Dashboard** | ✅ Strategic overview with stats | ❌ Không có |
| **Job Request** | ✅ View + Approve/Reject | ❌ Không truy cập |
| **Job Posting** | ✅ View + Close postings | ✅ Create + Publish drafts |
| **Applications** | ✅ View + Screen + Reject | ✅ View + Screen forward |
| **Interviews** | ✅ View + Schedule + Cancel | ✅ View + Schedule + Update |
| **Offers** | ✅ View + Approve/Reject | ✅ View + Create + Send approved |
| **UI Access** | Dedicated menu + Shared pages | Shared pages only |
| **Authorization** | Full CRUD | Limited updates |
| **Login Redirect** | `/staff/hr-manager` | `/staff/hr-staff/job-postings` |

---

## 🔄 **Workflow Summary**

### **Job Request Flow**
```
Department Manager → [DRAFT → SUBMITTED]
HR Manager        → [SUBMITTED → IN_REVIEW → (IN_REVIEW)]
Director          → [IN_REVIEW → APPROVED/REJECTED]
```

### **Job Posting Flow**
```
HR Staff          → [DRAFT → PUBLISHED]
HR Manager        → [PUBLISHED → CLOSED]
```

### **Application Flow**
```
Candidate         → [APPLIED]
HR Staff          → [APPLIED → SCREENING → INTERVIEWING]
Interviewer       → [INTERVIEWING → PASSED]
HR Manager        → [INTERVIEWING → REJECTED]
```

### **Offer Flow**
```
HR Staff          → [DRAFT → IN_REVIEW]
HR Manager        → [IN_REVIEW → (IN_REVIEW) / REJECTED]
Director          → [IN_REVIEW → APPROVED]
HR Staff          → [APPROVED → SENT]
Candidate         → [SENT → ACCEPTED/DECLINED]
```

---

## 📁 **File Structure**

### **Frontend**
```
src/
├── services/
│   └── hrService.js                         ✅ API service layer
├── pages/
│   └── hr/
│       ├── HRManagerDashboard.jsx           ✅ Dashboard (Manager only)
│       └── manager/
│           ├── HRJobRequestList.jsx         ✅ Manager only
│           ├── HRJobRequestDetail.jsx       ✅ Manager only
│           ├── HRApplicationList.jsx        ✅ Shared (different permissions)
│           ├── HRApplicationDetail.jsx      ✅ Shared (conditional buttons)
│           ├── HRInterviewList.jsx          ✅ Shared (different permissions)
│           └── HROfferList.jsx              ✅ Shared (different permissions)
│       └── staff/
│           └── HRJobPostingList.jsx         ✅ Staff only
└── layouts/
    └── MainLayout/
        └── MainLayout.jsx                   ✅ Sidebar with role filtering + divider
```

### **Backend**
```
Backend/
└── Controller/
    └── HRController.cs                 ✅ API endpoints with authorization
```

---

## 🚀 **API Endpoints**

### **Statistics (HR Manager Only)**
- `GET /api/hr/statistics/dashboard` - Dashboard stats
- `GET /api/hr/statistics/funnel` - Recruitment funnel data

### **Job Requests**
- `GET /api/hr/job-requests` - All job requests
- `GET /api/hr/job-requests/pending` - Pending only
- `GET /api/hr/job-requests/{id}` - Details
- `PUT /api/hr/job-requests/{id}/status` - Update status (HR Manager only)

### **Job Postings**
- `GET /api/hr/job-postings` - All postings
- `GET /api/hr/job-postings/drafts` - Drafts (HR Staff)
- `POST /api/hr/job-postings` - Create
- `PUT /api/hr/job-postings/{id}/publish` - Publish (HR Staff only)
- `PUT /api/hr/job-postings/{id}/close` - Close (HR Manager only)

### **Applications**
- `GET /api/hr/applications` - All with optional status filter
- `GET /api/hr/applications/{id}` - Details
- `PUT /api/hr/applications/{id}/status` - Update status

### **Interviews**
- `GET /api/hr/interviews` - All interviews
- `GET /api/hr/interviews/upcoming` - Upcoming only
- `POST /api/hr/interviews` - Schedule new
- `PUT /api/hr/interviews/{id}` - Update

### **Offers**
- `GET /api/hr/offers` - All offers
- `GET /api/hr/offers/pending` - In review
- `GET /api/hr/offers/approved` - Approved (HR Staff)
- `POST /api/hr/offers` - Create
- `PUT /api/hr/offers/{id}/submit` - Submit for review (HR Staff)
- `PUT /api/hr/offers/{id}/status` - Update status (HR Manager)
- `PUT /api/hr/offers/{id}/send` - Send to candidate (HR Staff)

---

## ✅ **Implementation Status**

### **Completed - Backend**
- ✅ HRRepository.cs với đầy đủ CRUD methods
- ✅ HRService.cs business logic layer
- ✅ HRController.cs với authorization attributes
- ✅ HRDtos.cs với 15+ DTOs
- ✅ Program.cs DI registration
- ✅ Entity property mappings (Cvprofile, Interview, Offer)
- ✅ StatusHistory tracking

### **Completed - Frontend**
- ✅ hrService.js với tất cả endpoints
- ✅ HRManagerDashboard.jsx với stats + funnel
- ✅ HRJobRequestList.jsx + HRJobRequestDetail.jsx
- ✅ HRApplicationList.jsx + HRApplicationDetail.jsx (với status update modal)
- ✅ HRInterviewList.jsx (với TODAY/TOMORROW badges)
- ✅ HROfferList.jsx (với pending review highlighting)
- ✅ HRJobPostingList.jsx (Staff only)
- ✅ App.jsx routing với shared routes
- ✅ MainLayout.jsx với divider + shared menu
- ✅ Removed old hardcoded pages (Candidates, Interviews, MailHistory)

### **Todo - Authorization Logic**
- ⏳ Conditional UI rendering based on user role
- ⏳ Disable reject button for HR_STAFF in ApplicationDetail
- ⏳ Hide cancel button for HR_STAFF in InterviewList
- ⏳ Hide approve/reject for HR_STAFF in OfferList
- ⏳ Show "Send Offer" button only for APPROVED offers (HR_STAFF)

### **Todo - Additional Features**
- ⏳ Interview detail page (feedback, participants)
- ⏳ Offer detail page (full terms, approval history)
- ⏳ Create interview modal/form
- ⏳ Create offer modal/form
- ⏳ Email notification system
- ⏳ File upload for CVs

---

## 🎓 **Key Learnings**

1. **Priority ≠ Status**: Priority (1/2/3) là urgency của task, không phải thứ tự approval
2. **Multi-level approval**: Cùng status IN_REVIEW, nhiều người duyệt, track bằng StatusHistory
3. **Role-based workflow**: WorkflowTransitions table định nghĩa chính xác ai làm được gì
4. **Separation of concerns**: Manager = strategy + approval, Staff = operations
5. **Dashboard necessity**: Staff roles không cần dashboard nếu chỉ làm operational tasks
6. **Shared UI, Different Permissions**: Applications/Interviews/Offers dùng chung component, khác logic authorization
7. **Entity Navigation**: Application.Cvprofile.Candidate (không phải Application.Candidate trực tiếp)
8. **Interview Schema**: Sử dụng StartTime/EndTime thay vì ScheduledAt, không có InterviewType/InterviewerId
9. **Offer Schema**: Chỉ có ProposedSalary, không có StartDate/ProbationPeriod/Benefits trong database
10. **Menu Organization**: Divider giúp phân tách rõ dedicated menus vs shared operations

---

**Generated**: 2026-01-31  
**Version**: 1.0  
**Status**: Implemented & Documented
