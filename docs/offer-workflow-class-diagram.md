# Offer Workflow Class Diagram

## 1. Core Entities - Offer Domain

```mermaid
classDiagram
    class Offer {
        +int Id
        +int? ApplicationId
        +int? CandidateId
        +int? JobRequestId
        +decimal? ProposedSalary
        +string? Benefits
        +DateOnly? StartDate
        +int StatusId
        +int CreatedBy
        +DateTime? CreatedAt
        +DateTime? UpdatedAt
        +int? UpdatedBy
        +string? CandidateResponse
        +string? CandidateComment
        +DateTime? CandidateRespondedAt
        +DateTime? SentAt
        +DateTime? SentToManagerAt
        +bool? IsDeleted
    }

    class OfferApproval {
        +int Id
        +int OfferId
        +int ApproverId
        +string Decision
        +string? Comment
        +DateTime? ApprovedAt
    }

    class OfferEditHistory {
        +int Id
        +int OfferId
        +int EditedBy
        +DateTime EditedAt
        +decimal? Salary
        +string? Benefits
        +DateOnly? StartDate
    }

    class Status {
        +int Id
        +int StatusTypeId
        +string Code
        +string Name
        +int? OrderNo
        +bool? IsFinal
    }

    class StatusHistory {
        +int Id
        +int EntityTypeId
        +int EntityId
        +int? FromStatusId
        +int ToStatusId
        +int ChangedBy
        +DateTime? ChangedAt
        +string? Note
    }

    class WorkflowTransition {
        +int Id
        +int StatusTypeId
        +int FromStatusId
        +int ToStatusId
        +int RequiredRoleId
    }

    Offer ||--o{ OfferApproval : "has approvals"
    Offer ||--o{ OfferEditHistory : "has edit history"
    Offer }o--|| Status : "current status"
    StatusHistory }o--|| Status : "from/to status"
    WorkflowTransition }o--|| Status : "from/to status"
```

## 2. Related Entities - Application & Candidate Domain

```mermaid
classDiagram
    class Application {
        +int Id
        +int JobRequestId
        +int CvprofileId
        +int StatusId
        +int Priority
        +DateTime? AppliedAt
        +DateTime? UpdatedAt
        +int? UpdatedBy
        +bool? IsDeleted
        +int NoShowCount
    }

    class Candidate {
        +int Id
        +string FullName
        +string Email
        +string? Phone
        +DateTime? CreatedAt
        +int? CreatedBy
        +bool? IsDeleted
        +string? PasswordHash
        +string? GoogleId
        +string AuthProvider
        +string? AvatarUrl
    }

    class Cvprofile {
        +int Id
        +int CandidateId
        +string FullName
        +string? Email
        +string? Phone
        +string? Summary
        +int? YearsOfExperience
        +string? Source
        +DateTime? CreatedAt
        +string? CvFileUrl
        +string? Address
        +string? ProfessionalTitle
        +string? SkillsText
        +string? ReferencesText
    }

    class JobRequest {
        +int Id
        +int PositionId
        +int RequestedBy
        +int Quantity
        +int StatusId
        +int Priority
        +decimal? Budget
        +string? Reason
        +DateOnly? ExpectedStartDate
        +DateTime? CreatedAt
        +int? CreatedBy
        +DateTime? UpdatedAt
        +int? UpdatedBy
        +bool? IsDeleted
        +int? AssignedStaffId
    }

    class Position {
        +int Id
        +string Title
        +int DepartmentId
        +DateTime? CreatedAt
        +int? CreatedBy
        +bool? IsDeleted
    }

    class Department {
        +int Id
        +string Name
        +int? HeadUserId
        +DateTime? CreatedAt
        +int? CreatedBy
        +bool? IsDeleted
    }

    Application }o--|| JobRequest : "applies to"
    Application }o--|| Cvprofile : "uses CV"
    Cvprofile }o--|| Candidate : "belongs to"
    JobRequest }o--|| Position : "for position"
    Position }o--|| Department : "in department"
```

