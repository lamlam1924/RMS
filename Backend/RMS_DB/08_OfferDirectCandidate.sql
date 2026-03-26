-- =========================================================
-- Offer Direct to Candidate - HR tạo offer gửi thẳng cho candidate
-- Candidate không cần nộp CV/Application
-- =========================================================
USE RecruitmentDB;
GO

-- Add CandidateId, JobRequestId to Offers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'CandidateId')
    ALTER TABLE Offers ADD CandidateId INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'JobRequestId')
    ALTER TABLE Offers ADD JobRequestId INT NULL;
GO

-- Migrate existing offers: copy from Application (CandidateId từ CVProfiles)
UPDATE o
SET o.CandidateId = c.CandidateId, o.JobRequestId = a.JobRequestId
FROM Offers o
INNER JOIN Applications a ON a.Id = o.ApplicationId
INNER JOIN CVProfiles c ON c.Id = a.CVProfileId
WHERE o.CandidateId IS NULL;
GO

-- Make ApplicationId nullable (drop index & FK first if exists)
-- Index phải drop trước vì ALTER COLUMN không chạy được khi có index phụ thuộc
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Offers') AND name = 'IX_Offers_ApplicationId')
    DROP INDEX IX_Offers_ApplicationId ON Offers;

DECLARE @fk NVARCHAR(256);
SELECT @fk = name FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('Offers') AND referenced_object_id = OBJECT_ID('Applications');
IF @fk IS NOT NULL EXEC('ALTER TABLE Offers DROP CONSTRAINT ' + @fk);

ALTER TABLE Offers ALTER COLUMN ApplicationId INT NULL;

ALTER TABLE Offers ADD CONSTRAINT FK_Offers_Application FOREIGN KEY (ApplicationId) REFERENCES Applications(Id);
GO

-- Add FK for CandidateId, JobRequestId
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Offers') AND referenced_object_id = OBJECT_ID('Candidates'))
    ALTER TABLE Offers ADD CONSTRAINT FK_Offers_Candidate FOREIGN KEY (CandidateId) REFERENCES Candidates(Id);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Offers') AND referenced_object_id = OBJECT_ID('JobRequests'))
    ALTER TABLE Offers ADD CONSTRAINT FK_Offers_JobRequest FOREIGN KEY (JobRequestId) REFERENCES JobRequests(Id);
GO
