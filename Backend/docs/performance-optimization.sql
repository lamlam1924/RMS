-- Performance Optimization Script for RMS Database
-- Tạo indexes để tăng tốc các truy vấn dashboard

-- Index cho JobRequests table (được query nhiều nhất)
CREATE NONCLUSTERED INDEX IX_JobRequests_StatusId_IsDeleted 
ON JobRequests (StatusId, IsDeleted) 
INCLUDE (RequestedBy, CreatedAt);

-- Index cho Applications table
CREATE NONCLUSTERED INDEX IX_Applications_StatusId_IsDeleted 
ON Applications (StatusId, IsDeleted) 
INCLUDE (CreatedAt, CandidateId);

-- Index cho Interviews table
CREATE NONCLUSTERED INDEX IX_Interviews_StartTime_IsDeleted 
ON Interviews (StartTime, IsDeleted) 
INCLUDE (CreatedAt);

-- Index cho Offers table
CREATE NONCLUSTERED INDEX IX_Offers_StatusId_IsDeleted 
ON Offers (StatusId, IsDeleted) 
INCLUDE (CreatedAt, ApplicationId);

-- Index cho InterviewParticipants table
CREATE NONCLUSTERED INDEX IX_InterviewParticipants_UserId_Interview 
ON InterviewParticipants (UserId) 
INCLUDE (InterviewId);

-- Kiểm tra hiệu suất của các query
-- Chạy lệnh này để xem execution plan:
-- SET STATISTICS IO ON;
-- SET STATISTICS TIME ON;

-- Test query performance sau khi tạo indexes
SELECT 'JobRequests Performance Test' AS TestName,
       COUNT(*) AS Count
FROM JobRequests 
WHERE StatusId IN (2, 3) AND IsDeleted = 0;

SELECT 'Applications Performance Test' AS TestName,
       COUNT(*) AS Count
FROM Applications 
WHERE StatusId BETWEEN 9 AND 13 AND IsDeleted = 0;