## 3. User & Role Domain

```mermaid
classDiagram
    class User {
        +int Id
        +string FullName
        +string Email
        +bool? IsActive
        +DateTime? CreatedAt
        +int? CreatedBy
        +DateTime? UpdatedAt
        +int? UpdatedBy
        +bool? IsDeleted
        +string? PasswordHash
        +string? GoogleId
        +string AuthProvider
        +string? AvatarUrl
    }

    class Role {
        +int Id
        +string Code
        +string Name
        +int? ParentRoleId
    }

    class UserDepartment {
        +int UserId
        +int DepartmentId
        +bool? IsPrimary
        +DateOnly? JoinedAt
        +DateOnly? LeftAt
    }

    User }o--o{ Role : "has roles"
    User ||--o{ UserDepartment : "assigned to"
    UserDepartment }o--|| Department : "department"
    Role ||--o{ Role : "parent role"
```

## 4. Service Layer

```mermaid
classDiagram
    class IHROffersService {
        <<interface>>
        +GetOffersAsync() List~OfferListDto~
        +GetAcceptedForStaffAsync() List~OfferListDto~
        +GetAcceptedForManagerAsync() List~OfferListDto~
        +GetPendingOffersAsync() List~OfferListDto~
        +CreateOfferAsync(dto, userId) ActionResponseDto
        +UpdateOfferAsync(id, dto, userId) ActionResponseDto
        +SendOfferAsync(id, userId) ActionResponseDto
        +SaveOfferInNegotiationAsync(id, dto, userId) ActionResponseDto
        +ForwardToDirectorAsync(id, userId) ActionResponseDto
        +SendAcceptedOffersToManagerAsync(offerIds, userId) ActionResponseDto
    }

    class ICandidateOffersService {
        <<interface>>
        +GetMyOffersAsync(candidateId) List~OfferListDto~
        +GetMyOfferByIdAsync(offerId, candidateId) OfferDetailDto
        +RespondToOfferAsync(offerId, dto, candidateId) bool
    }

    class IDirectorService {
        <<interface>>
        +GetPendingOffersAsync() List~OfferListDto~
        +GetOfferDetailAsync(id) OfferDetailDto
        +ApproveOfferAsync(request, directorId) ApprovalActionResponseDto
        +RejectOfferAsync(request, directorId) ApprovalActionResponseDto
    }

    class HROffersService {
        -IHROffersRepository _repository
        -IAuthRepository _authRepository
        -IInterviewEmailService _interviewEmailService
        +GetOffersAsync() List~OfferListDto~
        +CreateOfferAsync(dto, userId) ActionResponseDto
        +UpdateOfferAsync(id, dto, userId) ActionResponseDto
        +SendOfferAsync(id, userId) ActionResponseDto
    }

    class CandidateOffersService {
        -IHROffersRepository _repository
        -IInterviewEmailService _interviewEmailService
        -IConfiguration _configuration
        +GetMyOffersAsync(candidateId) List~OfferListDto~
        +RespondToOfferAsync(offerId, dto, candidateId) bool
    }

    class DirectorService {
        -IDirectorRepository _repository
        -IMapper _mapper
        +GetPendingOffersAsync() List~OfferListDto~
        +ApproveOfferAsync(request, directorId) ApprovalActionResponseDto
        +RejectOfferAsync(request, directorId) ApprovalActionResponseDto
    }

    HROffersService ..|> IHROffersService
    CandidateOffersService ..|> ICandidateOffersService
    DirectorService ..|> IDirectorService
```

## 5. Repository Layer

