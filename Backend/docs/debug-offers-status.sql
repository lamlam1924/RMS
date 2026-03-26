-- Debug script để kiểm tra status của offers
-- Chạy script này để xem dữ liệu thực tế

-- 1. Kiểm tra tất cả offers và status của chúng
SELECT 
    o.Id,
    o.StatusId,
    s.Name as StatusName,
    o.SentToManagerAt,
    o.IsDeleted,
    o.CreatedAt,
    CASE 
        WHEN o.ApplicationId IS NOT NULL THEN a.Cvprofile.Candidate.FullName
        ELSE c.FullName 
    END as CandidateName
FROM Offers o
LEFT JOIN Status s ON o.StatusId = s.Id
LEFT JOIN Applications a ON o.ApplicationId = a.Id
LEFT JOIN Candidates c ON o.CandidateId = c.Id
WHERE o.IsDeleted = 0
ORDER BY o.CreatedAt DESC;

-- 2. Kiểm tra offers có StatusId = 19 (đã chấp nhận)
SELECT 
    o.Id,
    o.StatusId,
    s.Name as StatusName,
    o.SentToManagerAt,
    o.CreatedAt,
    'Should appear in HR Staff accepted tab' as Note
FROM Offers o
LEFT JOIN Status s ON o.StatusId = s.Id
WHERE o.IsDeleted = 0 
  AND o.StatusId = 19 
  AND o.SentToManagerAt IS NULL;

-- 3. Kiểm tra tất cả status có thể có
SELECT Id, Name, Description 
FROM Status 
WHERE Name LIKE '%offer%' OR Name LIKE '%accept%' OR Name LIKE '%decline%'
ORDER BY Id;

-- 4. Đếm số lượng offers theo từng status
SELECT 
    s.Id as StatusId,
    s.Name as StatusName,
    COUNT(o.Id) as OfferCount
FROM Status s
LEFT JOIN Offers o ON s.Id = o.StatusId AND o.IsDeleted = 0
GROUP BY s.Id, s.Name
HAVING COUNT(o.Id) > 0
ORDER BY s.Id;