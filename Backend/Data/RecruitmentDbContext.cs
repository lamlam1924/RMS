using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using RMS.Entity;

namespace RMS.Data;

public partial class RecruitmentDbContext : DbContext
{
    public RecruitmentDbContext(DbContextOptions<RecruitmentDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Application> Applications { get; set; }

    public virtual DbSet<Candidate> Candidates { get; set; }

    public virtual DbSet<Cvcertificate> Cvcertificates { get; set; }

    public virtual DbSet<Cveducation> Cveducations { get; set; }

    public virtual DbSet<Cvexperience> Cvexperiences { get; set; }

    public virtual DbSet<Cvprofile> Cvprofiles { get; set; }

    public virtual DbSet<Department> Departments { get; set; }

    public virtual DbSet<EntityType> EntityTypes { get; set; }

    public virtual DbSet<EvaluationCriterion> EvaluationCriteria { get; set; }

    public virtual DbSet<EvaluationTemplate> EvaluationTemplates { get; set; }

    public virtual DbSet<FileType> FileTypes { get; set; }

    public virtual DbSet<FileUploaded> FileUploadeds { get; set; }

    public virtual DbSet<Interview> Interviews { get; set; }

    public virtual DbSet<InterviewFeedback> InterviewFeedbacks { get; set; }

    public virtual DbSet<InterviewParticipant> InterviewParticipants { get; set; }

    public virtual DbSet<InterviewRole> InterviewRoles { get; set; }

    public virtual DbSet<InterviewRoundDecision> InterviewRoundDecisions { get; set; }

    public virtual DbSet<InterviewScore> InterviewScores { get; set; }

    public virtual DbSet<JobPosting> JobPostings { get; set; }

    public virtual DbSet<JobRequest> JobRequests { get; set; }

    public virtual DbSet<Offer> Offers { get; set; }

    public virtual DbSet<OfferApproval> OfferApprovals { get; set; }

    public virtual DbSet<ParticipantRequest> ParticipantRequests { get; set; }

    public virtual DbSet<Position> Positions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Skill> Skills { get; set; }

    public virtual DbSet<SkillCategory> SkillCategories { get; set; }

    public virtual DbSet<Status> Statuses { get; set; }

    public virtual DbSet<StatusHistory> StatusHistories { get; set; }

    public virtual DbSet<StatusType> StatusTypes { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserDepartment> UserDepartments { get; set; }

    public virtual DbSet<VwInterviewConflict> VwInterviewConflicts { get; set; }

    public virtual DbSet<VwNoShowStatistic> VwNoShowStatistics { get; set; }

    public virtual DbSet<WorkflowTransition> WorkflowTransitions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseCollation("Vietnamese_CI_AS");

        modelBuilder.Entity<Application>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Applicat__3214EC07CEA21B5F");

            entity.HasIndex(e => new { e.CvprofileId, e.JobRequestId }, "UQ_CV_JOB").IsUnique();

            entity.Property(e => e.AppliedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CvprofileId).HasColumnName("CVProfileId");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Cvprofile).WithMany(p => p.Applications)
                .HasForeignKey(d => d.CvprofileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Applicati__CVPro__03F0984C");

            entity.HasOne(d => d.JobRequest).WithMany(p => p.Applications)
                .HasForeignKey(d => d.JobRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Applicati__JobRe__02FC7413");

            entity.HasOne(d => d.Status).WithMany(p => p.Applications)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Applicati__Statu__04E4BC85");
        });

        modelBuilder.Entity<Candidate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Candidat__3214EC07261C11DB");

            entity.Property(e => e.AuthProvider)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("LOCAL");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.GoogleId)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Cvcertificate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CVCertif__3214EC074126F160");

            entity.ToTable("CVCertificates");

            entity.Property(e => e.CertificateName).HasMaxLength(200);
            entity.Property(e => e.CvprofileId).HasColumnName("CVProfileId");
            entity.Property(e => e.Issuer).HasMaxLength(200);

