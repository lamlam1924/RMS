INSERT INTO EntityTypes (Id, Code, Description) VALUES
(1, 'JOB_REQUEST',  N'Yêu cầu tuyển dụng nội bộ'),
(2, 'JOB_POSTING',  N'Tin tuyển dụng công khai'),
(3, 'APPLICATION',  N'Hồ sơ ứng tuyển'),
(4, 'INTERVIEW',    N'Phỏng vấn'),
(5, 'OFFER',        N'Thư mời nhận việc');
 go 

INSERT INTO InterviewRoles (Id, Code, Name) VALUES
(1, 'HR',         N'Nhân sự'),
(2, 'TECH',       N'Chuyên môn'),
(3, 'MANAGER',    N'Quản lý'),
(4, 'DIRECTOR',   N'Giám đốc');
go

INSERT INTO Roles (Id, Code, Name, ParentRoleId) VALUES
(1, 'ADMIN',              N'Quản trị hệ thống', NULL),
(2, 'DIRECTOR',           N'Giám đốc', NULL),
(3, 'HR_MANAGER',         N'Trưởng phòng nhân sự', NULL),
(4, 'HR_STAFF',           N'Nhân viên nhân sự', NULL),
(5, 'DEPARTMENT_MANAGER', N'Trưởng phòng ban', NULL),
(6, 'EMPLOYEE',           N'Nhân viên', NULL);
go

INSERT INTO Users (FullName, Email, AuthProvider, CreatedBy) VALUES
-- Admin
(N'Nguyễn Văn Toàn',   'admin@company.com', 'LOCAL',1),

-- Director
(N'Trần Minh Hoàng',  'hoangtran@company.com', 'LOCAL',1),

-- HR
(N'Lê Thị Hạnh',      'hanhle@company.com', 'LOCAL',1),
(N'Phạm Quốc Tuấn',   'tuanpham@company.com', 'LOCAL',1),

-- IT Department
(N'Nguyễn Văn Long',  'longnguyen@company.com', 'LOCAL',1),
(N'Vũ Hoàng Nam',     'namvu@company.com', 'LOCAL',1),
(N'Phan Đức Minh',    'minhphan@company.com', 'LOCAL',1),

-- Marketing Department
(N'Đặng Thu Trang',   'trangdang@company.com', 'LOCAL',1),
(N'Bùi Anh Khoa',     'khoabui@company.com', 'LOCAL',1);
go

INSERT INTO UserRoles VALUES
(1,1), -- admin

(2,2), -- director

(3,3), -- hr manager
(4,4), -- hr staff

(5,5), -- IT manager
(6,6),
(7,6),

(8,5), -- Marketing manager
(9,6);
go

INSERT INTO Departments (Name, HeadUserId, CreatedBy) VALUES
(N'Phòng Công nghệ thông tin', 5,1),
(N'Phòng Marketing', 8,1),
(N'Phòng Nhân sự', 3,1);
go

INSERT INTO UserDepartments (UserId, DepartmentId) VALUES
(5,1), -- Long - IT Manager
(6,1),
(7,1),

(8,2), -- Trang - Marketing Manager
(9,2),

(3,3), -- HR Manager
(4,3);
go

INSERT INTO Positions (Title, DepartmentId,CreatedBy) VALUES
(N'IT Manager', 1,1),		--IT 
(N'Software Engineer', 1,1),
(N'Backend Developer', 1,1), 
(N'QA Engineer', 1,1),

(N'Marketing Manager', 2,1),		--Marketing
(N'Digital Marketing Executive', 2,1),	
(N'Content Marketing Specialist', 2,1),

(N'HR Manager', 3,1),		--HR
(N'HR Executive', 3,1),
(N'Talent Acquisition Specialist', 3,1);
go

