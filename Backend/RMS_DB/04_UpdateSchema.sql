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
/* =========================================================
   2026-03-09 | Lâm
   Change:  Thêm trạng thái phỏng vấn và cấu hình workflow cho Interviews
            Thêm PositionId vào EvaluationTemplates, Note vào InterviewFeedbacks
   Purpose: Hỗ trợ quản lý trạng thái phỏng vấn chi tiết hơn (lên lịch, xác nhận, từ chối, dời lịch, hoàn thành, huỷ)
            Gắn template đánh giá vào từng vị trí cụ thể
            HR Manager và Interviewer có thể để lại ghi chú khi feedback về buổi phỏng vấn
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM StatusTypes WHERE Code = 'INTERVIEW')
    INSERT INTO StatusTypes (Id, Code, Description) VALUES
    (5, 'INTERVIEW', N'Trạng thái buổi phỏng vấn');

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'SCHEDULED')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (24, 5, 'SCHEDULED', N'Đã lên lịch', 1, 0);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'CONFIRMED')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (25, 5, 'CONFIRMED', N'Ứng viên xác nhận', 2, 0);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'DECLINED_BY_CANDIDATE')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (26, 5, 'DECLINED_BY_CANDIDATE', N'Ứng viên từ chối', 3, 1);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'RESCHEDULED')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (27, 5, 'RESCHEDULED', N'Đã dời lịch', 4, 0);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'COMPLETED')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (28, 5, 'COMPLETED', N'Hoàn thành', 5, 1);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'CANCELLED')
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (29, 5, 'CANCELLED', N'Đã huỷ', 6, 1);
GO

/* Fix seed data: interview (Id=1) dùng sai StatusId → chuyển sang SCHEDULED */
UPDATE Interviews
SET StatusId = (SELECT Id FROM Statuses WHERE Code = 'SCHEDULED')
WHERE Id = 1;
GO


IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('EvaluationTemplates') AND name = 'PositionId')
BEGIN
    ALTER TABLE EvaluationTemplates
        ADD PositionId INT NULL
            CONSTRAINT FK_EvalTemplate_Position FOREIGN KEY REFERENCES Positions(Id);
END
GO

/* Gắn template hiện có vào Backend Developer (PositionId = 3) */
UPDATE EvaluationTemplates SET PositionId = 3 WHERE Id = 1;
GO


IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('InterviewFeedbacks') AND name = 'Note')
BEGIN
    ALTER TABLE InterviewFeedbacks
        ADD Note NVARCHAR(1000) NULL;