            entity.HasOne(d => d.Cvprofile).WithMany(p => p.Cvcertificates)
                .HasForeignKey(d => d.CvprofileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CVCertifi__CVPro__74AE54BC");
        });

        modelBuilder.Entity<Cveducation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CVEducat__3214EC079CA3787A");

            entity.ToTable("CVEducations");

            entity.Property(e => e.CvprofileId).HasColumnName("CVProfileId");
            entity.Property(e => e.Degree).HasMaxLength(200);
            entity.Property(e => e.Gpa)
                .HasColumnType("decimal(4, 2)")
                .HasColumnName("GPA");
            entity.Property(e => e.Major).HasMaxLength(200);
            entity.Property(e => e.SchoolName).HasMaxLength(200);

            entity.HasOne(d => d.Cvprofile).WithMany(p => p.Cveducations)
                .HasForeignKey(d => d.CvprofileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CVEducati__CVPro__71D1E811");
        });

        modelBuilder.Entity<Cvexperience>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CVExperi__3214EC0773E761FA");

            entity.ToTable("CVExperiences");

            entity.Property(e => e.CompanyName).HasMaxLength(200);
            entity.Property(e => e.CvprofileId).HasColumnName("CVProfileId");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.JobTitle).HasMaxLength(200);

            entity.HasOne(d => d.Cvprofile).WithMany(p => p.Cvexperiences)
                .HasForeignKey(d => d.CvprofileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CVExperie__CVPro__6EF57B66");
        });

        modelBuilder.Entity<Cvprofile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CVProfil__3214EC07CC90589F");

            entity.ToTable("CVProfiles");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Phone)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Source)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Summary).HasMaxLength(1000);

            entity.HasOne(d => d.Candidate).WithMany(p => p.Cvprofiles)
                .HasForeignKey(d => d.CandidateId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CVProfile__Candi__6C190EBB");

            entity.HasMany(d => d.Skills).WithMany(p => p.Cvprofiles)
                .UsingEntity<Dictionary<string, object>>(
                    "Cvskill",
                    r => r.HasOne<Skill>().WithMany()
                        .HasForeignKey("SkillId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__CVSkills__SkillI__7D439ABD"),
                    l => l.HasOne<Cvprofile>().WithMany()
                        .HasForeignKey("CvprofileId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__CVSkills__CVProf__7C4F7684"),
                    j =>
                    {
                        j.HasKey("CvprofileId", "SkillId").HasName("PK__CVSkills__A93144F4A3D6BB6F");
                        j.ToTable("CVSkills");
                        j.IndexerProperty<int>("CvprofileId").HasColumnName("CVProfileId");
                    });
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Departme__3214EC075A09711A");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.HeadUser).WithMany(p => p.Departments)
                .HasForeignKey(d => d.HeadUserId)
                .HasConstraintName("FK__Departmen__HeadU__4CA06362");
        });

        modelBuilder.Entity<EntityType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__EntityTy__3214EC070D3769CD");

            entity.HasIndex(e => e.Code, "UQ__EntityTy__A25C5AA76748B3D3").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<EvaluationCriterion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Evaluati__3214EC0721E2010C");

            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Weight).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Template).WithMany(p => p.EvaluationCriteria)
                .HasForeignKey(d => d.TemplateId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Evaluatio__Templ__160F4887");
        });

        modelBuilder.Entity<EvaluationTemplate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Evaluati__3214EC077F390799");

            entity.HasIndex(e => new { e.PositionId, e.RoundNo }, "IX_EvaluationTemplates_Position_Round");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Name).HasMaxLength(200);

            entity.HasOne(d => d.Position).WithMany(p => p.EvaluationTemplates)
                .HasForeignKey(d => d.PositionId)
                .HasConstraintName("FK_EvalTemplate_Position");
        });

        modelBuilder.Entity<FileType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__FileType__3214EC07A39E8F79");

            entity.HasIndex(e => e.Code, "UQ__FileType__A25C5AA7C42AA504").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<FileUploaded>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Files__3214EC0731959CA0");

            entity.ToTable("FileUploaded");

            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.FileUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.PublicId)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.StorageProvider)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.EntityType).WithMany(p => p.FileUploadeds)
                .HasForeignKey(d => d.EntityTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Files__EntityTyp__30C33EC3");

            entity.HasOne(d => d.FileType).WithMany(p => p.FileUploadeds)
                .HasForeignKey(d => d.FileTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Files__FileTypeI__2FCF1A8A");
        });

        modelBuilder.Entity<Interview>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Intervie__3214EC07F8C1E15A");

            entity.HasIndex(e => new { e.StartTime, e.EndTime, e.StatusId, e.IsDeleted }, "IX_Interviews_Time_Status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.MeetingLink).HasMaxLength(300);
            entity.Property(e => e.RequiresFeedbackBy).HasColumnType("datetime");
            entity.Property(e => e.StartTime).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Application).WithMany(p => p.Interviews)
                .HasForeignKey(d => d.ApplicationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Appli__09A971A2");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InterviewCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Creat__0B91BA14");

            entity.HasOne(d => d.Status).WithMany(p => p.Interviews)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Statu__0A9D95DB");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.InterviewUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_Interview_UpdatedBy");
        });

        modelBuilder.Entity<InterviewFeedback>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Intervie__3214EC07BC629B08");

            entity.HasIndex(e => new { e.InterviewId, e.InterviewerId }, "IX_InterviewFeedbacks_Interview_Interviewer");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.Recommendation)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.HasOne(d => d.Interview).WithMany(p => p.InterviewFeedbacks)
                .HasForeignKey(d => d.InterviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Inter__19DFD96B");

            entity.HasOne(d => d.Interviewer).WithMany(p => p.InterviewFeedbacks)
                .HasForeignKey(d => d.InterviewerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Inter__1AD3FDA4");
        });

        modelBuilder.Entity<InterviewParticipant>(entity =>
        {
            entity.HasKey(e => new { e.InterviewId, e.UserId }).HasName("PK__Intervie__1804D49622F7F85D");

            entity.HasIndex(e => new { e.UserId, e.InterviewId }, "IX_InterviewParticipants_User_Interview");

            entity.HasOne(d => d.Interview).WithMany(p => p.InterviewParticipants)
                .HasForeignKey(d => d.InterviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Inter__0E6E26BF");

            entity.HasOne(d => d.InterviewRole).WithMany(p => p.InterviewParticipants)
                .HasForeignKey(d => d.InterviewRoleId)
                .HasConstraintName("FK__Interview__Inter__10566F31");

            entity.HasOne(d => d.User).WithMany(p => p.InterviewParticipants)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__UserI__0F624AF8");
        });

        modelBuilder.Entity<InterviewRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Intervie__3214EC07CD7E31B2");

            entity.HasIndex(e => e.Code, "UQ__Intervie__A25C5AA75B6EA176").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<InterviewRoundDecision>(entity =>
        {
            entity.HasKey(e => e.InterviewId).HasName("PK__Intervie__C97C58528A499B4D");

            entity.Property(e => e.InterviewId).ValueGeneratedNever();
            entity.Property(e => e.DecidedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DecisionCode)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.Note).HasMaxLength(1000);

            entity.HasOne(d => d.DecidedByNavigation).WithMany(p => p.InterviewRoundDecisions)
                .HasForeignKey(d => d.DecidedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InterviewRoundDecisions_DecidedBy");

            entity.HasOne(d => d.Interview).WithOne(p => p.InterviewRoundDecision)
                .HasForeignKey<InterviewRoundDecision>(d => d.InterviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InterviewRoundDecisions_Interview");
        });

        modelBuilder.Entity<InterviewScore>(entity =>
        {
            entity.HasKey(e => new { e.FeedbackId, e.CriteriaId }).HasName("PK__Intervie__A5AD406A51D9F053");

            entity.Property(e => e.Score).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Criteria).WithMany(p => p.InterviewScores)
                .HasForeignKey(d => d.CriteriaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Crite__1EA48E88");

            entity.HasOne(d => d.Feedback).WithMany(p => p.InterviewScores)
                .HasForeignKey(d => d.FeedbackId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Interview__Feedb__1DB06A4F");
        });

        modelBuilder.Entity<JobPosting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__JobPosti__3214EC07A0D3921C");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Location).HasMaxLength(200);
            entity.Property(e => e.SalaryMax).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SalaryMin).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Title).HasMaxLength(300);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.AssignedStaff).WithMany(p => p.JobPostingAssignedStaffs)
                .HasForeignKey(d => d.AssignedStaffId)
                .HasConstraintName("FK_JobPostings_AssignedStaff");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.JobPostingCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK__JobPostin__Creat__662B2B3B");

            entity.HasOne(d => d.JobRequest).WithMany(p => p.JobPostings)
                .HasForeignKey(d => d.JobRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__JobPostin__JobRe__6442E2C9");

            entity.HasOne(d => d.Status).WithMany(p => p.JobPostings)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__JobPostin__Statu__65370702");
        });

        modelBuilder.Entity<JobRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__JobReque__3214EC079BFEA3C8");

            entity.Property(e => e.Budget).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.LastReturnedAt).HasColumnType("datetime");
            entity.Property(e => e.LastViewedByManagerAt).HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.AssignedStaff).WithMany(p => p.JobRequestAssignedStaffs)
                .HasForeignKey(d => d.AssignedStaffId)
                .HasConstraintName("FK_JobRequests_AssignedStaff");

            entity.HasOne(d => d.Position).WithMany(p => p.JobRequests)
                .HasForeignKey(d => d.PositionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__JobReques__Posit__5629CD9C");

            entity.HasOne(d => d.RequestedByNavigation).WithMany(p => p.JobRequestRequestedByNavigations)
                .HasForeignKey(d => d.RequestedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__JobReques__Reque__571DF1D5");
        });

        modelBuilder.Entity<Offer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Offers__3214EC07E812C1E8");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.ProposedSalary).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Application).WithMany(p => p.Offers)
                .HasForeignKey(d => d.ApplicationId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Offers_Application");

            entity.HasOne(d => d.Candidate).WithMany()
                .HasForeignKey(d => d.CandidateId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Offers_Candidate");

            entity.HasOne(d => d.JobRequest).WithMany()
                .HasForeignKey(d => d.JobRequestId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Offers_JobRequest");

            entity.HasOne(d => d.Status).WithMany(p => p.Offers)
                .HasForeignKey(d => d.StatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Offers__StatusId__245D67DE");
        });

        modelBuilder.Entity<OfferApproval>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OfferApp__3214EC07DBB3B7E6");

            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.Comment).HasMaxLength(500);
            entity.Property(e => e.Decision)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.Approver).WithMany(p => p.OfferApprovals)
                .HasForeignKey(d => d.ApproverId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__OfferAppr__Appro__282DF8C2");

            entity.HasOne(d => d.Offer).WithMany(p => p.OfferApprovals)
                .HasForeignKey(d => d.OfferId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__OfferAppr__Offer__2739D489");
        });

        modelBuilder.Entity<ParticipantRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Particip__3214EC0701BCBF89");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.RequiredCount).HasDefaultValue(1);
            entity.Property(e => e.RespondedAt).HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("PENDING");

            entity.HasOne(d => d.AssignedToUser).WithMany(p => p.ParticipantRequestAssignedToUsers)
                .HasForeignKey(d => d.AssignedToUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PR_AssignedTo");

            entity.HasOne(d => d.ForwardedToUser).WithMany(p => p.ParticipantRequestForwardedToUsers)
                .HasForeignKey(d => d.ForwardedToUserId)
                .HasConstraintName("FK_PR_ForwardedTo");

            entity.HasOne(d => d.Interview).WithMany(p => p.ParticipantRequests)
                .HasForeignKey(d => d.InterviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PR_Interview");

            entity.HasOne(d => d.RequestedByUser).WithMany(p => p.ParticipantRequestRequestedByUsers)
                .HasForeignKey(d => d.RequestedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PR_RequestedBy");
        });

        modelBuilder.Entity<Position>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Position__3214EC0739E234E7");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Department).WithMany(p => p.Positions)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Positions__Depar__5165187F");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RefreshT__3214EC074AAA3AB7");

            entity.HasIndex(e => e.Token, "IX_RefreshTokens_Token");

            entity.HasIndex(e => e.UserId, "IX_RefreshTokens_UserId");

            entity.HasIndex(e => e.Token, "UQ__RefreshT__1EB4F8174F403807").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Token).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RefreshTokens_Users");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Roles__3214EC07BB9A666C");

            entity.HasIndex(e => e.Code, "UQ__Roles__A25C5AA7160EFCA9").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.ParentRole).WithMany(p => p.InverseParentRole)
                .HasForeignKey(d => d.ParentRoleId)
                .HasConstraintName("FK__Roles__ParentRol__440B1D61");
        });

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Skills__3214EC0722D1D309");

            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.Category).WithMany(p => p.Skills)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Skills__Category__797309D9");
        });

        modelBuilder.Entity<SkillCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SkillCat__3214EC07473587FC");

            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Status>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Statuses__3214EC0770E7DF2B");

            entity.HasIndex(e => new { e.StatusTypeId, e.Code }, "UQ__Statuses__D26AF9D874D9AD4B").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IsFinal).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.StatusType).WithMany(p => p.Statuses)
                .HasForeignKey(d => d.StatusTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Statuses__Status__5EBF139D");
        });

        modelBuilder.Entity<StatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StatusHi__3214EC070A07EF20");

            entity.HasIndex(e => new { e.EntityTypeId, e.ToStatusId, e.ChangedAt }, "IX_StatusHistories_EntityType_Status");

            entity.Property(e => e.ChangedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(d => d.ChangedByNavigation).WithMany(p => p.StatusHistories)
                .HasForeignKey(d => d.ChangedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__StatusHis__Chang__37703C52");

            entity.HasOne(d => d.EntityType).WithMany(p => p.StatusHistories)
                .HasForeignKey(d => d.EntityTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__StatusHis__Entit__3493CFA7");

            entity.HasOne(d => d.FromStatus).WithMany(p => p.StatusHistoryFromStatuses)
                .HasForeignKey(d => d.FromStatusId)
                .HasConstraintName("FK__StatusHis__FromS__3587F3E0");

            entity.HasOne(d => d.ToStatus).WithMany(p => p.StatusHistoryToStatuses)
                .HasForeignKey(d => d.ToStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__StatusHis__ToSta__367C1819");
        });

        modelBuilder.Entity<StatusType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StatusTy__3214EC07EC9260E3");

            entity.HasIndex(e => e.Code, "UQ__StatusTy__A25C5AA7DCBE1410").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC07BBCDB2C3");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534A1F75360").IsUnique();

            entity.Property(e => e.AuthProvider)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("LOCAL");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.GoogleId)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRole",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__UserRoles__RoleI__47DBAE45"),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__UserRoles__UserI__46E78A0C"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId").HasName("PK__UserRole__AF2760ADF8BBA5B1");
                        j.ToTable("UserRoles");
                    });
        });

        modelBuilder.Entity<UserDepartment>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.DepartmentId }).HasName("PK__UserDepa__DCA8B5F2B3A41EF4");

            entity.Property(e => e.IsPrimary).HasDefaultValue(true);
            entity.Property(e => e.JoinedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Department).WithMany(p => p.UserDepartments)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserDepar__Depar__3F115E1A");

            entity.HasOne(d => d.User).WithMany(p => p.UserDepartments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserDepar__UserI__3E1D39E1");
        });

        modelBuilder.Entity<VwInterviewConflict>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_InterviewConflicts");

            entity.Property(e => e.ConflictType)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ConflictingUserName).HasMaxLength(200);
            entity.Property(e => e.Interview1Candidate).HasMaxLength(200);
            entity.Property(e => e.Interview1End).HasColumnType("datetime");
            entity.Property(e => e.Interview1Start).HasColumnType("datetime");
            entity.Property(e => e.Interview2Candidate).HasMaxLength(200);
            entity.Property(e => e.Interview2End).HasColumnType("datetime");
            entity.Property(e => e.Interview2Start).HasColumnType("datetime");
        });

        modelBuilder.Entity<VwNoShowStatistic>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_NoShowStatistics");

            entity.Property(e => e.CandidateEmail)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.CandidateName).HasMaxLength(200);
            entity.Property(e => e.LastNoShowDate).HasColumnType("datetime");
        });

        modelBuilder.Entity<WorkflowTransition>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Workflow__3214EC0789F7C5C0");

            entity.HasOne(d => d.FromStatus).WithMany(p => p.WorkflowTransitionFromStatuses)
                .HasForeignKey(d => d.FromStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WorkflowT__FromS__628FA481");

            entity.HasOne(d => d.RequiredRole).WithMany(p => p.WorkflowTransitions)
                .HasForeignKey(d => d.RequiredRoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WorkflowT__Requi__6477ECF3");

            entity.HasOne(d => d.StatusType).WithMany(p => p.WorkflowTransitions)
                .HasForeignKey(d => d.StatusTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WorkflowT__Statu__619B8048");

            entity.HasOne(d => d.ToStatus).WithMany(p => p.WorkflowTransitionToStatuses)
                .HasForeignKey(d => d.ToStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WorkflowT__ToSta__6383C8BA");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
