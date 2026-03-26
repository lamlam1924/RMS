# Offer Function Overview - Tổng Quan Chức Năng Offer

## a. Function Overview

| Aspect | Description |
|--------|-------------|
| **Function Name** | Offer Management System |
| **Purpose** | Quản lý toàn bộ quy trình tạo, phê duyệt, gửi và theo dõi thư mời làm việc cho ứng viên |
| **Main Users** | HR Staff, HR Manager, Director, Candidate |
| **Business Value** | Tự động hóa quy trình tuyển dụng, đảm bảo tuân thủ quy trình phê duyệt, theo dõi hiệu quả tuyển dụng |

## b. User Roles & Permissions

| Role | Permissions | Key Actions |
|------|-------------|-------------|
| **HR Staff** | Create, Update (Draft/In-Review), Send, Handle Negotiation | - Tạo offer cho ứng viên<br>- Gửi offer đã được duyệt<br>- Xử lý đàm phán với ứng viên<br>- Gửi danh sách offer đã chấp nhận cho Manager |
| **HR Manager** | All HR Staff + Approve/Reject, Forward to Director | - Phê duyệt/từ chối offer<br>- Chuyển offer cho Director duyệt<br>- Quản lý offer đã được ứng viên chấp nhận<br>- Xem báo cáo tổng hợp |
| **Director** | Approve/Reject offers forwarded by HR Manager | - Phê duyệt/từ chối offer cao cấp<br>- Xem danh sách offer chờ duyệt<br>- Theo dõi hiệu quả tuyển dụng |
| **Candidate** | View own offers, Respond (Accept/Negotiate/Decline) | - Xem thư mời của mình<br>- Chấp nhận/từ chối/đàm phán offer<br>- Theo dõi trạng thái offer |

## c. Core Features

| Feature | Description | Status Flow |
|---------|-------------|-------------|
| **Offer Creation** | Tạo thư mời cho ứng viên từ application hoặc trực tiếp | Application → Draft Offer |
| **Multi-level Approval** | Quy trình phê duyệt đa cấp (HR Manager → Director) | Draft → In-Review → Approved → Sent |
| **Candidate Response** | Ứng viên phản hồi offer (Accept/Negotiate/Decline) | Sent → Accepted/Negotiating/Declined |
| **Negotiation Handling** | Xử lý đàm phán lương, benefits, ngày bắt đầu | Negotiating → Pending HR Manager → In-Review |
| **Status Tracking** | Theo dõi trạng thái offer theo thời gian thực | Status History + Audit Trail |
| **Email Notifications** | Thông báo tự động cho các bên liên quan | Auto-send on status changes |
| **Reporting & Analytics** | Báo cáo hiệu quả tuyển dụng, thống kê offer | Dashboard + Reports |

## d. Database Entities

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| **Offers** | Lưu trữ thông tin offer chính | → Application, Candidate, JobRequest, Status |
| **OfferApprovals** | Lịch sử phê duyệt của Director | → Offer, User (Approver) |
| **OfferEditHistory** | Lịch sử chỉnh sửa trong quá trình đàm phán | → Offer, User (Editor) |
| **Applications** | Đơn ứng tuyển của ứng viên | → JobRequest, Cvprofile |
| **Candidates** | Thông tin ứng viên | → Cvprofile, Offer |
| **JobRequests** | Yêu cầu tuyển dụng | → Position, User (Requester) |
| **Status** | Trạng thái của offer | → StatusHistory |
| **StatusHistory** | Lịch sử thay đổi trạng thái | → Status, User (Changer) |

## e. API Endpoints

| Method | Endpoint | Role Required | Purpose |
|--------|----------|---------------|---------|
| **GET** | `/api/hr/offers` | HR_STAFF, HR_MANAGER | Lấy danh sách tất cả offers |
| **GET** | `/api/hr/offers/pending` | HR_MANAGER | Lấy offers chờ duyệt |
| **GET** | `/api/hr/offers/accepted-for-staff` | HR_STAFF | Lấy offers đã chấp nhận (chưa gửi Manager) |
| **GET** | `/api/hr/offers/accepted-for-manager` | HR_MANAGER | Lấy offers đã chấp nhận (đã gửi Manager) |
| **GET** | `/api/hr/offers/negotiating` | HR_STAFF, HR_MANAGER | Lấy offers đang đàm phán |
| **POST** | `/api/hr/offers` | HR_STAFF, HR_MANAGER | Tạo offer mới |
| **PUT** | `/api/hr/offers/{id}` | HR_STAFF, HR_MANAGER | Cập nhật offer |
| **PUT** | `/api/hr/offers/{id}/send` | HR_STAFF, HR_MANAGER | Gửi offer cho ứng viên |
| **POST** | `/api/hr/offers/send-accepted-to-manager` | HR_STAFF | Gửi danh sách offer đã chấp nhận cho Manager |
| **GET** | `/api/director/offers/pending` | DIRECTOR | Lấy offers chờ Director duyệt |
| **POST** | `/api/director/offers/{id}/approve` | DIRECTOR | Director phê duyệt offer |
| **POST** | `/api/director/offers/{id}/reject` | DIRECTOR | Director từ chối offer |
| **GET** | `/api/candidate/offers` | CANDIDATE | Ứng viên xem offers của mình |
| **PUT** | `/api/candidate/offers/{id}/respond` | CANDIDATE | Ứng viên phản hồi offer |

