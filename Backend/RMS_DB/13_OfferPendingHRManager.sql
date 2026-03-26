-- =========================================================
-- Offer PENDING_HR_MANAGER (22) - HR Manager chuyển giám đốc duyệt
-- Flow: HR Staff gửi (21->22) -> HR Manager gửi giám đốc (22->15) -> Director duyệt
-- =========================================================
USE RecruitmentDB;
GO

-- Id 22,23 dùng cho JobRequest. Dùng 24 cho Offer PENDING_HR_MANAGER
IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Id = 24)
BEGIN
    INSERT INTO Statuses (Id, StatusTypeId, Code, Name, OrderNo, IsFinal)
    VALUES (24, 4, 'PENDING_HR_MANAGER', N'Chờ HR Manager chuyển', 9, 0);
    PRINT 'Added status PENDING_HR_MANAGER (ID: 24)';
END
GO
