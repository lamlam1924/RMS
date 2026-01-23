/* =========================================================
   CREATE DATABASE: Recruitment Management System
   ========================================================= */

IF NOT EXISTS (
    SELECT 1 
    FROM sys.databases 
    WHERE name = 'RecruitmentDB'
)
BEGIN
    CREATE DATABASE RecruitmentDB
    COLLATE Vietnamese_CI_AS;
END
GO

USE RecruitmentDB;
GO


