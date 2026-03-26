-- =========================================================
-- Indexes for Offer candidate lookup (fix timeout)
-- =========================================================
-- LƯU Ý: Chạy 08_OfferDirectCandidate.sql trước để thêm cột CandidateId, JobRequestId
USE RecruitmentDB;
GO

-- Index for Offers.CandidateId (chỉ tạo nếu cột CandidateId đã tồn tại)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'CandidateId')
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Offers') AND name = 'IX_Offers_CandidateId')
BEGIN
    CREATE INDEX IX_Offers_CandidateId ON Offers(CandidateId) WHERE IsDeleted = 0;
    PRINT 'Created IX_Offers_CandidateId';
END
GO

-- Index for Offers.ApplicationId (offer via application)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Offers') AND name = 'IX_Offers_ApplicationId')
    CREATE INDEX IX_Offers_ApplicationId ON Offers(ApplicationId) WHERE IsDeleted = 0 AND ApplicationId IS NOT NULL;
GO
