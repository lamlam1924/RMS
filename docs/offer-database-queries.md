# Offer Database Queries

## d. Database Queries

| No | Query Name | SQL Server Query | Returns |
|----|------------|------------------|---------|
| 01 | Find Offer by Id | SELECT * FROM Offers WHERE Id = @OfferId AND IsDeleted = 0; | Offer record |
| 02 | Get Offers by Status | SELECT * FROM Offers WHERE StatusId = @StatusId AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of offers |
| 03 | Get Accepted Offers for Staff | SELECT * FROM Offers WHERE StatusId = 19 AND SentToManagerAt IS NULL AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of accepted offers |
| 04 | Get Accepted Offers for Manager | SELECT * FROM Offers WHERE StatusId = 19 AND SentToManagerAt IS NOT NULL AND IsDeleted = 0 ORDER BY SentToManagerAt DESC; | List of accepted offers |
| 05 | Get Pending Offers | SELECT * FROM Offers WHERE StatusId = 15 AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of pending offers |
| 06 | Get Approved Offers | SELECT * FROM Offers WHERE StatusId = 18 AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of approved offers |
| 07 | Get Negotiating Offers | SELECT * FROM Offers WHERE StatusId = 21 AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of negotiating offers |
| 08 | Get Offers by Application | SELECT * FROM Offers WHERE ApplicationId = @ApplicationId AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of offers |
| 09 | Get Offers by Candidate | SELECT * FROM Offers WHERE CandidateId = @CandidateId AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of offers |
| 10 | Create New Offer | INSERT INTO Offers (ApplicationId, CandidateId, JobRequestId, ProposedSalary, Benefits, StartDate, StatusId, CreatedBy, CreatedAt) VALUES (@ApplicationId, @CandidateId, @JobRequestId, @Salary, @Benefits, @StartDate, 14, @UserId, GETDATE()); | New offer ID |
| 11 | Update Offer Details | UPDATE Offers SET ProposedSalary = @Salary, Benefits = @Benefits, StartDate = @StartDate, UpdatedAt = GETDATE(), UpdatedBy = @UserId WHERE Id = @OfferId AND StatusId IN (14, 15); | Number of affected rows |
| 12 | Update Offer Status | UPDATE Offers SET StatusId = @ToStatusId, UpdatedAt = GETDATE(), UpdatedBy = @UserId WHERE Id = @OfferId; | Number of affected rows |
| 13 | Send Offer to Candidate | UPDATE Offers SET StatusId = 16, SentAt = GETDATE(), UpdatedAt = GETDATE(), UpdatedBy = @UserId WHERE Id = @OfferId AND StatusId IN (14, 15, 18, 22); | Number of affected rows |
| 14 | Candidate Respond to Offer | UPDATE Offers SET CandidateResponse = @Response, CandidateComment = @Comment, CandidateRespondedAt = GETDATE(), StatusId = CASE WHEN @Response = 'ACCEPT' THEN 19 WHEN @Response = 'NEGOTIATE' THEN 21 WHEN @Response = 'REJECT' THEN 20 END WHERE Id = @OfferId; | Number of affected rows |
| 15 | Mark Offers Sent to Manager | UPDATE Offers SET SentToManagerAt = GETDATE() WHERE Id IN (@OfferIds) AND StatusId = 19; | Number of affected rows |
| 16 | Get Offer with Details | SELECT o.*, c.FullName as CandidateName, p.Title as PositionTitle, d.Name as DepartmentName, s.Name as CurrentStatus FROM Offers o LEFT JOIN Applications a ON o.ApplicationId = a.Id LEFT JOIN Cvprofiles cv ON a.CvprofileId = cv.Id LEFT JOIN Candidates c ON cv.CandidateId = c.Id OR o.CandidateId = c.Id LEFT JOIN JobRequests jr ON o.JobRequestId = jr.Id OR a.JobRequestId = jr.Id LEFT JOIN Positions p ON jr.PositionId = p.Id LEFT JOIN Departments d ON p.DepartmentId = d.Id LEFT JOIN Status s ON o.StatusId = s.Id WHERE o.Id = @OfferId AND o.IsDeleted = 0; | Offer with related data |
| 17 | Get Offer Edit History | SELECT oeh.*, u.FullName as EditedByName FROM OfferEditHistory oeh JOIN Users u ON oeh.EditedBy = u.Id WHERE oeh.OfferId = @OfferId ORDER BY oeh.EditedAt DESC; | List of edit history |
| 18 | Save Offer Edit History | INSERT INTO OfferEditHistory (OfferId, EditedBy, EditedAt, Salary, Benefits, StartDate) VALUES (@OfferId, @UserId, GETDATE(), @Salary, @Benefits, @StartDate); | New history ID |
| 19 | Get Offer Approval History | SELECT oa.*, u.FullName as ApproverName FROM OfferApprovals oa JOIN Users u ON oa.ApproverId = u.Id WHERE oa.OfferId = @OfferId ORDER BY oa.ApprovedAt DESC; | List of approvals |
| 20 | Create Offer Approval | INSERT INTO OfferApprovals (OfferId, ApproverId, Decision, Comment, ApprovedAt) VALUES (@OfferId, @DirectorId, @Decision, @Comment, GETDATE()); | New approval ID |
| 21 | Check Offer Exists | SELECT COUNT(1) FROM Offers WHERE Id = @OfferId AND IsDeleted = 0; | Existence flag |
| 22 | Get Offers Dashboard Stats | SELECT (SELECT COUNT(*) FROM Offers WHERE StatusId = 15 AND IsDeleted = 0) as PendingOffers, (SELECT COUNT(*) FROM Offers WHERE StatusId = 19 AND IsDeleted = 0) as AcceptedOffers, (SELECT COUNT(*) FROM Offers WHERE StatusId = 21 AND IsDeleted = 0) as NegotiatingOffers, (SELECT COUNT(*) FROM Offers WHERE StatusId = 20 AND IsDeleted = 0) as DeclinedOffers; | Dashboard statistics |
| 23 | Get Offers by Date Range | SELECT * FROM Offers WHERE CreatedAt BETWEEN @StartDate AND @EndDate AND IsDeleted = 0 ORDER BY CreatedAt DESC; | List of offers |
| 24 | Get Offers Pending Director | SELECT * FROM Offers WHERE StatusId = 15 AND IsDeleted = 0 ORDER BY CreatedAt ASC; | List of offers |
| 25 | Director Approve Offer | UPDATE Offers SET StatusId = 22, UpdatedAt = GETDATE(), UpdatedBy = @DirectorId WHERE Id = @OfferId AND StatusId = 15; INSERT INTO OfferApprovals (OfferId, ApproverId, Decision, Comment, ApprovedAt) VALUES (@OfferId, @DirectorId, 'APPROVED', @Comment, GETDATE()); | Number of affected rows |
| 26 | Director Reject Offer | UPDATE Offers SET StatusId = 23, UpdatedAt = GETDATE(), UpdatedBy = @DirectorId WHERE Id = @OfferId AND StatusId = 15; INSERT INTO OfferApprovals (OfferId, ApproverId, Decision, Comment, ApprovedAt) VALUES (@OfferId, @DirectorId, 'REJECTED', @Comment, GETDATE()); | Number of affected rows |
| 27 | Forward Offer to Director | UPDATE Offers SET StatusId = 15, UpdatedAt = GETDATE(), UpdatedBy = @UserId WHERE Id = @OfferId AND StatusId = 24; | Number of affected rows |
| 28 | Submit Negotiation to Manager | UPDATE Offers SET StatusId = 24, UpdatedAt = GETDATE(), UpdatedBy = @UserId WHERE Id = @OfferId AND StatusId = 21; | Number of affected rows |
| 29 | Get Notification Data for HR | SELECT u.Email as HREmail, c.FullName as CandidateName, p.Title as PositionTitle FROM Offers o LEFT JOIN Applications a ON o.ApplicationId = a.Id LEFT JOIN JobRequests jr ON o.JobRequestId = jr.Id OR a.JobRequestId = jr.Id LEFT JOIN Users u ON jr.AssignedStaffId = u.Id LEFT JOIN Cvprofiles cv ON a.CvprofileId = cv.Id LEFT JOIN Candidates c ON cv.CandidateId = c.Id OR o.CandidateId = c.Id LEFT JOIN Positions p ON jr.PositionId = p.Id WHERE o.Id = @OfferId; | Notification data |
| 30 | Delete Offer (Soft Delete) | UPDATE Offers SET IsDeleted = 1, DeletedAt = GETDATE(), DeletedBy = @UserId WHERE Id = @OfferId; | Number of affected rows |

