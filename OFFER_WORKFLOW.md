# LUỒNG OFFER (OFFER WORKFLOW) - RECRUITMENT MANAGEMENT SYSTEM

---

## 📋 TỔNG QUAN

Luồng Offer là quy trình tạo, phê duyệt và gửi thư mời làm việc (Offer Letter) cho ứng viên sau khi họ vượt qua các vòng phỏng vấn.

---

## 🎯 CÁC VAI TRÒ THAM GIA

1. **HR Staff** - Nhân viên HR
2. **HR Manager** - Quản lý HR
3. **Director** - Giám đốc
4. **Candidate** - Ứng viên

---

## 📊 CÁC TRẠNG THÁI (STATUS)

| Status ID | Code | Tên | Mô tả |
|-----------|------|-----|-------|
| 14 | DRAFT | Nháp | Offer đang được soạn thảo |
| 15 | IN_REVIEW | Đang duyệt | Chờ Director phê duyệt |
| 16 | APPROVED | Đã duyệt | Director đã phê duyệt |
| 17 | REJECTED | Bị từ chối | Director từ chối offer |
| 18 | SENT | Đã gửi | Đã gửi cho ứng viên |
| 19 | ACCEPTED | Đã chấp nhận | Ứng viên chấp nhận offer |
| 20 | DECLINED | Đã từ chối | Ứng viên từ chối offer |
| 21 | NEGOTIATING | Đang thương lượng | Ứng viên yêu cầu thương lượng |
| 24 | PENDING_HR_MANAGER | Chờ HR Manager | Chờ HR Manager chuyển cho Director |

---

## 🔄 WORKFLOW CHI TIẾT

### **STAGE 1: CREATE OFFER (HR Staff/Manager)**

```
┌─────────────────────────────────────────────────────────┐
│  HR Staff/Manager creates new Offer                     │
│  - Select Candidate (from Application passed Interview)│
│  - Select Job Request                                   │
│  - Enter Proposed Salary                                │
│  - Enter Benefits                                       │
│  - Select Start Date                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
                 Status: DRAFT (14)
```

**API Endpoint:**
- `POST /api/hr/offers`
- Body: `CreateOfferDto`

**Dữ liệu Offer:**
- ApplicationId
- CandidateId
- JobRequestId
- ProposedSalary
- Benefits
- StartDate
- CreatedBy (HR User ID)

---

### **STAGE 2: EDIT & SUBMIT (HR)**

```
┌─────────────────────────────────────────────────────────┐
│  HR can edit Offer when status is DRAFT                │
│  - Update Salary, Benefits, Start Date                  │
│  - After completion → Submit for Review                 │
└─────────────────────────────────────────────────────────┘
                        ↓
         DRAFT (14) → IN_REVIEW (15)
```

**API Endpoints:**
- `PUT /api/hr/offers/{id}` - Update offer details
- `PUT /api/hr/offers/{id}/submit` - Submit for review

**Lưu ý:**
- Chỉ có thể chỉnh sửa khi status = DRAFT hoặc IN_REVIEW
- Khi submit, status chuyển từ DRAFT → IN_REVIEW

---

### **STAGE 3: APPROVAL (Director)**

```
┌─────────────────────────────────────────────────────────┐
│  Director reviews pending Offers                        │
│  - View Offer details (Salary, Benefits, Candidate)    │
│  - View Candidate info (CV, Interview Feedback)        │
│  - Decision: APPROVE or REJECT                          │
└─────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────┴──────────────┐
         ↓                              ↓
    APPROVED (16)                  REJECTED (17)
    [Continue]                     [End]
```

**API Endpoints:**
- `GET /api/director/offers/pending` - Danh sách offer chờ duyệt
- `GET /api/director/offers/{id}` - Chi tiết offer
- `POST /api/director/offers/{id}/approve` - Phê duyệt
- `POST /api/director/offers/{id}/reject` - Từ chối

**Dữ liệu OfferApproval:**
- OfferId
- ApproverId (Director ID)
- Decision (APPROVED/REJECTED)
- Comment (Lý do)
- ApprovedAt (Thời gian)

---

### **STAGE 4: SEND TO CANDIDATE (HR Staff)**

```
┌─────────────────────────────────────────────────────────┐
│  HR Staff sends approved Offer to Candidate             │
│  - System sends Email notification                      │
│  - Candidate receives link to view Offer Letter         │
└─────────────────────────────────────────────────────────┘
                        ↓
         APPROVED (16) → SENT (18)
```

**API Endpoint:**
- `PUT /api/hr/offers/{id}/send`

