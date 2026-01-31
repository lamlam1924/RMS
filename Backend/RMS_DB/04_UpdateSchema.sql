/* =========================================================
   2026-01-30 | Lâm
   Change: Thêm dữ liệu cho WorkflowTransitions
   ========================================================= */
INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(1, 1, 2, 5), 
(1, 2, 3, 3), 
(1, 3, 3, 3),
(1, 3, 4, 2),
(1, 3, 5, 3),
(1, 3, 5, 2); 
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(2, 6, 7, 4), 
(2, 7, 8, 3); 
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(3, 9, 10, 4), 
(3, 10, 11, 4),
(3, 11, 12, 5),
(3, 11, 13, 5), 
(3, 11, 13, 3); 
go

INSERT INTO WorkflowTransitions (StatusTypeId, FromStatusId, ToStatusId, RequiredRoleId) VALUES
(4, 14, 15, 4), 
(4, 15, 15, 3), 
(4, 15, 16, 2), 
(4, 15, 17, 3), 
(4, 15, 17, 2), 
(4, 16, 18, 4); 
go
---------
UPDATE JobRequests SET StatusId = 3 WHERE Id IN (1, 2);
go

INSERT INTO StatusHistories (EntityTypeId, EntityId, FromStatusId, ToStatusId, ChangedBy, ChangedAt, Note)
VALUES
(1, 1, 1, 2, 5, DATEADD(day, -3, GETDATE()), N'Department Manager gửi yêu cầu'),
(1, 1, 2, 3, 3, DATEADD(day, -2, GETDATE()), N'HR Manager tiếp nhận, chuyển Director duyệt'),

(1, 2, 1, 2, 5, DATEADD(day, -2, GETDATE()), N'Department Manager gửi yêu cầu'),
(1, 2, 2, 3, 3, DATEADD(day, -1, GETDATE()), N'HR Manager xác nhận hợp lệ');
go

INSERT INTO Offers (ApplicationId, ProposedSalary, StatusId, CreatedBy)
VALUES
(2, 25000000, 15, 4),  -- Fresher - IN_REVIEW
(1, 15000000, 15, 4);  -- Intern - IN_REVIEW
go

INSERT INTO OfferApprovals (OfferId, ApproverId, Decision, Comment, ApprovedAt)
VALUES
(2, 3, 'APPROVED', N'Ứng viên có tiềm năng tốt, mức lương phù hợp', DATEADD(hour, -2, GETDATE())),
(3, 3, 'APPROVED', N'Phù hợp cho vị trí intern', DATEADD(hour, -1, GETDATE()));
go


   /* =========================================================
   2026-01-22 | Lam
   Change: 
   ========================================================= */


   /* =========================================================
   2026-01-22 | Lam
   Change: 
   ========================================================= */


   /* =========================================================
   2026-01-22 | Lam
   Change: 
   ========================================================= */