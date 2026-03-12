-- =========================================================
-- Thêm cột AvatarUrl vào Users và Candidates
-- Chạy script này nếu gặp lỗi "Invalid column name 'AvatarUrl'"
-- =========================================================
USE RecruitmentDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AvatarUrl')
BEGIN
    ALTER TABLE Users ADD AvatarUrl NVARCHAR(MAX) NULL;
    PRINT 'Added column AvatarUrl to Users';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Candidates') AND name = 'AvatarUrl')
BEGIN
    ALTER TABLE Candidates ADD AvatarUrl NVARCHAR(MAX) NULL;
    PRINT 'Added column AvatarUrl to Candidates';
END
GO