**Email Notification:**
- Gửi đến Candidate Email
- Nội dung: Thông báo nhận được Offer Letter
- Link: Xem chi tiết Offer trên hệ thống

---

### **STAGE 5: CANDIDATE RESPONSE (Candidate)**

```
┌─────────────────────────────────────────────────────────┐
│  Candidate logs in and views Offer                      │
│  - View details: Salary, Benefits, Start Date           │
│  - Choose 1 of 3 actions:                               │
│    1. ACCEPT - Accept the offer                         │
│    2. NEGOTIATE - Request negotiation                   │
│    3. REJECT - Decline the offer                        │
└─────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓               ↓
    ACCEPTED (19)  NEGOTIATING (21)  DECLINED (20)
```

**API Endpoint:**
- `GET /api/candidate/offers` - Danh sách offer của mình
- `GET /api/candidate/offers/{id}` - Chi tiết offer
- `PUT /api/candidate/offers/{id}/respond` - Phản hồi offer

**Request Body (CandidateRespondDto):**
```json
{
  "Response": "ACCEPT" | "NEGOTIATE" | "REJECT",
  "Comment": "Lý do hoặc yêu cầu thương lượng"
}
```

---

### **STAGE 6A: CANDIDATE ACCEPTS (ACCEPTED)**

```
┌─────────────────────────────────────────────────────────┐
│  Candidate accepts Offer                                │
│  - System sends Email notification to HR Staff          │
│  - HR Staff views list of Accepted Offers               │
│  - HR Staff sends list to HR Manager                    │
└─────────────────────────────────────────────────────────┘
                        ↓
              ACCEPTED (19)
                        ↓
         ┌──────────────────────────────┐
         │  HR Staff Actions:            │
         │  - View accepted list         │
         │  - Select multiple offers     │
         │  - Send to HR Manager         │
         │  (SentToManagerAt = now)      │
         └──────────────────────────────┘
                        ↓
         HR Manager receives Email notification
         and views list on system
```

**API Endpoints:**
- `GET /api/hr/offers/accepted-for-staff` - HR Staff xem accepted offers (chưa gửi Manager)
- `POST /api/hr/offers/send-accepted-to-manager` - Gửi danh sách cho Manager
- `GET /api/hr/offers/accepted-for-manager` - HR Manager xem accepted offers (đã được gửi)

**Email Notifications:**
1. **Cho HR Staff:** Khi candidate accept
2. **Cho HR Manager:** Khi HR Staff gửi danh sách accepted offers

---

### **STAGE 6B: CANDIDATE REQUESTS NEGOTIATION (NEGOTIATING)**

```
┌─────────────────────────────────────────────────────────┐
│  Candidate requests negotiation                         │
│  - Send Comment about request (salary, benefits, etc.)  │
│  - Status changes to NEGOTIATING                        │
└─────────────────────────────────────────────────────────┘
                        ↓
              NEGOTIATING (21)
                        ↓
┌─────────────────────────────────────────────────────────┐
│  HR Staff/Manager handles negotiation                   │
│  - View Candidate's request                             │
│  - Edit Offer (Salary, Benefits, Start Date)            │
│  - Save edit history (OfferEditHistory)                 │
│  - 2 options:                                            │
│    A. Resend to Candidate (if minor changes)            │
│    B. Send to HR Manager → Director (if major changes)  │
└─────────────────────────────────────────────────────────┘
```

#### **Flow A: Resend directly to Candidate**

```
NEGOTIATING (21) → SENT (18)
- HR updates Offer
- Resend Email to Candidate
- Candidate reviews and responds
```

**API Endpoint:**
- `PUT /api/hr/offers/{id}/negotiation` - Update và resend

#### **Flow B: Send to HR Manager → Director re-approval**

```
NEGOTIATING (21) 
    ↓ (HR Staff submits)
PENDING_HR_MANAGER (24)
    ↓ (HR Manager forwards)
IN_REVIEW (15)
    ↓ (Director approves)
APPROVED (16)
    ↓ (HR sends)
SENT (18)
```

**API Endpoints:**
- `PUT /api/hr/offers/{id}/save-negotiation` - Lưu thay đổi (vẫn NEGOTIATING)
- `PUT /api/hr/offers/{id}/submit-to-manager` - Gửi cho HR Manager
- `PUT /api/hr/offers/{id}/forward-to-director` - HR Manager chuyển Director

**OfferEditHistory Table:**
- Lưu lại mỗi lần chỉnh sửa Offer
- Ghi nhận: EditedBy, EditedAt, Salary, Benefits, StartDate
- Dùng để audit trail và theo dõi lịch sử thương lượng

---

### **STAGE 6C: CANDIDATE DECLINES (DECLINED)**