## f. Status Workflow

| Status ID | Status Name | Description | Next Possible Status |
|-----------|-------------|-------------|---------------------|
| **14** | DRAFT | Offer vừa tạo, chưa submit | IN_REVIEW (15), REJECTED (17) |
| **15** | IN_REVIEW | Chờ HR Manager hoặc Director duyệt | APPROVED (18), REJECTED (17), APPROVED_BY_DIRECTOR (22), REJECTED_BY_DIRECTOR (23) |
| **18** | APPROVED | HR Manager đã duyệt, sẵn sàng gửi | SENT (16) |
| **16** | SENT | Đã gửi cho ứng viên | ACCEPTED (19), NEGOTIATING (21), DECLINED (20) |
| **19** | ACCEPTED | Ứng viên đã chấp nhận | Final Status |
| **21** | NEGOTIATING | Ứng viên yêu cầu đàm phán | PENDING_HR_MANAGER (24), SENT (16) |
| **24** | PENDING_HR_MANAGER | Chờ HR Manager xem xét sau đàm phán | IN_REVIEW (15), APPROVED (18) |
| **22** | APPROVED_BY_DIRECTOR | Director đã duyệt, tự động gửi | SENT (16) |
| **20** | DECLINED | Ứng viên từ chối | Final Status |
| **17** | REJECTED | HR Manager từ chối | Final Status |
| **23** | REJECTED_BY_DIRECTOR | Director từ chối | Final Status |

## g. Business Rules

| Rule | Description | Implementation |
|------|-------------|----------------|
| **Approval Hierarchy** | Offer phải được duyệt theo thứ tự: HR Manager → Director (nếu cần) | WorkflowTransition table |
| **Edit Restrictions** | Chỉ có thể sửa offer ở trạng thái DRAFT hoặc IN_REVIEW | Status validation in service |
| **Negotiation Tracking** | Mọi thay đổi trong đàm phán phải được lưu lại | OfferEditHistory table |
| **Single Active Offer** | Mỗi application chỉ có 1 offer active tại một thời điểm | Business logic validation |
| **Auto-send After Director Approval** | Offer được tự động gửi sau khi Director duyệt | Status transition automation |
| **Email Notifications** | Gửi email thông báo khi có thay đổi trạng thái quan trọng | Background email service |
| **Audit Trail** | Tất cả thay đổi phải có audit trail | StatusHistory + OfferEditHistory |

## h. Performance Considerations

| Aspect | Optimization | Implementation |
|--------|--------------|----------------|
| **Database Queries** | Index optimization cho các truy vấn thường xuyên | IX_Offers_StatusId_IsDeleted, IX_Offers_ApplicationId |
| **API Response Time** | Pagination cho danh sách offers | Skip/Take parameters |
| **Dashboard Loading** | Cache statistics data | Redis caching for dashboard stats |
| **Email Performance** | Async email sending | Background job processing |
| **File Storage** | CDN for offer documents | Cloudinary integration |

## i. Integration Points

| System | Integration Type | Purpose |
|--------|------------------|---------|
| **Email Service** | SMTP/SendGrid | Gửi thông báo offer, reminder |
| **File Storage** | Cloudinary | Lưu trữ offer documents, attachments |
| **Authentication** | JWT + Google OAuth | User authentication & authorization |
| **Logging** | Serilog | Application logging & monitoring |
| **Database** | SQL Server | Data persistence |
| **Frontend** | React SPA | User interface |

## j. Security & Compliance

| Aspect | Implementation | Notes |
|--------|----------------|-------|
| **Role-based Access** | JWT claims + [Authorize] attributes | Đảm bảo chỉ user có quyền mới truy cập |
| **Data Privacy** | Soft delete + data anonymization | Tuân thủ GDPR/privacy laws |
| **Audit Logging** | StatusHistory + OfferEditHistory | Theo dõi mọi thay đổi |
| **Input Validation** | DTO validation + sanitization | Ngăn chặn injection attacks |
| **HTTPS Only** | SSL/TLS encryption | Bảo mật data transmission |

## k. Testing Strategy

| Test Type | Coverage | Tools |
|-----------|----------|-------|
| **Unit Tests** | Service layer, Repository layer | xUnit, Moq |
| **Integration Tests** | API endpoints, Database operations | TestServer, InMemory DB |
| **E2E Tests** | Complete offer workflow | Selenium, Cypress |
| **Performance Tests** | Load testing for high volume | JMeter, LoadRunner |
| **Security Tests** | Penetration testing, OWASP | OWASP ZAP, SonarQube |

## l. Monitoring & Analytics

| Metric | Purpose | Implementation |
|--------|---------|----------------|
| **Offer Acceptance Rate** | Đo hiệu quả recruitment | Dashboard analytics |
| **Time to Offer** | Thời gian từ application đến offer | Performance metrics |
| **Negotiation Rate** | Tỷ lệ ứng viên đàm phán | Business intelligence |
| **Director Approval Time** | Thời gian Director xử lý | Process optimization |
| **System Performance** | API response time, error rate | Application monitoring |