## Status ID Reference:
- **DRAFT**: 14 - Offer created, not yet submitted
- **IN_REVIEW**: 15 - Submitted for HR Manager or Director review  
- **APPROVED**: 18 - HR Manager approved, ready to send
- **SENT**: 16 - Sent to candidate
- **ACCEPTED**: 19 - Candidate accepted the offer
- **DECLINED**: 20 - Candidate declined the offer
- **NEGOTIATING**: 21 - Candidate requested negotiation
- **APPROVED_BY_DIRECTOR**: 22 - Director approved, auto-sent to candidate
- **REJECTED_BY_DIRECTOR**: 23 - Director rejected the offer
- **PENDING_HR_MANAGER**: 24 - Awaiting HR Manager review after negotiation

## Key Indexes for Performance:
```sql
-- Offers table indexes
CREATE INDEX IX_Offers_StatusId_IsDeleted ON Offers (StatusId, IsDeleted) INCLUDE (CreatedAt, ApplicationId, CandidateId);
CREATE INDEX IX_Offers_ApplicationId ON Offers (ApplicationId) WHERE IsDeleted = 0;
CREATE INDEX IX_Offers_CandidateId ON Offers (CandidateId) WHERE IsDeleted = 0;
CREATE INDEX IX_Offers_SentToManagerAt ON Offers (SentToManagerAt) WHERE StatusId = 19 AND IsDeleted = 0;

-- OfferEditHistory table indexes  
CREATE INDEX IX_OfferEditHistory_OfferId ON OfferEditHistory (OfferId, EditedAt DESC);

-- OfferApprovals table indexes
CREATE INDEX IX_OfferApprovals_OfferId ON OfferApprovals (OfferId, ApprovedAt DESC);
```