-- =========================================================
-- Offer SentToManagerAt - Phân tách danh sách đã chấp nhận
-- HR Staff: status 19 + SentToManagerAt IS NULL (chưa gửi)
-- HR Manager: status 19 + SentToManagerAt IS NOT NULL (đã gửi)
-- =========================================================
USE RecruitmentDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Offers') AND name = 'SentToManagerAt')
BEGIN
    ALTER TABLE Offers ADD SentToManagerAt DATETIME NULL;
    PRINT 'Added column SentToManagerAt to Offers';
END
GO