INSERT INTO StatusTypes (Id, Code, Description) VALUES
(1, 'RECRUITMENT_REQUEST', N'Trạng thái yêu cầu tuyển dụng'),
(2, 'JOB_POSTING',         N'Trạng thái tin tuyển dụng'),
(3, 'APPLICATION',         N'Trạng thái hồ sơ ứng tuyển'),
(4, 'OFFER',               N'Trạng thái offer');
go

INSERT INTO Statuses VALUES
(1,1,'DRAFT',        N'Nháp',1,0),		--Recruitment Request
(2,1,'SUBMITTED',    N'Đã gửi',2,0),
(3,1,'IN_REVIEW',    N'Đang duyệt',3,0),
(4,1,'APPROVED',     N'Đã phê duyệt',4,1),
(5,1,'REJECTED',     N'Từ chối',5,1),

(6,2,'DRAFT',     N'Nháp',1,0),			--Job Posting
(7,2,'PUBLISHED', N'Đang đăng tuyển',2,0),
(8,2,'CLOSED',    N'Đã đóng',3,1),

(9,3,'APPLIED',        N'Đã ứng tuyển',1,0),		--Application
(10,3,'SCREENING',     N'Sàng lọc',2,0),
(11,3,'INTERVIEWING',  N'Đang phỏng vấn',3,0),
(12,3,'PASSED',        N'Đạt',4,1),
(13,3,'REJECTED',      N'Không đạt',5,1),

(14,4,'DRAFT',      N'Nháp',1,0),		--Offer
(15,4,'IN_REVIEW',  N'Đang duyệt',2,0),
(16,4,'APPROVED',   N'Đã duyệt',3,0),
(17,4,'REJECTED',   N'Từ chối',4,1),
(18,4,'SENT',       N'Đã gửi offer',5,0),
(19,4,'ACCEPTED',   N'Ứng viên đồng ý',6,1),
(20,4,'DECLINED',   N'Ứng viên từ chối',7,1);
go

INSERT INTO JobRequests
(PositionId, RequestedBy, Quantity, StatusId, Priority, Budget, Reason,CreatedBy)
VALUES
(1,5,2,3,1,50000000,N'Mở rộng team backend',5),
(3,8,1,2,2,30000000,N'Triển khai chiến dịch mới',5);

INSERT INTO Candidates (FullName, Email, Phone)
VALUES
(N'Nguyễn Văn An', 'annguyen@gmail.com', '0901000001'),
(N'Trần Thị Bình', 'binhtran@gmail.com', '0901000002'),
(N'Lê Minh Cường', 'cuongle@gmail.com', '0901000003');
go 

INSERT INTO CVProfiles (
    CandidateId, FullName, Email, Phone,
    Summary, YearsOfExperience, Source)
VALUES
-- Intern
(1, N'Nguyễn Văn An', 'annguyen@gmail.com', '0901000001',
 N'Sinh viên CNTT năm cuối, tìm vị trí thực tập Software Engineer.',
 0, 'WEBSITE'),

-- Fresher
(2, N'Trần Thị Bình', 'binhtran@gmail.com', '0901000002',
 N'Fresher backend .NET, đã hoàn thành 2 project cá nhân.',
 1, 'REFERRAL'),

-- Junior
(3, N'Lê Minh Cường', 'cuongle@gmail.com', '0901000003',
 N'Junior Software Engineer với 2 năm kinh nghiệm ASP.NET Core.',
 2, 'SOCIAL');
go

INSERT INTO CVExperiences
(CVProfileId, CompanyName, JobTitle, StartDate, EndDate, Description)
VALUES
-- Fresher
(2, N'Công ty ABC Software', N'Thực tập Backend .NET',
 '2023-06-01', '2023-09-01',
 N'Tham gia phát triển API ASP.NET Core, làm việc với SQL Server'),

-- Junior
(3, N'Công ty XYZ Tech', N'Software Engineer',
 '2021-08-01', NULL,
 N'Phát triển hệ thống nội bộ bằng ASP.NET Core, EF Core');
 go

 INSERT INTO CVEducations
