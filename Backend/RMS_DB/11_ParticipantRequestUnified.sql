USE RecruitmentDB;
GO
-- =========================================================
-- 111_ParticipantRequestUnified.sql
-- Gộp single + batch: 1 bảng ParticipantRequests (mở rộng) + 1 bảng ParticipantRequestInterviews (n-n).
-- Chạy script này; không dùng 11_ParticipantRequestBatch.sql.
-- =========================================================

-- 1. Bảng trung gian: một request gắn 1 hoặc nhiều interview
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ParticipantRequestInterviews')
BEGIN
    CREATE TABLE ParticipantRequestInterviews (
        RequestId   INT NOT NULL,
        InterviewId INT NOT NULL,
        CONSTRAINT PK_ParticipantRequestInterviews PRIMARY KEY (RequestId, InterviewId),
        CONSTRAINT FK_PRI_Request   FOREIGN KEY (RequestId)   REFERENCES ParticipantRequests(Id) ON DELETE CASCADE,
        CONSTRAINT FK_PRI_Interview  FOREIGN KEY (InterviewId)  REFERENCES Interviews(Id) ON DELETE CASCADE
    );
    PRINT 'Created ParticipantRequestInterviews table';
END
ELSE
    PRINT 'ParticipantRequestInterviews table already exists';
GO

-- 2. Backfill: mỗi request hiện tại có 1 interview → thêm 1 dòng vào ParticipantRequestInterviews
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ParticipantRequestInterviews')
BEGIN
    INSERT INTO ParticipantRequestInterviews (RequestId, InterviewId)
    SELECT Id, InterviewId FROM ParticipantRequests
    WHERE InterviewId IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM ParticipantRequestInterviews pri WHERE pri.RequestId = ParticipantRequests.Id AND pri.InterviewId = ParticipantRequests.InterviewId);
    PRINT 'Backfilled ParticipantRequestInterviews from existing ParticipantRequests';
END
GO

-- 3. Thêm cột vào ParticipantRequests (cho block: khung giờ, vị trí, nhãn)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'TimeRangeStart')
BEGIN
    ALTER TABLE ParticipantRequests ADD TimeRangeStart DATETIME2(2) NULL;
    PRINT 'Added TimeRangeStart to ParticipantRequests';
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'TimeRangeEnd')
BEGIN
    ALTER TABLE ParticipantRequests ADD TimeRangeEnd DATETIME2(2) NULL;
    PRINT 'Added TimeRangeEnd to ParticipantRequests';
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'PositionTitle')
BEGIN
    ALTER TABLE ParticipantRequests ADD PositionTitle NVARCHAR(200) NULL;
    PRINT 'Added PositionTitle to ParticipantRequests';
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'DepartmentId')
BEGIN
    ALTER TABLE ParticipantRequests ADD DepartmentId INT NULL;
    ALTER TABLE ParticipantRequests ADD CONSTRAINT FK_ParticipantRequests_Department FOREIGN KEY (DepartmentId) REFERENCES Departments(Id);
    PRINT 'Added DepartmentId to ParticipantRequests';
END
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'TitleLabel')
BEGIN
    ALTER TABLE ParticipantRequests ADD TitleLabel NVARCHAR(300) NULL;
    PRINT 'Added TitleLabel to ParticipantRequests';
END
GO

-- 4. Cho phép InterviewId NULL (request "block" không gắn 1 interview cụ thể)
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_PR_Interview')
BEGIN
    ALTER TABLE ParticipantRequests DROP CONSTRAINT FK_PR_Interview;
    PRINT 'Dropped FK_PR_Interview';
END
IF (SELECT is_nullable FROM sys.columns WHERE object_id = OBJECT_ID('ParticipantRequests') AND name = 'InterviewId') = 0
BEGIN
    ALTER TABLE ParticipantRequests ALTER COLUMN InterviewId INT NULL;
    PRINT 'InterviewId is now nullable';
END
GO

-- 5. Nếu DB dùng StatusId thay vì Status: không đổi. Nếu có cột Status (NVARCHAR) thì giữ. Script không đụng Status/StatusId.

-- Add confirmation/decline tracking for interviewer participation
-- Run after 13_ParticipantRequestUnified.sql (or existing schema)

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('InterviewParticipants') AND name = 'ConfirmedAt'
)
BEGIN
    ALTER TABLE InterviewParticipants
    ADD ConfirmedAt DATETIME2 NULL;
    PRINT 'Added InterviewParticipants.ConfirmedAt';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('InterviewParticipants') AND name = 'DeclinedAt'
)
BEGIN
    ALTER TABLE InterviewParticipants
    ADD DeclinedAt DATETIME2 NULL;
    PRINT 'Added InterviewParticipants.DeclinedAt';
END
GO

-- HR chỉ gửi thông báo (online/offline) cho interviewer; gửi yêu cầu xác nhận tham gia cho ứng viên riêng.
-- Ứng viên chỉ thấy buổi phỏng vấn trong "Phỏng vấn của tôi" khi HR đã gửi yêu cầu xác nhận (cột này được set).


IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    WHERE t.name = 'Interviews' AND c.name = 'CandidateInvitationSentAt'
)
BEGIN
    ALTER TABLE Interviews ADD CandidateInvitationSentAt DATETIME NULL;
END
GO

-- Ghi chú khi interviewer hoặc candidate từ chối để HR thương lượng/đổi lịch (vd. chọn ngày khác).


-- Interviewer từ chối: lưu lý do/ghi chú
IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    WHERE t.name = 'InterviewParticipants' AND c.name = 'DeclineNote'
)
BEGIN
    ALTER TABLE InterviewParticipants ADD DeclineNote NVARCHAR(500) NULL;
END
GO

-- Ứng viên từ chối: lưu lý do/ghi chú
IF NOT EXISTS (
    SELECT 1 FROM sys.columns c
    JOIN sys.tables t ON c.object_id = t.object_id
    WHERE t.name = 'Interviews' AND c.name = 'CandidateDeclineNote'
)
BEGIN
    ALTER TABLE Interviews ADD CandidateDeclineNote NVARCHAR(500) NULL;
END
GO