END
GO
/* =========================================================
   2026-03-09 | Lâm
   Change: Thêm bảng ParticipantRequests để quản lý việc HR Manager yêu cầu Dept Manager đề cử người tham gia phỏng vấn
             (trường hợp HR cần thêm người vào buổi phỏng vấn đã lên lịch, hoặc muốn chuyển buổi phỏng vấn đó cho Director duyệt nếu cần thêm quá nhiều người)
   Purpose:  Hỗ trợ HR Manager chủ động yêu cầu Dept Manager đề cử thêm người tham gia phỏng vấn khi cần (ví dụ: thêm reviewer chuyên môn, thêm người hỗ trợ đánh giá kỹ năng mềm, hoặc chuyển sang Director duyệt nếu cần quá nhiều người tham gia)
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM StatusTypes WHERE Code = 'PARTICIPANT_REQUEST')
    INSERT INTO StatusTypes (Id, Code, Description) VALUES
    (6, 'PARTICIPANT_REQUEST', N'Trạng thái yêu cầu nhân sự phỏng vấn');
GO

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'PENDING' AND StatusTypeId = 6)
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (29, 6, 'PENDING', N'Chờ xử lý', 1, 0);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'FORWARDED' AND StatusTypeId = 6)
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (30, 6, 'FORWARDED', N'Đã chuyển GĐ', 2, 0);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'FULFILLED' AND StatusTypeId = 6)
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (31, 6, 'FULFILLED', N'Đã đề cử đủ', 3, 1);

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'CANCELLED' AND StatusTypeId = 6)
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal) VALUES
    (32, 6, 'CANCELLED', N'Đã huỷ', 4, 1);
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ParticipantRequests')
BEGIN
    CREATE TABLE ParticipantRequests (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        InterviewId     INT NOT NULL,
        RequestedByUserId INT NOT NULL,
        AssignedToUserId  INT NOT NULL,
        RequiredCount   INT NOT NULL DEFAULT 1,
        Message         NVARCHAR(500) NULL,
        StatusId        INT NOT NULL,
        ForwardedToUserId INT NULL,
        CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
        RespondedAt     DATETIME NULL,

        CONSTRAINT FK_PR_Interview     FOREIGN KEY (InterviewId)       REFERENCES Interviews(Id),
        CONSTRAINT FK_PR_RequestedBy   FOREIGN KEY (RequestedByUserId) REFERENCES Users(Id),
        CONSTRAINT FK_PR_AssignedTo    FOREIGN KEY (AssignedToUserId)  REFERENCES Users(Id),
        CONSTRAINT FK_PR_Status        FOREIGN KEY (StatusId)          REFERENCES Statuses(Id),
        CONSTRAINT FK_PR_ForwardedTo   FOREIGN KEY (ForwardedToUserId) REFERENCES Users(Id)
    );
    PRINT 'Created ParticipantRequests table';
END
ELSE
    PRINT 'ParticipantRequests table already exists';
GO

/* =========================================================
   2026-03-13 | Lâm
   Change: Interview Conflict Detection & Rescheduling Tracking
   Purpose: Thêm tracking cho interview updates, reschedule count, và conflict detection
            CHỈ FOCUS vào việc detect conflicts giữa các interviews
            KHÔNG quản lý working hours/availability (đó là việc của HR system)
   ========================================================= */

-- 1. Add columns to Interviews table for tracking updates and reschedules
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE Interviews ADD UpdatedAt DATETIME NULL;
    PRINT 'Added UpdatedAt column to Interviews table';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'UpdatedBy')
BEGIN
    ALTER TABLE Interviews ADD UpdatedBy INT NULL;
    ALTER TABLE Interviews ADD CONSTRAINT FK_Interview_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES Users(Id);
    PRINT 'Added UpdatedBy column to Interviews table with FK';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'RescheduledCount')
BEGIN
    ALTER TABLE Interviews ADD RescheduledCount INT NOT NULL DEFAULT 0;
    PRINT 'Added RescheduledCount column to Interviews table';
END
GO