(CVProfileId, SchoolName, Degree, Major, StartYear, EndYear, GPA)
VALUES
(1, N'Đại học Công nghệ Thông tin', N'Cử nhân', N'Công nghệ phần mềm', 2021, 2025, 3.20),
(2, N'Đại học Bách Khoa', N'Cử nhân', N'Hệ thống thông tin', 2019, 2023, 3.10),
(3, N'Đại học Khoa học Tự nhiên', N'Cử nhân', N'Khoa học máy tính', 2017, 2021, 3.40);
go

INSERT INTO CVCertificates
(CVProfileId, CertificateName, Issuer, IssuedYear)
VALUES
(1, N'TOEIC 750', N'IIG Việt Nam', 2024),
(2, N'Microsoft Azure Fundamentals', N'Microsoft', 2023),
(3, N'ASP.NET Core Professional', N'FPT Software Academy', 2022);
go

INSERT INTO SkillCategories (Name) VALUES
(N'IT'),
(N'Marketing'),
(N'HR');
go

INSERT INTO Skills ( Name, CategoryId) VALUES
('C#', 1),
('ASP.NET Core', 1),
('SQL Server', 1),
('Git', 1),
('HTML/CSS', 1);
go

INSERT INTO CVSkills (CVProfileId, SkillId) VALUES
-- Intern
(1, 1),
(1, 4),
(1, 5),

-- Fresher
(2, 1),
(2, 2),
(2, 3),
(2, 4),

-- Junior
(3, 1),
(3, 2),
(3, 3),
(3, 4);
go

INSERT INTO Applications
(JobRequestId, CVProfileId, StatusId, Priority)
VALUES
(1, 1, 1, 3), -- Intern - Applied
(1, 2, 2, 2), -- Fresher - Screening
(1, 3, 3, 1); -- Junior - Interviewing
go

INSERT INTO Interviews
(ApplicationId, RoundNo, StartTime, EndTime, Location, StatusId, CreatedBy)
VALUES
(3, 1,
 '2025-01-20 09:00', '2025-01-20 10:00',
 N'Phòng họp A', 10, 4);
 go

 INSERT INTO InterviewParticipants
(InterviewId, UserId, InterviewRoleId)
VALUES
(1, 4, 1), -- HR
(1, 6, 2), -- Technical interviewer
(1, 5, 3); -- Department manager
go

INSERT INTO EvaluationTemplates (Name, CreatedBy)
VALUES (N'Backend Developer Evaluation', 1);
go

INSERT INTO EvaluationCriteria (TemplateId, Name, Weight)
VALUES
(1, N'Kiến thức chuyên môn', 40),
(1, N'Tư duy logic', 30),
(1, N'Kỹ năng giao tiếp', 20),
(1, N'Thái độ làm việc', 10);
go

INSERT INTO InterviewFeedbacks (InterviewId, InterviewerId)
VALUES
(1, 4);
go

INSERT INTO InterviewScores (FeedbackId, CriteriaId, Score)
VALUES
(1, 1, 8.5),
(1, 2, 8.0),
(1, 3, 7.5),
(1, 4, 9.0);
go

INSERT INTO Offers
(ApplicationId, ProposedSalary, StatusId, CreatedBy)
VALUES
(3, 30000000, 20, 4);
go

INSERT INTO OfferApprovals
(OfferId, ApproverId, Decision, Comment, ApprovedAt)
VALUES
(1, 5, 'APPROVED', N'Đạt yêu cầu về chuyên môn', GETDATE()),
(1, 4, 'APPROVED', N'Đồng ý mức lương đề xuất', GETDATE());
go

INSERT INTO FileTypes (Id, Code, Description) VALUES
(1, 'CV_PDF', N'File CV PDF'),
(2, 'INTERVIEW_NOTE', N'Biên bản phỏng vấn'),
(3, 'OFFER_LETTER', N'Thư mời nhận việc');