```mermaid
classDiagram
    class IHROffersRepository {
        <<interface>>
        +GetOffersAsync(statusId?) List~OfferListDto~
        +GetAcceptedForStaffAsync() List~OfferListDto~
        +GetAcceptedForManagerAsync() List~OfferListDto~
        +CreateOfferAsync(candidateId, jobRequestId, salary, benefits, startDate, userId, applicationId?) int
        +UpdateOfferAsync(offerId, salary, benefits, startDate, userId) bool
        +SendOfferAsync(offerId, userId) bool
        +CandidateRespondAsync(offerId, response, comment, candidateId) bool
        +SaveOfferEditHistoryAsync(offerId, salary, benefits, startDate, userId) bool
        +MarkAcceptedOffersSentToManagerAsync(offerIds, userId) bool
        +GetOfferByIdAsync(id) OfferDetailDto
        +GetOfferByApplicationIdAsync(applicationId) OfferListDto
    }

    class IDirectorRepository {
        <<interface>>
        +GetPendingOffersAsync() List~Offer~
        +GetOfferDetailAsync(id) Offer
        +GetOfferApprovalHistoryAsync(offerId) List~OfferApproval~
        +ApproveOfferAsync(offerId, directorId, comment) bool
        +RejectOfferAsync(offerId, directorId, comment) bool
        +GetStatusNamesAsync(statusIds) Dictionary~int, string~
        +GetStatusCodesAsync(statusIds) Dictionary~int, string~
    }

    class HROffersRepository {
        -RecruitmentDbContext _context
        +GetOffersAsync(statusId?) List~OfferListDto~
        +GetAcceptedForStaffAsync() List~OfferListDto~
        +CreateOfferAsync(...) int
        +UpdateOfferAsync(...) bool
        +SendOfferAsync(offerId, userId) bool
    }

    class DirectorRepository {
        -RecruitmentDbContext _context
        +GetPendingOffersAsync() List~Offer~
        +ApproveOfferAsync(offerId, directorId, comment) bool
        +RejectOfferAsync(offerId, directorId, comment) bool
    }

    HROffersRepository ..|> IHROffersRepository
    DirectorRepository ..|> IDirectorRepository
```

## 6. Controller Layer

```mermaid
classDiagram
    class HROffersController {
        -IHROffersService _hrOffersService
        +GetOffers() ActionResult~List~OfferListDto~~
        +GetAcceptedForStaff() ActionResult~List~OfferListDto~~
        +GetAcceptedForManager() ActionResult~List~OfferListDto~~
        +CreateOffer(dto) ActionResult~ActionResponseDto~
        +UpdateOffer(id, dto) ActionResult~ActionResponseDto~
        +SendOffer(id) ActionResult~ActionResponseDto~
        +SendAcceptedOffersToManager(dto) ActionResult~ActionResponseDto~
        +SaveOfferInNegotiation(id, dto) ActionResult~ActionResponseDto~
        +ForwardToDirector(id) ActionResult~ActionResponseDto~
    }

    class CandidateOffersController {
        -ICandidateOffersService _service
        +GetMyOffers() ActionResult~List~OfferListDto~~
        +GetMyOfferById(id) ActionResult~OfferDetailDto~
        +RespondToOffer(id, dto) ActionResult
        -GetCandidateId() int?
    }

    class DirectorOffersController {
        -IDirectorService _service
        +GetPendingOffers() ActionResult~List~OfferListDto~~
        +GetOfferDetail(id) ActionResult~OfferDetailDto~
        +ApproveOffer(id, request) ActionResult~ApprovalActionResponseDto~
        +RejectOffer(id, request) ActionResult~ApprovalActionResponseDto~
    }

    HROffersController --> IHROffersService
    CandidateOffersController --> ICandidateOffersService
    DirectorOffersController --> IDirectorService
```

## 7. DTO Classes

