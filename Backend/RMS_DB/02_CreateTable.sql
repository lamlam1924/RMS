

/* =========================================================
   CORE LOOKUP TABLES
   ========================================================= */

CREATE TABLE EntityTypes (
    Id INT PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(200)
);

CREATE TABLE InterviewRoles (
    Id INT PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(100)
);

GO
/* =========================================================
   USER – ROLE – DEPARTMENT
   ========================================================= */

CREATE TABLE Users (
    Id INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    Email VARCHAR(200) UNIQUE NOT NULL,
	PasswordHash VARCHAR(255) NULL,
    GoogleId VARCHAR(100) NULL,
    AuthProvider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    IsActive BIT DEFAULT 1,

    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,
    UpdatedAt DATETIME,
    UpdatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT
);

CREATE TABLE Roles (
    Id INT PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    ParentRoleId INT NULL,

    FOREIGN KEY (ParentRoleId) REFERENCES Roles(Id)
);

CREATE TABLE UserRoles (
    UserId INT,
    RoleId INT,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

CREATE TABLE Departments (
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    HeadUserId INT,

    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (HeadUserId) REFERENCES Users(Id)
);

CREATE TABLE UserDepartments (
    UserId INT NOT NULL,
    DepartmentId INT NOT NULL,
    IsPrimary BIT DEFAULT 1,
    JoinedAt DATE DEFAULT GETDATE(),
    LeftAt DATE NULL,

    PRIMARY KEY (UserId, DepartmentId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);

GO

/* =========================================================
   POSITION & JOB REQUEST
   ========================================================= */

CREATE TABLE Positions (
    Id INT IDENTITY PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    DepartmentId INT NOT NULL,

    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);

CREATE TABLE JobRequests (
    Id INT IDENTITY PRIMARY KEY,
    PositionId INT NOT NULL,
    RequestedBy INT NOT NULL,
    Quantity INT NOT NULL,

    StatusId INT NOT NULL,
    Priority INT NOT NULL,

    Budget DECIMAL(18,2),
    Reason NVARCHAR(500),
    ExpectedStartDate DATE,

    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,
    UpdatedAt DATETIME,
    UpdatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (PositionId) REFERENCES Positions(Id),
    FOREIGN KEY (RequestedBy) REFERENCES Users(Id)
);

GO

/* =========================================================
   STATUS ENGINE
   ========================================================= */

CREATE TABLE StatusTypes (
    Id INT PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(200)
);

GO

CREATE TABLE Statuses (
    Id INT PRIMARY KEY,
    StatusTypeId INT NOT NULL,
    Code VARCHAR(50) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    OrderNo INT,
    IsFinal BIT DEFAULT 0,

    FOREIGN KEY (StatusTypeId) REFERENCES StatusTypes(Id),
    UNIQUE (StatusTypeId, Code)
);

CREATE TABLE WorkflowTransitions (
    Id INT IDENTITY PRIMARY KEY,
    StatusTypeId INT NOT NULL,
    FromStatusId INT NOT NULL,
    ToStatusId INT NOT NULL,
    RequiredRoleId INT NOT NULL,

    FOREIGN KEY (StatusTypeId) REFERENCES StatusTypes(Id),
    FOREIGN KEY (FromStatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (ToStatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (RequiredRoleId) REFERENCES Roles(Id)
);

GO

/* =========================================================
   CANDIDATE & CV
   ========================================================= */

CREATE TABLE Candidates (
    Id INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    Email VARCHAR(200) NOT NULL,
    Phone VARCHAR(50),
	PasswordHash VARCHAR(255) NULL,
    GoogleId VARCHAR(100) NULL,
    AuthProvider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',

    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT
);

CREATE TABLE CVProfiles (
    Id INT IDENTITY PRIMARY KEY,
    CandidateId INT NOT NULL,

    FullName NVARCHAR(200) NOT NULL,
    Email VARCHAR(200),
    Phone VARCHAR(50),

    Summary NVARCHAR(1000),
    YearsOfExperience INT,
    Source VARCHAR(50),

    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CandidateId) REFERENCES Candidates(Id)
);

CREATE TABLE CVExperiences (
    Id INT IDENTITY PRIMARY KEY,
    CVProfileId INT NOT NULL,
    CompanyName NVARCHAR(200) NOT NULL,
    JobTitle NVARCHAR(200) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    Description NVARCHAR(1000),

    FOREIGN KEY (CVProfileId) REFERENCES CVProfiles(Id)
);

CREATE TABLE CVEducations (
    Id INT IDENTITY PRIMARY KEY,
    CVProfileId INT NOT NULL,
    SchoolName NVARCHAR(200) NOT NULL,
    Degree NVARCHAR(200),
    Major NVARCHAR(200),
    StartYear INT,
    EndYear INT,
    GPA DECIMAL(4,2),

    FOREIGN KEY (CVProfileId) REFERENCES CVProfiles(Id)
);

CREATE TABLE CVCertificates (
    Id INT IDENTITY PRIMARY KEY,
    CVProfileId INT NOT NULL,
    CertificateName NVARCHAR(200) NOT NULL,
    Issuer NVARCHAR(200),
    IssuedYear INT,

    FOREIGN KEY (CVProfileId) REFERENCES CVProfiles(Id)
);
GO

/* =========================================================
   SKILL 
   ========================================================= */

CREATE TABLE SkillCategories (
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL -- IT, Marketing, HR
);

CREATE TABLE Skills (
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL, -- C#, Java, SEO
    CategoryId INT NOT NULL,

    FOREIGN KEY (CategoryId) REFERENCES SkillCategories(Id)
);

CREATE TABLE CVSkills (
    CVProfileId INT NOT NULL,
    SkillId INT NOT NULL,

    PRIMARY KEY (CVProfileId, SkillId),
    FOREIGN KEY (CVProfileId) REFERENCES CVProfiles(Id),
    FOREIGN KEY (SkillId) REFERENCES Skills(Id)
);
GO
/* =========================================================
   APPLICATION
   ========================================================= */

CREATE TABLE Applications (
    Id INT IDENTITY PRIMARY KEY,
    JobRequestId INT NOT NULL,
    CVProfileId INT NOT NULL,

    StatusId INT NOT NULL,
    Priority INT NOT NULL,

    AppliedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME,
    UpdatedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (JobRequestId) REFERENCES JobRequests(Id),
    FOREIGN KEY (CVProfileId) REFERENCES CVProfiles(Id),
    FOREIGN KEY (StatusId) REFERENCES Statuses(Id),

    CONSTRAINT UQ_CV_JOB UNIQUE (CVProfileId, JobRequestId)
);
GO
/* =========================================================
   INTERVIEW
   ========================================================= */

CREATE TABLE Interviews (
    Id INT IDENTITY PRIMARY KEY,
    ApplicationId INT NOT NULL,
    RoundNo INT NOT NULL,

    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,

    Location NVARCHAR(200),
    MeetingLink NVARCHAR(300),

    StatusId INT NOT NULL,

    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    FOREIGN KEY (StatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE TABLE InterviewParticipants (
    InterviewId INT,
    UserId INT,
    InterviewRoleId INT,
    PRIMARY KEY (InterviewId, UserId),

    FOREIGN KEY (InterviewId) REFERENCES Interviews(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (InterviewRoleId) REFERENCES InterviewRoles(Id)
);
GO
/* =========================================================
   EVALUATION
   ========================================================= */

CREATE TABLE EvaluationTemplates (
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE EvaluationCriteria (
    Id INT IDENTITY PRIMARY KEY,
    TemplateId INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Weight DECIMAL(5,2) NOT NULL,

    FOREIGN KEY (TemplateId) REFERENCES EvaluationTemplates(Id)
);

CREATE TABLE InterviewFeedbacks (
    Id INT IDENTITY PRIMARY KEY,
    InterviewId INT NOT NULL,
    InterviewerId INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (InterviewId) REFERENCES Interviews(Id),
    FOREIGN KEY (InterviewerId) REFERENCES Users(Id)
);

CREATE TABLE InterviewScores (
    FeedbackId INT,
    CriteriaId INT,
    Score DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (FeedbackId, CriteriaId),

    FOREIGN KEY (FeedbackId) REFERENCES InterviewFeedbacks(Id),
    FOREIGN KEY (CriteriaId) REFERENCES EvaluationCriteria(Id)
);
GO
/* =========================================================
   OFFER
   ========================================================= */

CREATE TABLE Offers (
    Id INT IDENTITY PRIMARY KEY,
    ApplicationId INT NOT NULL,
    ProposedSalary DECIMAL(18,2),
    StatusId INT NOT NULL,

    CreatedBy INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (ApplicationId) REFERENCES Applications(Id),
    FOREIGN KEY (StatusId) REFERENCES Statuses(Id)
);

CREATE TABLE OfferApprovals (
    Id INT IDENTITY PRIMARY KEY,
    OfferId INT NOT NULL,
    ApproverId INT NOT NULL,

    Decision VARCHAR(20) NOT NULL,
    Comment NVARCHAR(500),
    ApprovedAt DATETIME,

    FOREIGN KEY (OfferId) REFERENCES Offers(Id),
    FOREIGN KEY (ApproverId) REFERENCES Users(Id)
);
GO
/* =========================================================
   FILE STORAGE
   ========================================================= */

CREATE TABLE FileTypes (
    Id INT PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(200)
);

CREATE TABLE FileUploaded (
    Id INT IDENTITY PRIMARY KEY,
    FileTypeId INT NOT NULL,
    EntityTypeId INT NOT NULL,
    EntityId INT NOT NULL,

    StorageProvider VARCHAR(50),
    PublicId VARCHAR(200) NOT NULL,
    FileUrl VARCHAR(500) NOT NULL,

    UploadedAt DATETIME DEFAULT GETDATE(),
    UploadedBy INT,

    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME,
    DeletedBy INT,

    FOREIGN KEY (FileTypeId) REFERENCES FileTypes(Id),
    FOREIGN KEY (EntityTypeId) REFERENCES EntityTypes(Id)
);
GO
/* =========================================================
   STATUS HISTORY
   ========================================================= */

CREATE TABLE StatusHistories (
    Id INT IDENTITY PRIMARY KEY,
    EntityTypeId INT NOT NULL,
    EntityId INT NOT NULL,

    FromStatusId INT,
    ToStatusId INT NOT NULL,

    ChangedBy INT NOT NULL,
    ChangedAt DATETIME DEFAULT GETDATE(),
    Note NVARCHAR(500),

    FOREIGN KEY (EntityTypeId) REFERENCES EntityTypes(Id),
    FOREIGN KEY (FromStatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (ToStatusId) REFERENCES Statuses(Id),
    FOREIGN KEY (ChangedBy) REFERENCES Users(Id)
);
GO