```
┌─────────────────────────────────────────────────────────┐
│  Candidate declines Offer                               │
│  - Send Comment about reason for declining              │
│  - Status changes to DECLINED                           │
│  - HR views list of declined offers                     │
└─────────────────────────────────────────────────────────┘
                        ↓
              DECLINED (20)
              [End]
```

**API Endpoint:**
- `GET /api/hr/offers/declined` - Xem danh sách declined offers

---

## 📈 WORKFLOW OVERVIEW DIAGRAM

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  DRAFT (14) │ ← HR creates Offer
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │ IN_REVIEW   │ ← HR submits
                    │    (15)     │
                    └──────┬──────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       ┌─────────────┐          ┌─────────────┐
       │ APPROVED    │          │  REJECTED   │
       │    (16)     │          │    (17)     │
       └──────┬──────┘          └─────────────┘
              ↓                        ↓
       ┌─────────────┐              [END]
       │  SENT (18)  │ ← HR sends to Candidate
       └──────┬──────┘
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
┌────────┐ ┌────────┐ ┌────────┐
│ACCEPTED│ │NEGOTIA-│ │DECLINED│
│  (19)  │ │TING(21)│ │  (20)  │
└────┬───┘ └────┬───┘ └────────┘
     ↓          ↓           ↓
  [SUCCESS]     │        [END]
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
┌────────┐          ┌──────────────┐
│ SENT   │          │PENDING_HR_   │
│  (18)  │          │MANAGER (24)  │
└────────┘          └──────┬───────┘
                           ↓
                    ┌─────────────┐
                    │ IN_REVIEW   │
                    │    (15)     │
                    └─────────────┘
                    [Back to cycle]
