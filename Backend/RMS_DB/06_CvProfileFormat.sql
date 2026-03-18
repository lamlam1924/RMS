/* =========================================================
   Add fields for professional CV format (two-column layout)
   ========================================================= */
USE RecruitmentDB;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVProfiles') AND name = 'Address')
BEGIN
    ALTER TABLE CVProfiles ADD Address NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVProfiles') AND name = 'ProfessionalTitle')
BEGIN
    ALTER TABLE CVProfiles ADD ProfessionalTitle NVARCHAR(200) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVProfiles') AND name = 'SkillsText')
BEGIN
    ALTER TABLE CVProfiles ADD SkillsText NVARCHAR(1000) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVProfiles') AND name = 'ReferencesText')
BEGIN
    ALTER TABLE CVProfiles ADD ReferencesText NVARCHAR(1000) NULL;
END
GO

-- Add Location to CVExperiences (e.g. "Seattle" for "AT&T Inc., Seattle")
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVExperiences') AND name = 'Location')
BEGIN
    ALTER TABLE CVExperiences ADD Location NVARCHAR(200) NULL;
END
GO

-- Add Location to CVEducations (e.g. "Seattle" for "University of Seattle, Seattle")
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CVEducations') AND name = 'Location')
BEGIN
    ALTER TABLE CVEducations ADD Location NVARCHAR(200) NULL;
END
GO