```mermaid
classDiagram
    class OfferListDto {
        +int Id
        +int? ApplicationId
        +int JobRequestId
        +string CandidateName
        +string PositionTitle
        +string DepartmentName
        +decimal Salary
        +string? Benefits
        +DateOnly? StartDate
        +int StatusId
        +string CurrentStatus
        +DateTime CreatedAt
        +DateTime? UpdatedAt
        +string? CandidateComment
    }

    class OfferDetailDto {
        +int? CvprofileId
        +int CandidateId
        +string? CandidateResponse
        +DateTime? CandidateRespondedAt
        +string? CandidateComment
        +DateTime? SentAt
        +List~StatusHistoryDto~ StatusHistory
        +List~OfferEditHistoryDto~ EditHistory
    }

    class OfferEditHistoryDto {
        +int Id
        +int OfferId
        +int EditedBy
        +string EditedByName
        +DateTime EditedAt
        +decimal? Salary
        +string? Benefits
        +DateOnly? StartDate
    }

    class CreateOfferDto {
        +int CandidateId
        +int JobRequestId
        +int? ApplicationId
        +decimal Salary
        +string? Benefits
        +DateOnly? StartDate
    }

    class UpdateOfferDto {
        +decimal Salary
        +string? Benefits
        +DateOnly? StartDate
    }

    class CandidateRespondDto {
        +string Response
        +string? Comment
    }

    class UpdateOfferStatusDto {
        +int OfferId
        +int ToStatusId
        +string? Note
    }

    class ActionResponseDto {
        +bool Success
        +string Message
        +object? Data
    }

    OfferDetailDto --|> OfferListDto : extends
```

## 8. Complete Relationships Overview

```mermaid
classDiagram
    class Offer {
        +int Id
        +int? ApplicationId
        +int? CandidateId
        +int? JobRequestId
        +int StatusId
    }

    class Application {
        +int Id
        +int JobRequestId
        +int CvprofileId
    }

    class Candidate {
        +int Id
        +string FullName
    }

    class JobRequest {
        +int Id
        +int PositionId
        +int RequestedBy
    }

    class Position {
        +int Id
        +int DepartmentId
    }

    class Department {
        +int Id
        +string Name
    }

    class User {
        +int Id
        +string FullName
    }

    class Status {
        +int Id
        +string Name
    }

    class OfferApproval {
        +int OfferId
        +int ApproverId
    }

    class OfferEditHistory {
        +int OfferId
        +int EditedBy
    }

    Offer }o--o| Application : "linked to"
    Offer }o--o| Candidate : "for candidate"
    Offer }o--o| JobRequest : "fulfills"
    Offer }o--|| Status : "has status"
    Offer ||--o{ OfferApproval : "approved by"
    Offer ||--o{ OfferEditHistory : "edit history"

    Application }o--|| JobRequest : "applies to"
    Application }o--|| Cvprofile : "uses CV"
    Cvprofile }o--|| Candidate : "belongs to"

    JobRequest }o--|| Position : "for position"
    JobRequest }o--|| User : "requested by"
    Position }o--|| Department : "in department"

    OfferApproval }o--|| User : "approved by"
    OfferEditHistory }o--|| User : "edited by"
```

## 9. Offer Status State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Offer
    
    DRAFT --> IN_REVIEW : Submit for Review
    DRAFT --> REJECTED : HR Manager Reject
    
    IN_REVIEW --> APPROVED : HR Manager Approve
    IN_REVIEW --> REJECTED : HR Manager Reject
    IN_REVIEW --> APPROVED_BY_DIRECTOR : Director Approve
    IN_REVIEW --> REJECTED_BY_DIRECTOR : Director Reject
    
    APPROVED --> SENT : Send to Candidate
    APPROVED_BY_DIRECTOR --> SENT : Auto-send to Candidate
    
    SENT --> ACCEPTED : Candidate Accept
    SENT --> NEGOTIATING : Candidate Negotiate
    SENT --> DECLINED : Candidate Decline
    
    NEGOTIATING --> PENDING_HR_MANAGER : Submit to HR Manager
    NEGOTIATING --> SENT : Update & Resend
    
    PENDING_HR_MANAGER --> IN_REVIEW : Forward to Director
    PENDING_HR_MANAGER --> APPROVED : HR Manager Approve
    
    ACCEPTED --> [*] : Process Complete
    DECLINED --> [*] : Process Complete
    REJECTED --> [*] : Process Complete
    REJECTED_BY_DIRECTOR --> [*] : Process Complete
```