-- 2. Add new interview statuses (only add ones that don't exist yet)
-- Note: StatusTypeId = 5 (INTERVIEW) đã có Id 24-29, StatusTypeId = 6 có Id 30-33
-- Các status mới sẽ dùng Id từ 33 trở đi

-- NO_SHOW: Candidate didn't show up
IF NOT EXISTS (SELECT * FROM Statuses WHERE Code = 'NO_SHOW' AND StatusTypeId = 5)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (33, 5, 'NO_SHOW', N'Ứng viên vắng mặt', 90, 1);
    PRINT 'Added NO_SHOW status (Id: 33)';
END

-- INTERVIEWER_ABSENT: Interviewer couldn't attend
IF NOT EXISTS (SELECT * FROM Statuses WHERE Code = 'INTERVIEWER_ABSENT' AND StatusTypeId = 5)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (34, 5, 'INTERVIEWER_ABSENT', N'Người phỏng vấn vắng mặt', 91, 1);
    PRINT 'Added INTERVIEWER_ABSENT status (Id: 34)';
END

-- IN_PROGRESS: Interview is currently happening
IF NOT EXISTS (SELECT * FROM Statuses WHERE Code = 'IN_PROGRESS' AND StatusTypeId = 5)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (35, 5, 'IN_PROGRESS', N'Đang diễn ra', 30, 0);
    PRINT 'Added IN_PROGRESS status (Id: 35)';
END

-- COMPLETED_PENDING_FEEDBACK: Interview done, waiting for feedback
IF NOT EXISTS (SELECT * FROM Statuses WHERE Code = 'COMPLETED_PENDING_FEEDBACK' AND StatusTypeId = 5)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (36, 5, 'COMPLETED_PENDING_FEEDBACK', N'Hoàn thành - Chờ đánh giá', 40, 0);
    PRINT 'Added COMPLETED_PENDING_FEEDBACK status (Id: 36)';
END

PRINT 'Interview statuses updated successfully';
GO

-- 3. Create view for real-time conflict detection
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_InterviewConflicts')
    DROP VIEW vw_InterviewConflicts;
GO

CREATE VIEW vw_InterviewConflicts AS
WITH InterviewerSchedule AS (
    SELECT 
        i.Id AS InterviewId,
        i.StartTime,
        i.EndTime,
        i.StatusId,
        s.Code AS StatusCode,
        ip.UserId AS InterviewerId,
        u.FullName AS InterviewerName,
        i.ApplicationId,
        cv.CandidateId,
        c.FullName AS CandidateName
    FROM Interviews i
    INNER JOIN InterviewParticipants ip ON i.Id = ip.InterviewId
    INNER JOIN Users u ON ip.UserId = u.Id
    INNER JOIN Statuses s ON i.StatusId = s.Id
    INNER JOIN Applications app ON i.ApplicationId = app.Id
    INNER JOIN CVProfiles cv ON app.CVProfileId = cv.Id
    INNER JOIN Candidates c ON cv.CandidateId = c.Id
        WHERE i.IsDeleted = 0 
            AND s.Code NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW', 'INTERVIEWER_ABSENT')
)
SELECT 
    a.InterviewId AS Interview1Id,
    a.StartTime AS Interview1Start,
    a.EndTime AS Interview1End,
    b.InterviewId AS Interview2Id,
    b.StartTime AS Interview2Start,
    b.EndTime AS Interview2End,
    a.InterviewerId AS ConflictingUserId,
    a.InterviewerName AS ConflictingUserName,
    'INTERVIEWER_CONFLICT' AS ConflictType,
    a.CandidateName AS Interview1Candidate,
    b.CandidateName AS Interview2Candidate
FROM InterviewerSchedule a
INNER JOIN InterviewerSchedule b 
    ON a.InterviewerId = b.InterviewerId 
    AND a.InterviewId < b.InterviewId  -- Avoid duplicates
    AND a.StartTime < b.EndTime 
    AND a.EndTime > b.StartTime;       -- Time overlap condition
GO

PRINT 'Created vw_InterviewConflicts view for real-time conflict detection';
GO

-- 4. Create indexes for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Interviews_Time_Status' AND object_id = OBJECT_ID('Interviews'))
BEGIN
    CREATE INDEX IX_Interviews_Time_Status 
    ON Interviews(StartTime, EndTime, StatusId, IsDeleted)
    INCLUDE (ApplicationId, RescheduledCount);
    PRINT 'Created index IX_Interviews_Time_Status for conflict detection performance';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InterviewParticipants_User_Interview' AND object_id = OBJECT_ID('InterviewParticipants'))
BEGIN
    CREATE INDEX IX_InterviewParticipants_User_Interview 
    ON InterviewParticipants(UserId, InterviewId);
    PRINT 'Created index IX_InterviewParticipants_User_Interview for interviewer lookup';
END
GO

-- 5. Create stored procedure for efficient conflict checking
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CheckInterviewConflicts')
    DROP PROCEDURE sp_CheckInterviewConflicts;
GO

CREATE PROCEDURE sp_CheckInterviewConflicts
    @InterviewerIds VARCHAR(MAX),  -- Comma-separated list: "1,2,3"
    @StartTime DATETIME,
    @EndTime DATETIME,
    @ExcludeInterviewId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Parse comma-separated IDs into table
    DECLARE @InterviewerTable TABLE (UserId INT);
    INSERT INTO @InterviewerTable (UserId)
    SELECT CAST(value AS INT) FROM STRING_SPLIT(@InterviewerIds, ',');

    -- Find conflicting interviews
    SELECT 
        i.Id AS ConflictingInterviewId,
        i.StartTime,
        i.EndTime,
        u.Id AS UserId,
        u.FullName AS UserName,
        c.FullName AS CandidateName,
        'INTERVIEWER' AS ConflictType,
        'ERROR' AS Severity
    FROM Interviews i
    INNER JOIN InterviewParticipants ip ON i.Id = ip.InterviewId
    INNER JOIN Users u ON ip.UserId = u.Id
    INNER JOIN Applications app ON i.ApplicationId = app.Id
    INNER JOIN CVProfiles cv ON app.CVProfileId = cv.Id
    INNER JOIN Candidates c ON cv.CandidateId = c.Id
    INNER JOIN Statuses s ON i.StatusId = s.Id
    WHERE ip.UserId IN (SELECT UserId FROM @InterviewerTable)
      AND i.IsDeleted = 0
      AND (@ExcludeInterviewId IS NULL OR i.Id <> @ExcludeInterviewId)
    AND s.Code NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW', 'INTERVIEWER_ABSENT')
      AND i.StartTime < @EndTime
      AND i.EndTime > @StartTime;
END
GO

PRINT 'Created sp_CheckInterviewConflicts stored procedure';
GO


IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Applications') AND name = 'NoShowCount')
BEGIN
    ALTER TABLE Applications ADD NoShowCount INT NOT NULL DEFAULT 0;
    PRINT 'Added NoShowCount column to Applications table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'RequiresFeedbackBy')
BEGIN
    ALTER TABLE Interviews ADD RequiresFeedbackBy DATETIME NULL;
    PRINT 'Added RequiresFeedbackBy column to Interviews table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'FeedbackReminderSent')
BEGIN
    ALTER TABLE Interviews ADD FeedbackReminderSent BIT NOT NULL DEFAULT 0;
    PRINT 'Added FeedbackReminderSent column to Interviews table';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Interviews') AND name = 'IsNextRoundScheduled')
BEGIN
    ALTER TABLE Interviews ADD IsNextRoundScheduled BIT NOT NULL DEFAULT 0;
    PRINT 'Added IsNextRoundScheduled column to Interviews table';
END
GO

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_NoShowStatistics')
    DROP VIEW vw_NoShowStatistics;
GO

CREATE VIEW vw_NoShowStatistics AS
SELECT 
    a.Id AS ApplicationId,
    c.Id AS CandidateId,
    c.FullName AS CandidateName,
    c.Email AS CandidateEmail,
    a.NoShowCount AS TotalNoShows,
    (SELECT MAX(sh.ChangedAt) 
     FROM StatusHistories sh 
     INNER JOIN Interviews i ON sh.EntityId = i.Id AND sh.EntityTypeId = 4
     WHERE i.ApplicationId = a.Id AND sh.ToStatusId = (SELECT Id FROM Statuses WHERE Code = 'NO_SHOW')
    ) AS LastNoShowDate
FROM Applications a
INNER JOIN CVProfiles cv ON a.CVProfileId = cv.Id
INNER JOIN Candidates c ON cv.CandidateId = c.Id
WHERE a.NoShowCount > 0;
GO

PRINT 'Created vw_NoShowStatistics view';
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_MarkInterviewNoShow')
    DROP PROCEDURE sp_MarkInterviewNoShow;
GO

CREATE PROCEDURE sp_MarkInterviewNoShow
    @InterviewId INT,
    @NoShowType VARCHAR(20),
    @MarkedBy INT,
    @Reason NVARCHAR(500) = NULL,
    @UserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StatusId INT;
    DECLARE @ApplicationId INT;
    DECLARE @OldStatusId INT;
    DECLARE @CandidateId INT;

    SELECT @ApplicationId = ApplicationId, @OldStatusId = StatusId 
    FROM Interviews WHERE Id = @InterviewId;
    
    SELECT @CandidateId = cv.CandidateId 
    FROM Applications a 
    INNER JOIN CVProfiles cv ON a.CVProfileId = cv.Id 
    WHERE a.Id = @ApplicationId;

    SELECT @StatusId = Id
    FROM Statuses
    WHERE Code = CASE WHEN @NoShowType = 'INTERVIEWER' THEN 'INTERVIEWER_ABSENT' ELSE 'NO_SHOW' END;
    
    IF @StatusId IS NULL
    BEGIN
        RAISERROR('NO_SHOW status not found', 16, 1);
        RETURN;
    END

    IF @OldStatusId = @StatusId
    BEGIN
        RAISERROR('Interview has already been marked with this no-show status', 16, 1);
        RETURN;
    END

    UPDATE Interviews SET StatusId = @StatusId WHERE Id = @InterviewId;

    IF @NoShowType = 'CANDIDATE'
    BEGIN
        UPDATE Applications SET NoShowCount = NoShowCount + 1 WHERE Id = @ApplicationId;
    END

    DECLARE @NoteText NVARCHAR(1000);
    SET @NoteText = 'NO_SHOW|Type:' + @NoShowType;
    
    IF @NoShowType = 'CANDIDATE'
        SET @NoteText = @NoteText + '|CandidateId:' + CAST(@CandidateId AS VARCHAR(10));
    
    IF @NoShowType = 'INTERVIEWER' AND @UserId IS NOT NULL
        SET @NoteText = @NoteText + '|UserId:' + CAST(@UserId AS VARCHAR(10));
    
    IF @Reason IS NOT NULL
        SET @NoteText = @NoteText + '|Reason:' + @Reason;

    INSERT INTO StatusHistories (EntityTypeId, EntityId, FromStatusId, ToStatusId, ChangedBy, ChangedAt, Note)
    VALUES (4, @InterviewId, @OldStatusId, @StatusId, @MarkedBy, GETDATE(), @NoteText);

    SELECT 1 AS Success, @ApplicationId AS ApplicationId, @CandidateId AS CandidateId;
END
GO

PRINT 'Created sp_MarkInterviewNoShow procedure';
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CheckAndScheduleNextRound')
    DROP PROCEDURE sp_CheckAndScheduleNextRound;
GO

CREATE PROCEDURE sp_CheckAndScheduleNextRound
    @InterviewId INT,
    @CheckedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ApplicationId INT;
    DECLARE @CurrentRound INT;
    DECLARE @AllFeedbackSubmitted BIT = 0;
    DECLARE @AverageScore DECIMAL(5,2);
    DECLARE @PassThreshold DECIMAL(5,2) = 6.0;

    SELECT @ApplicationId = ApplicationId, @CurrentRound = RoundNo 
    FROM Interviews WHERE Id = @InterviewId;

    DECLARE @TotalInterviewers INT;
    DECLARE @SubmittedFeedbacks INT;

    SELECT @TotalInterviewers = COUNT(*) 
    FROM InterviewParticipants 
    WHERE InterviewId = @InterviewId;

    SELECT @SubmittedFeedbacks = COUNT(DISTINCT InterviewerId)
    FROM InterviewFeedbacks
    WHERE InterviewId = @InterviewId;

    IF @TotalInterviewers = @SubmittedFeedbacks
    BEGIN
        SET @AllFeedbackSubmitted = 1;

        SELECT @AverageScore = AVG(CAST(s.Score AS DECIMAL(5,2)))
        FROM InterviewFeedbacks f
        INNER JOIN InterviewScores s ON f.Id = s.FeedbackId
        WHERE f.InterviewId = @InterviewId;

        IF @AverageScore >= @PassThreshold
        BEGIN
            SELECT 
                1 AS ShouldScheduleNextRound,
                @ApplicationId AS ApplicationId,
                @CurrentRound + 1 AS NextRoundNo,
                @AverageScore AS AverageScore,
                'Candidate passed round ' + CAST(@CurrentRound AS VARCHAR(5)) + 
                ' with average score ' + CAST(@AverageScore AS VARCHAR(10)) AS Message;
        END
        ELSE
        BEGIN
            SELECT 
                0 AS ShouldScheduleNextRound,
                @ApplicationId AS ApplicationId,
                @CurrentRound AS CurrentRoundNo,
                @AverageScore AS AverageScore,
                'Candidate did not pass threshold in round ' + CAST(@CurrentRound AS VARCHAR(5)) AS Message;
        END
    END
    ELSE
    BEGIN
        SELECT 
            0 AS ShouldScheduleNextRound,
            NULL AS ApplicationId,
            NULL AS NextRoundNo,
            NULL AS AverageScore,
            'Waiting for ' + CAST(@TotalInterviewers - @SubmittedFeedbacks AS VARCHAR(5)) + ' more feedback(s)' AS Message;
    END
END
GO

PRINT 'Created sp_CheckAndScheduleNextRound procedure';
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_InterviewFeedbacks_Interview_Interviewer' AND object_id = OBJECT_ID('InterviewFeedbacks'))
BEGIN
    CREATE INDEX IX_InterviewFeedbacks_Interview_Interviewer 
    ON InterviewFeedbacks(InterviewId, InterviewerId);
    PRINT 'Created index IX_InterviewFeedbacks_Interview_Interviewer';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StatusHistories_EntityType_Status' AND object_id = OBJECT_ID('StatusHistories'))
BEGIN
    CREATE INDEX IX_StatusHistories_EntityType_Status 
    ON StatusHistories(EntityTypeId, ToStatusId, ChangedAt);
    PRINT 'Created index IX_StatusHistories_EntityType_Status';
END
GO

UPDATE i
SET RequiresFeedbackBy = DATEADD(day, 3, i.EndTime)
FROM Interviews i
INNER JOIN Statuses s ON i.StatusId = s.Id
WHERE s.Code = 'COMPLETED' AND i.RequiresFeedbackBy IS NULL;

PRINT 'Updated existing interviews with RequiresFeedbackBy defaults';
GO

/* =========================================================
   2026-03-13 | System
   Change: Thêm recommendation, round-aware evaluation template, round decision
   Purpose: Tách feedback khỏi quyết định cuối của HR và hỗ trợ form đánh giá theo từng vòng
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('EvaluationTemplates') AND name = 'RoundNo')
BEGIN
    ALTER TABLE EvaluationTemplates ADD RoundNo INT NULL;
    PRINT 'Added RoundNo to EvaluationTemplates';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('InterviewFeedbacks') AND name = 'Recommendation')
BEGIN
    ALTER TABLE InterviewFeedbacks ADD Recommendation VARCHAR(30) NULL;
    PRINT 'Added Recommendation to InterviewFeedbacks';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'InterviewRoundDecisions')
BEGIN
    CREATE TABLE InterviewRoundDecisions (
        InterviewId INT NOT NULL PRIMARY KEY,
        DecisionCode VARCHAR(30) NOT NULL,
        Note NVARCHAR(1000) NULL,
        DecidedBy INT NOT NULL,
        DecidedAt DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_InterviewRoundDecisions_Interview FOREIGN KEY (InterviewId) REFERENCES Interviews(Id),
        CONSTRAINT FK_InterviewRoundDecisions_DecidedBy FOREIGN KEY (DecidedBy) REFERENCES Users(Id)
    );

    PRINT 'Created InterviewRoundDecisions table';
END
ELSE
BEGIN
    PRINT 'InterviewRoundDecisions table already exists';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EvaluationTemplates_Position_Round' AND object_id = OBJECT_ID('EvaluationTemplates'))
BEGIN
    CREATE INDEX IX_EvaluationTemplates_Position_Round ON EvaluationTemplates(PositionId, RoundNo);
    PRINT 'Created IX_EvaluationTemplates_Position_Round';
END
GO




