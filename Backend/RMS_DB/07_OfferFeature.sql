-- =========================================================
-- Offer Feature - Add Benefits, StartDate, Candidate Response
-- Status: 14=DRAFT, 15=IN_REVIEW, 16=APPROVED, 17=REJECTED
--         18=SENT, 19=ACCEPTED, 20=DECLINED, 21=NEGOTIATING (new)
-- =========================================================
USE RecruitmentDB;
GO

-- Add new columns to Offers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'Benefits')
    ALTER TABLE Offers ADD Benefits NVARCHAR(MAX) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'StartDate')
    ALTER TABLE Offers ADD StartDate DATE NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'CandidateResponse')
    ALTER TABLE Offers ADD CandidateResponse VARCHAR(50) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'CandidateRespondedAt')
    ALTER TABLE Offers ADD CandidateRespondedAt DATETIME NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'CandidateComment')
    ALTER TABLE Offers ADD CandidateComment NVARCHAR(500) NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'SentAt')
    ALTER TABLE Offers ADD SentAt DATETIME NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'UpdatedAt')
    ALTER TABLE Offers ADD UpdatedAt DATETIME NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'UpdatedBy')
    ALTER TABLE Offers ADD UpdatedBy INT NULL;
GO

-- Add NEGOTIATING status for Offer (StatusTypeId=4)
-- Chỉ thêm nếu Id=21 chưa tồn tại (tránh lỗi duplicate key khi chạy lại)
IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Id = 21)
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (21, 4, 'NEGOTIATING', N'Đang thương lượng', 8, 0);
GO
