USE
RecruitmentDB;
GO
/* =========================================================
   2026-01-30 | Lâm
   Change: Thêm dữ liệu cho WorkflowTransitions
   ========================================================= */
   
INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(1, 1, 2, 5), 
(1, 2, 3, 3), 
(1, 3, 3, 3),
(1, 3, 4, 2),
(1, 3, 5, 3),
(1, 3, 5, 2);
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(2, 6, 7, 4), 
(2, 7, 8, 3);
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(3, 9, 10, 4), 
(3, 10, 11, 4),
(3, 11, 12, 5),
(3, 11, 13, 5), 
(3, 11, 13, 3);
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(4, 14, 15, 4), 
(4, 15, 15, 3), 
(4, 15, 16, 2), 
(4, 15, 17, 3), 
(4, 15, 17, 2), 
(4, 16, 18, 4);
go

/* =========================================================
   2026-01-30 | Lâm
   Change: Cập nhật trạng thái JobRequests và StatusHistories
   ========================================================= */
UPDATE JobRequests
SET StatusId = 3
WHERE Id IN (1, 2);
go

INSERT INTO StatusHistories (EntityTypeId, EntityId, FromStatusId, ToStatusId, ChangedBy, ChangedAt, Note)
VALUES
(1, 1, 1, 2, 5, DATEADD(day, -3, GETDATE()), N'Department Manager gửi yêu cầu'),
(1, 1, 2, 3, 3, DATEADD(day, -2, GETDATE()), N'HR Manager tiếp nhận, chuyển Director duyệt'),

(1, 2, 1, 2, 5, DATEADD(day, -2, GETDATE()), N'Department Manager gửi yêu cầu'),
(1, 2, 2, 3, 3, DATEADD(day, -1, GETDATE()), N'HR Manager xác nhận hợp lệ');
go

/* =========================================================
   2026-01-30 | Lâm
   Change: Thêm Offers và OfferApprovals
   ========================================================= */
INSERT INTO Offers (ApplicationId, ProposedSalary, StatusId, CreatedBy)
VALUES
(2, 25000000, 15, 4),  -- Fresher - IN_REVIEW
(1, 15000000, 15, 4);  -- Intern - IN_REVIEW
go

INSERT INTO OfferApprovals (OfferId, ApproverId, Decision, Comment, ApprovedAt)
VALUES
(2, 3, 'APPROVED', N'Ứng viên có tiềm năng tốt, mức lương phù hợp', DATEADD(hour, -2, GETDATE())),
(3, 3, 'APPROVED', N'Phù hợp cho vị trí intern', DATEADD(hour, -1, GETDATE()));
go
  /* =========================================================
   2026-01-22 | Lam
   Change: cập nhật pass=123456
 ========================================================= */
   -- Hash của '123456' (BCrypt WorkFactor=12)
DECLARE
@Hash VARCHAR(255) = '$2a$12$9kP2YoLUSMAu3X/JmxeWO.O2FA6/r.qnqmeur8pQ4q9xX9fBBTnhO';

-- Update Users
UPDATE Users
SET PasswordHash = @Hash
WHERE AuthProvider = 'LOCAL';

-- Update Candidates
UPDATE Candidates
SET PasswordHash = @Hash
WHERE AuthProvider = 'LOCAL';

/* =========================================================
   2026-02-02 | Sơn
   Change: Thêm bảng JobPostings
   Purpose: Để candidates có thể xem tin tuyển dụng công khai
   Note: Candidates sử dụng bảng riêng, không cần Users/Roles
   ========================================================= */