```

---

## 🔐 PHÂN QUYỀN (AUTHORIZATION)

### HR Staff (HR_STAFF)
✅ Tạo Offer mới  
✅ Chỉnh sửa Offer (DRAFT, IN_REVIEW)  
✅ Submit Offer for Review  
✅ Gửi Offer cho Candidate (APPROVED → SENT)  
✅ Xem danh sách Accepted Offers  
✅ Gửi danh sách Accepted cho HR Manager  
✅ Xử lý Negotiation (update & resend)  
✅ Submit Negotiation to Manager  

### HR Manager (HR_MANAGER)
✅ Tất cả quyền của HR Staff  
✅ Approve/Reject Offer (nếu có workflow nội bộ)  
✅ Xem danh sách Accepted Offers từ Staff  
✅ Forward Negotiation Offer to Director  
✅ Xem Offer Edit History  

### Director (DIRECTOR)
✅ Xem danh sách Pending Offers  
✅ Xem chi tiết Offer  
✅ Approve Offer  
✅ Reject Offer  
✅ Xem Approval History  

### Candidate (CANDIDATE)
✅ Xem danh sách Offers của mình  
✅ Xem chi tiết Offer  
✅ Accept Offer  
✅ Negotiate Offer  
✅ Decline Offer  

---

## 📧 EMAIL NOTIFICATIONS

### 1. Offer Sent to Candidate
**Trigger:** HR gửi Offer (APPROVED → SENT)  
**Recipient:** Candidate  
**Content:**
- Thông báo nhận được Offer Letter
- Link xem chi tiết Offer
- Hướng dẫn cách phản hồi

### 2. Candidate Accepted Offer
**Trigger:** Candidate accept offer  
**Recipient:** HR Staff (người tạo offer)  
**Content:**
- Thông báo Candidate đã chấp nhận
- Link xem chi tiết Offer
- Hướng dẫn bước tiếp theo

### 3. Accepted Offers List to HR Manager
**Trigger:** HR Staff gửi danh sách accepted offers  
**Recipient:** HR Manager(s)  
**Content:**
- Danh sách Candidates đã chấp nhận Offer
- Thông tin: Tên, Vị trí, Phòng ban, Lương
- Link xem chi tiết trên hệ thống

### 4. Offer Approved by Director
**Trigger:** Director approve offer  
**Recipient:** HR Staff/Manager  
**Content:**
- Thông báo Offer đã được phê duyệt
- Link xem chi tiết
- Hướng dẫn gửi cho Candidate

### 5. Offer Rejected by Director
**Trigger:** Director reject offer  
**Recipient:** HR Staff/Manager  
**Content:**
- Thông báo Offer bị từ chối
- Lý do từ chối (Comment)
- Hướng dẫn chỉnh sửa và submit lại

---

## 💾 DATABASE SCHEMA

### Offers Table
```sql
CREATE TABLE Offers (
    Id INT IDENTITY PRIMARY KEY,
    ApplicationId INT NULL,
    CandidateId INT NULL,
    JobRequestId INT NULL,
    ProposedSalary DECIMAL(18,2) NULL,
    Benefits NVARCHAR(MAX) NULL,
    StartDate DATE NULL,
    StatusId INT NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy INT NULL,
    UpdatedAt DATETIME NULL,
    SentAt DATETIME NULL,
    SentToManagerAt DATETIME NULL,
    CandidateResponse VARCHAR(50) NULL,
    CandidateRespondedAt DATETIME NULL,
    CandidateComment NVARCHAR(500) NULL,
    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME NULL,
    DeletedBy INT NULL,
    
    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    FOREIGN KEY (CandidateId) REFERENCES Candidates(Id),
    FOREIGN KEY (JobRequestId) REFERENCES JobRequests(Id),
    FOREIGN KEY (StatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);
```

### OfferApprovals Table
```sql
CREATE TABLE OfferApprovals (
    Id INT IDENTITY PRIMARY KEY,
    OfferId INT NOT NULL,
    ApproverId INT NOT NULL,
    Decision VARCHAR(50) NOT NULL, -- APPROVED, REJECTED
    Comment NVARCHAR(500) NULL,
    ApprovedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (OfferId) REFERENCES Offers(Id),
    FOREIGN KEY (ApproverId) REFERENCES Users(Id)
);
```

### OfferEditHistory Table
```sql
CREATE TABLE OfferEditHistory (
    Id INT IDENTITY PRIMARY KEY,
    OfferId INT NOT NULL,
    EditedBy INT NOT NULL,
    EditedAt DATETIME DEFAULT GETDATE(),
    Salary DECIMAL(18,2) NULL,
    Benefits NVARCHAR(MAX) NULL,
    StartDate DATE NULL,
    
    FOREIGN KEY (OfferId) REFERENCES Offers(Id),
    FOREIGN KEY (EditedBy) REFERENCES Users(Id)
);
```

---

## 🎯 BUSINESS RULES

### 1. Tạo Offer
- Chỉ tạo Offer cho Application đã Pass Interview
- Một Application có thể có nhiều Offer (nếu negotiate nhiều lần)
- Salary phải > 0
- Start Date phải >= ngày hiện tại

### 2. Chỉnh sửa Offer
- Chỉ chỉnh sửa được khi Status = DRAFT hoặc IN_REVIEW
- Khi ở trạng thái NEGOTIATING, mỗi lần sửa phải lưu vào OfferEditHistory
- Không thể sửa Offer đã SENT, ACCEPTED, DECLINED

### 3. Phê duyệt Offer
- Chỉ Director mới có quyền Approve/Reject
- Phải có Comment khi Reject
- Một Offer chỉ cần 1 lần approve từ Director

### 4. Gửi Offer
- Chỉ gửi được khi Status = APPROVED
- Sau khi gửi, Status chuyển sang SENT
- Ghi nhận thời gian gửi (SentAt)
- Gửi Email notification cho Candidate

### 5. Candidate Response
- Chỉ phản hồi được khi Status = SENT hoặc NEGOTIATING
- Mỗi Offer chỉ được phản hồi 1 lần (trừ khi negotiate)
- Ghi nhận: Response, Comment, RespondedAt

### 6. Negotiation
- Khi Candidate chọn NEGOTIATE, Status → NEGOTIATING
- HR có thể update Offer và resend
- Mỗi lần update phải lưu vào OfferEditHistory
- Nếu thay đổi lớn (>20% salary), phải gửi Director duyệt lại

### 7. Accepted Offers
- HR Staff xem danh sách Accepted (SentToManagerAt = NULL)
- HR Staff chọn nhiều Offers và gửi cho HR Manager
- Sau khi gửi, SentToManagerAt = GETDATE()
- HR Manager xem danh sách (SentToManagerAt != NULL)

---

## 📊 REPORTS & STATISTICS

### 1. Offer Statistics
- Tổng số Offers theo Status
- Tỷ lệ Accept/Decline
- Thời gian trung bình từ Send → Response
- Số lần Negotiate trung bình

### 2. Salary Analysis
- Mức lương trung bình theo Position
- Mức lương min/max theo Department
- Tỷ lệ negotiate salary thành công

### 3. Approval Time
- Thời gian trung bình Director approve
- Số Offers bị reject và lý do
- Bottleneck trong workflow

---

## 🚀 API ENDPOINTS SUMMARY

### HR Endpoints
```
GET    /api/hr/offers                      - Tất cả offers
GET    /api/hr/offers/pending              - Offers chờ duyệt
GET    /api/hr/offers/approved             - Offers đã duyệt
GET    /api/hr/offers/accepted-for-staff   - Accepted (chưa gửi Manager)
GET    /api/hr/offers/accepted-for-manager - Accepted (đã gửi Manager)
GET    /api/hr/offers/declined             - Offers bị từ chối
GET    /api/hr/offers/negotiating          - Offers đang thương lượng
GET    /api/hr/offers/pending-hr-manager   - Chờ HR Manager
GET    /api/hr/offers/edited               - Offers đã chỉnh sửa
GET    /api/hr/offers/{id}                 - Chi tiết offer
GET    /api/hr/offers/by-application/{id}  - Offer theo application

POST   /api/hr/offers                      - Tạo offer mới
PUT    /api/hr/offers/{id}                 - Update offer
PUT    /api/hr/offers/{id}/status          - Update status
PUT    /api/hr/offers/{id}/submit          - Submit for review
PUT    /api/hr/offers/{id}/send            - Gửi cho candidate
PUT    /api/hr/offers/{id}/negotiation     - Update sau negotiate
PUT    /api/hr/offers/{id}/save-negotiation - Lưu thay đổi negotiate
PUT    /api/hr/offers/{id}/submit-to-manager - Gửi HR Manager
PUT    /api/hr/offers/{id}/forward-to-director - Chuyển Director

POST   /api/hr/offers/send-accepted-to-manager - Gửi danh sách accepted
```

### Director Endpoints
```
GET    /api/director/offers/pending        - Offers chờ duyệt
GET    /api/director/offers/{id}           - Chi tiết offer
POST   /api/director/offers/{id}/approve   - Phê duyệt
POST   /api/director/offers/{id}/reject    - Từ chối
```

### Candidate Endpoints
```
GET    /api/candidate/offers               - Offers của mình
GET    /api/candidate/offers/{id}          - Chi tiết offer
PUT    /api/candidate/offers/{id}/respond  - Phản hồi offer
```

---

## 🎨 UI/UX FLOW

### HR Dashboard
1. **Offers List** - Danh sách tất cả offers với filter theo status
2. **Create Offer** - Form tạo offer mới
3. **Offer Detail** - Xem chi tiết, edit, submit, send
4. **Accepted Offers** - Danh sách accepted, chọn và gửi Manager
5. **Negotiating Offers** - Xử lý thương lượng, xem history

### Director Dashboard
1. **Pending Offers** - Danh sách offers chờ duyệt
2. **Offer Detail** - Xem chi tiết candidate, interview feedback
3. **Approve/Reject** - Form phê duyệt với comment

### Candidate Portal
1. **My Offers** - Danh sách offers nhận được
2. **Offer Detail** - Xem chi tiết salary, benefits, start date
3. **Respond** - Form phản hồi (Accept/Negotiate/Decline)

---

## ✅ CHECKLIST IMPLEMENTATION

### Backend
- [x] Entity Models (Offer, OfferApproval, OfferEditHistory)
- [x] Repository Layer (CRUD operations)
- [x] Service Layer (Business logic)
- [x] Controllers (HR, Director, Candidate)
- [x] DTOs (Request/Response models)
- [x] Email Service (Notifications)
- [x] Authorization (Role-based access)
- [x] Workflow Validation
- [x] Status Transitions
- [x] Audit Trail (Edit History)

### Frontend
- [x] HR Offers List Page
- [x] Create/Edit Offer Form
- [x] Offer Detail Page
- [x] Accepted Offers Management
- [x] Negotiation Handling
- [x] Director Approval Page
- [x] Candidate Offer Portal
- [x] Email Templates
- [x] Notifications (Toast)
- [x] Loading States & Error Handling

### Database
- [x] Offers Table
- [x] OfferApprovals Table
- [x] OfferEditHistory Table
- [x] Status Seeds (14-21, 24)
- [x] Indexes
- [x] Foreign Keys
- [x] Migration Scripts

---

## 🎓 KẾT LUẬN

Luồng Offer trong RMS là một quy trình phức tạp với nhiều bước và vai trò tham gia. Hệ thống đã implement đầy đủ các tính năng:

✅ **Workflow hoàn chỉnh** từ tạo → duyệt → gửi → phản hồi  
✅ **Negotiation support** với edit history tracking  
✅ **Multi-level approval** (HR Manager → Director)  
✅ **Email notifications** tự động  
✅ **Audit trail** đầy đủ  
✅ **Role-based access control** chặt chẽ  

Đây là một trong những module quan trọng nhất của hệ thống, đảm bảo quy trình tuyển dụng được hoàn tất một cách chuyên nghiệp và minh bạch.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** RMS Development Team
