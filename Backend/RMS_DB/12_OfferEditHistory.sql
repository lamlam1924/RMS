-- =========================================================
-- Offer Edit History - Lưu lịch sử chỉnh sửa offer (thương lượng)
-- =========================================================
USE RecruitmentDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OfferEditHistory')
BEGIN
    CREATE TABLE OfferEditHistory (
        Id INT IDENTITY PRIMARY KEY,
        OfferId INT NOT NULL,
        EditedBy INT NOT NULL,
        EditedAt DATETIME NOT NULL DEFAULT GETDATE(),

        Salary DECIMAL(18,2) NULL,
        Benefits NVARCHAR(MAX) NULL,
        StartDate DATE NULL,

        FOREIGN KEY (OfferId) REFERENCES Offers(Id),
        FOREIGN KEY (EditedBy) REFERENCES Users(Id)
    );
    CREATE INDEX IX_OfferEditHistory_OfferId ON OfferEditHistory(OfferId);
    PRINT 'Created OfferEditHistory table';
END
GO