IF
NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobPostings')
BEGIN
CREATE TABLE JobPostings
(
    Id           INT IDENTITY PRIMARY KEY,
    JobRequestId INT NOT NULL,

    Title        NVARCHAR(300) NOT NULL,
    Description  NVARCHAR(MAX),
    Requirements NVARCHAR(MAX),
    Benefits     NVARCHAR(MAX),

    SalaryMin    DECIMAL(18, 2),
    SalaryMax    DECIMAL(18, 2),
    Location     NVARCHAR(200),

    DeadlineDate DATE,
    StatusId     INT NOT NULL,

    CreatedAt    DATETIME DEFAULT GETDATE(),
    CreatedBy    INT,
    UpdatedAt    DATETIME,
    UpdatedBy    INT,

    IsDeleted    BIT      DEFAULT 0,
    DeletedAt    DATETIME,
    DeletedBy    INT,

    FOREIGN KEY (JobRequestId) REFERENCES JobRequests (Id),
    FOREIGN KEY (StatusId) REFERENCES Statuses (Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users (Id)
);
PRINT
'Created table JobPostings';
END
ELSE
BEGIN
    PRINT
'Table JobPostings already exists';
END
GO



/* =========================================================
   2026-02-02 | Sơn
   Change: Update JobRequests status thành APPROVED và thêm JobPostings
   Purpose: Tạo tin tuyển dụng công khai cho candidates

   ========================================================= */


-- Update JobRequests thành APPROVED để có thể tạo JobPosting
UPDATE JobRequests
SET StatusId = 4
WHERE Id IN (1, 2); -- 4 = APPROVED
PRINT
'Updated JobRequests to APPROVED status';
GO

-- Thêm JobPostings nếu chưa có
IF NOT EXISTS (SELECT * FROM JobPostings WHERE JobRequestId = 1)
BEGIN
INSERT INTO JobPostings (JobRequestId, Title, Description,
                         Requirements, Benefits,
                         SalaryMin, SalaryMax, Location,
                         DeadlineDate, StatusId, CreatedBy)
VALUES
    -- Backend Developer
    (1,
     N'Tuyển dụng Backend Developer (.NET Core)',
     N'Chúng tôi đang tìm kiếm Backend Developer có kinh nghiệm với .NET Core để tham gia phát triển các dự án lớn cho khách hàng quốc tế.

Mô tả công việc:
• Thiết kế và phát triển Web API sử dụng ASP.NET Core
• Làm việc với SQL Server, Entity Framework Core
• Tham gia review code và tối ưu hiệu năng
• Làm việc theo mô hình Scrum/Agile',
     N'Yêu cầu:
• Tốt nghiệp Đại học chuyên ngành CNTT
• Có ít nhất 2 năm kinh nghiệm với .NET Core
• Thành thạo C#, ASP.NET Core, Entity Framework
• Kinh nghiệm với SQL Server, Git
• Có khả năng làm việc nhóm tốt
• Tiếng Anh đọc hiểu tài liệu kỹ thuật',
     N'Quyền lợi:
• Lương: 20-35 triệu (tùy kinh nghiệm)
• Thưởng theo dự án và hiệu quả công việc
• Đầy đủ BHXH, BHYT, BHTN
• Review lương 2 lần/năm
• Làm việc trong môi trường chuyên nghiệp
• Cơ hội thăng tiến rõ ràng',
     20000000, 35000000, N'Hà Nội',
     '2026-02-28', 7, 3), -- StatusId = 7 (PUBLISHED)

    -- Digital Marketing Executive
    (2,
     N'Tuyển dụng Digital Marketing Executive',
     N'Chúng tôi cần một Digital Marketing Executive năng động để triển khai các chiến dịch marketing online hiệu quả.

Mô tả công việc:
• Lên kế hoạch và triển khai chiến dịch quảng cáo Google Ads, Facebook Ads
• Quản lý và tối ưu ngân sách marketing
• Phân tích dữ liệu và báo cáo hiệu quả chiến dịch
• Phối hợp với team Content để tạo nội dung phù hợp',
     N'Yêu cầu:
• Tốt nghiệp Đại học Marketing, Kinh tế, hoặc liên quan
• Có ít nhất 1 năm kinh nghiệm Digital Marketing
• Thành thạo Google Ads, Facebook Ads Manager
• Biết sử dụng Google Analytics
• Khả năng phân tích số liệu tốt
• Chủ động, sáng tạo',
     N'Quyền lợi:
• Lương: 12-20 triệu
• Thưởng KPI hàng tháng
• BHXH đầy đủ theo luật
• Môi trường trẻ trung, năng động
• Được đào tạo và phát triển kỹ năng
• Team building định kỳ',
     12000000, 20000000, N'Hà Nội',
     '2026-02-25', 7, 3); -- StatusId = 7 (PUBLISHED)

PRINT
'Added 2 JobPostings (Backend Developer & Marketing Executive)';
END
ELSE
BEGIN
    PRINT
'JobPostings already exist';
END
GO

/* =========================================================
   2026-02-02 | Sơn
   Change: Fix Applications StatusId
   Purpose: Sử dụng đúng StatusId từ ApplicationStatus (9-13)
   ========================================================= */
UPDATE Applications
SET StatusId = 9
WHERE Id = 1; -- APPLIED
UPDATE Applications
SET StatusId = 10
WHERE Id = 2; -- SCREENING
UPDATE Applications
SET StatusId = 11
WHERE Id = 3; -- INTERVIEWING
PRINT
'Updated Applications with correct StatusIds';
GO

   /* =========================================================
   2026-02-07 | Lâm
   Change: Thêm trạng thái RETURNED và cấu hình Workflow mới cho Job Request
   Purpose: Hỗ trợ HR Manager trả về yêu cầu cho Dept Manager chỉnh sửa
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'RETURNED' AND StatusTypeId = 1)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (21, 1, 'RETURNED', N'Yêu cầu chỉnh sửa', 6, 0);
    PRINT 'Added status RETURNED (ID: 21)';
END
GO

IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 2 AND ToStatusId = 21 AND RequiredRoleId = 3)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 2, 21, 3);
    PRINT 'Added transition: SUBMITTED -> RETURNED (HR Manager)';
END

-- Thêm luồng: RETURNED -> DRAFT (Dept Manager mở lại để sửa)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 21 AND ToStatusId = 1 AND RequiredRoleId = 5)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 21, 1, 5);
    PRINT 'Added transition: RETURNED -> DRAFT (Dept Manager)';
END

-- Thêm luồng: IN_REVIEW -> RETURNED (Trường hợp Director xem xong cũng có thể yêu cầu HR bảo Dept Manager sửa lại)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 3 AND ToStatusId = 21 AND RequiredRoleId = 2)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 3, 21, 2);
    PRINT 'Added transition: IN_REVIEW -> RETURNED (Director)';
END

GO
/* =========================================================
   2026-02-07 | Lâm
   Change: Thêm các trường theo dõi cho luồng Trả về (Return Flow)
   Purpose: Hỗ trợ HR Manager theo dõi việc Dept Manager đã xem yêu cầu chưa
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('JobRequests') AND name = 'LastReturnedAt')
BEGIN
    ALTER TABLE JobRequests ADD LastReturnedAt DATETIME NULL;
    PRINT 'Added column LastReturnedAt to JobRequests';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('JobRequests') AND name = 'LastViewedByManagerAt')
BEGIN
    ALTER TABLE JobRequests ADD LastViewedByManagerAt DATETIME NULL;
    PRINT 'Added column LastViewedByManagerAt to JobRequests';
END
GO
-- Thêm loại tệp JOB_DESCRIPTION cho Job Requests
IF NOT EXISTS (SELECT 1 FROM FileTypes WHERE Code = 'JOB_DESCRIPTION')
BEGIN
    INSERT INTO FileTypes (Id, Code, Description)
    VALUES (4, 'JOB_DESCRIPTION', N'Bản mô tả công việc (Job Description)');
END
GO

/* =========================================================
   2026-02-24 | Lâm
   Change: CANCEL_PENDING + CANCELLED cho Job Request
   Purpose: Hỗ trợ Trưởng phòng yêu cầu hủy sau khi đã gửi;
            HR Manager phê duyệt hoặc từ chối yêu cầu hủy đó.
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'CANCEL_PENDING' AND StatusTypeId = 1)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (22, 1, 'CANCEL_PENDING', N'Đang chờ duyệt hủy', 7, 0);
    PRINT 'Added status CANCEL_PENDING (ID: 22)';
END
GO

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'CANCELLED' AND StatusTypeId = 1)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (23, 1, 'CANCELLED', N'Đã hủy', 8, 1);
    PRINT 'Added status CANCELLED (ID: 23)';
END
GO

-- DRAFT → CANCELLED (Trưởng phòng hủy trực tiếp, RoleId 5 = DEPARTMENT_MANAGER)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 1 AND ToStatusId = 23)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 1, 23, 5);
    PRINT 'Added transition: DRAFT -> CANCELLED (Dept Manager)';
END

-- RETURNED → CANCELLED (Trưởng phòng hủy khi bị trả về)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 21 AND ToStatusId = 23)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 21, 23, 5);
    PRINT 'Added transition: RETURNED -> CANCELLED (Dept Manager)';
END

-- SUBMITTED → CANCEL_PENDING (Trưởng phòng yêu cầu hủy, cần HR duyệt)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 2 AND ToStatusId = 22)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 2, 22, 5);
    PRINT 'Added transition: SUBMITTED -> CANCEL_PENDING (Dept Manager)';
END

-- IN_REVIEW → CANCEL_PENDING (Trưởng phòng yêu cầu hủy khi đang xem xét)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 3 AND ToStatusId = 22)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 3, 22, 5);
    PRINT 'Added transition: IN_REVIEW -> CANCEL_PENDING (Dept Manager)';
END

-- CANCEL_PENDING → CANCELLED (HR Manager phê duyệt hủy)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 22 AND ToStatusId = 23)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 22, 23, 3);
    PRINT 'Added transition: CANCEL_PENDING -> CANCELLED (HR Manager approves)';
END

-- CANCEL_PENDING → SUBMITTED (HR Manager từ chối hủy, hoàn lại SUBMITTED)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 22 AND ToStatusId = 2)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 22, 2, 3);
    PRINT 'Added transition: CANCEL_PENDING -> SUBMITTED (HR Manager rejects cancel)';
END

-- CANCEL_PENDING → IN_REVIEW (HR Manager từ chối hủy, hoàn lại IN_REVIEW)
IF NOT EXISTS (SELECT 1 FROM WorkflowTransitions WHERE StatusTypeId = 1 AND FromStatusId = 22 AND ToStatusId = 3)
BEGIN
    INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId)
    VALUES (1, 22, 3, 3);
    PRINT 'Added transition: CANCEL_PENDING -> IN_REVIEW (HR Manager rejects cancel)';
END
GO

/* =========================================================
   2026-03-03 | Sơn
   Change: Thêm cột AssignedStaffId vào JobPostings
   Purpose: HR Manager gán HR Staff phụ trách từng Job Posting.
            HR Staff chỉ thấy job posting được gán cho mình.
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('JobPostings') AND name = 'AssignedStaffId')
BEGIN
    ALTER TABLE JobPostings ADD AssignedStaffId INT NULL;
    ALTER TABLE JobPostings ADD CONSTRAINT FK_JobPostings_AssignedStaff
        FOREIGN KEY (AssignedStaffId) REFERENCES Users(Id);
    PRINT 'Added column AssignedStaffId to JobPostings';
END
GO

-- Seed: gán HR Staff (UserId = 4) cho các JobPosting hiện có
UPDATE JobPostings
SET AssignedStaffId = 4
WHERE AssignedStaffId IS NULL AND IsDeleted = 0;
PRINT 'Assigned HR Staff (Id=4) to existing JobPostings';
GO

/* =========================================================
   2026-03-03 | Fix workflow
   Change: Thêm cột AssignedStaffId vào JobRequests
   Purpose: HR Manager gán HR Staff vào Job Request đã được Director APPROVE.
            HR Staff thấy job request được gán → tự tạo Job Posting.
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('JobRequests') AND name = 'AssignedStaffId')
BEGIN
    ALTER TABLE JobRequests ADD AssignedStaffId INT NULL;
    ALTER TABLE JobRequests ADD CONSTRAINT FK_JobRequests_AssignedStaff
        FOREIGN KEY (AssignedStaffId) REFERENCES Users(Id);
    PRINT 'Added column AssignedStaffId to JobRequests';
END
GO

-- Seed: gán HR Staff (UserId = 4) cho các JobRequest đã APPROVED hiện có (StatusId = 4)
UPDATE JobRequests
SET AssignedStaffId = 4
WHERE StatusId = 4 AND AssignedStaffId IS NULL AND IsDeleted = 0;
PRINT 'Assigned HR Staff (Id=4) to existing APPROVED JobRequests';
GO

/* =========================================================
   2026-03-09 | System
   Change: Thêm cột CvFileUrl vào CVProfiles
   Purpose: Lưu đường dẫn CV (PDF/DOCX) ứng viên tải lên từ máy cá nhân
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CVProfiles') AND name = 'CvFileUrl')
BEGIN
    ALTER TABLE CVProfiles ADD CvFileUrl NVARCHAR(MAX) NULL;
    PRINT 'Added column CvFileUrl to CVProfiles';
END
GO

/* =========================================================
   2026-03-09 | System
   Change: Thêm cột AvatarUrl
   Purpose: Hỗ trợ người dùng tải ảnh đại diện lên Cloudinary
   ========================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Candidates') AND name = 'AvatarUrl')
BEGIN
    ALTER TABLE Candidates ADD AvatarUrl NVARCHAR(MAX) NULL;
    PRINT 'Added column AvatarUrl to Candidates';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AvatarUrl')
BEGIN
    ALTER TABLE Users ADD AvatarUrl NVARCHAR(MAX) NULL;
    PRINT 'Added column AvatarUrl to Users';
END
GO
