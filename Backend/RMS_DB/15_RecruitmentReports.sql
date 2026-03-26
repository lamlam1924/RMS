USE RecruitmentDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Recruitment_Reports')
BEGIN
    CREATE TABLE Recruitment_Reports (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        JobId INT NOT NULL,
        TotalApply INT NOT NULL DEFAULT 0,
        TotalOffer INT NOT NULL DEFAULT 0,
        TotalRejectOffer INT NOT NULL DEFAULT 0,
        TotalHired INT NOT NULL DEFAULT 0,
        Note NVARCHAR(1000) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_RecruitmentReports_JobRequest FOREIGN KEY (JobId) REFERENCES JobRequests(Id)
    );

    CREATE INDEX IX_RecruitmentReports_JobId ON Recruitment_Reports(JobId);
    CREATE INDEX IX_RecruitmentReports_CreatedAt ON Recruitment_Reports(CreatedAt);
END
GO
