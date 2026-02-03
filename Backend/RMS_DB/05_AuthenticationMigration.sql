USE RecruitmentDB;
GO
-- Add RefreshToken table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Token NVARCHAR(500) NOT NULL UNIQUE,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsRevoked BIT NOT NULL DEFAULT 0,
        RevokedAt DATETIME2 NULL,
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
    CREATE INDEX IX_RefreshTokens_Token ON RefreshTokens(Token);
END
GO

-- Add GoogleId column to Users table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'GoogleId')
BEGIN
    ALTER TABLE Users ADD GoogleId NVARCHAR(255) NULL;
    CREATE INDEX IX_Users_GoogleId ON Users(GoogleId);
END
GO

-- Add PasswordHash column to Users table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PasswordHash')
BEGIN
    ALTER TABLE Users ADD PasswordHash NVARCHAR(500) NULL;
END
GO

-- Add AuthProvider column to Users table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'AuthProvider')
BEGIN
    ALTER TABLE Users ADD AuthProvider NVARCHAR(50) NOT NULL DEFAULT 'Local';
END
GO

PRINT 'Authentication migration completed successfully';
