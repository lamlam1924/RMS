-- =========================================================
-- Indexes for Offer candidate lookup (fix timeout)
-- =========================================================
USE RecruitmentDB;
GO

-- Index for Offers.CandidateId (direct offer to candidate)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Offers') AND name = 'IX_Offers_CandidateId')
    CREATE INDEX IX_Offers_CandidateId ON Offers(CandidateId) WHERE IsDeleted = 0;
GO

-- Index for Offers.ApplicationId (offer via application)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Offers') AND name = 'IX_Offers_ApplicationId')
    CREATE INDEX IX_Offers_ApplicationId ON Offers(ApplicationId) WHERE IsDeleted = 0 AND ApplicationId IS NOT NULL;
GO
