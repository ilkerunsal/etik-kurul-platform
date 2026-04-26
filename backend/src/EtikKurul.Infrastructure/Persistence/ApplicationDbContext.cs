using EtikKurul.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserVerificationCode> UserVerificationCodes => Set<UserVerificationCode>();
    public DbSet<UserIdentityCheck> UserIdentityChecks => Set<UserIdentityCheck>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Committee> Committees => Set<Committee>();
    public DbSet<CommitteeVersion> CommitteeVersions => Set<CommitteeVersion>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<ApplicationParty> ApplicationParties => Set<ApplicationParty>();
    public DbSet<RoutingAssessment> RoutingAssessments => Set<RoutingAssessment>();
    public DbSet<ApplicationForm> ApplicationForms => Set<ApplicationForm>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<ApplicationChecklist> ApplicationChecklists => Set<ApplicationChecklist>();
    public DbSet<ApplicationExpertAssignment> ApplicationExpertAssignments => Set<ApplicationExpertAssignment>();
    public DbSet<ApplicationExpertReviewDecision> ApplicationExpertReviewDecisions => Set<ApplicationExpertReviewDecision>();
    public DbSet<ApplicationRevisionResponse> ApplicationRevisionResponses => Set<ApplicationRevisionResponse>();
    public DbSet<ApplicationReviewPackage> ApplicationReviewPackages => Set<ApplicationReviewPackage>();
    public DbSet<ApplicationCommitteeAgendaItem> ApplicationCommitteeAgendaItems => Set<ApplicationCommitteeAgendaItem>();
    public DbSet<ApplicationCommitteeDecision> ApplicationCommitteeDecisions => Set<ApplicationCommitteeDecision>();
    public DbSet<ApplicationCommitteeRevisionResponse> ApplicationCommitteeRevisionResponses => Set<ApplicationCommitteeRevisionResponse>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(builder =>
        {
            builder.ToTable("users");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(150).IsRequired();
            builder.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(150).IsRequired();
            builder.Property(x => x.TcknEncrypted).HasColumnName("tckn_encrypted").HasColumnType("text").IsRequired();
            builder.Property(x => x.BirthDateEncrypted).HasColumnName("birth_date_encrypted").HasColumnType("text").IsRequired();
            builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
            builder.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(32).IsRequired();
            builder.Property(x => x.PasswordHash).HasColumnName("password_hash").HasColumnType("text").IsRequired();
            builder.Property(x => x.AccountStatus).HasColumnName("account_status").HasConversion<string>().HasMaxLength(64).IsRequired();
            builder.Property(x => x.IsIdentityVerified).HasColumnName("is_identity_verified").IsRequired();
            builder.Property(x => x.IdentityVerifiedAt).HasColumnName("identity_verified_at");
            builder.Property(x => x.EmailVerified).HasColumnName("email_verified").IsRequired();
            builder.Property(x => x.PhoneVerified).HasColumnName("phone_verified").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
            builder.HasIndex(x => x.Email).IsUnique();
            builder.HasIndex(x => x.Phone).IsUnique();
        });

        modelBuilder.Entity<UserVerificationCode>(builder =>
        {
            builder.ToTable("user_verification_codes");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            builder.Property(x => x.ChannelType).HasColumnName("channel_type").HasConversion<string>().HasMaxLength(16).IsRequired();
            builder.Property(x => x.CodeHash).HasColumnName("code_hash").HasColumnType("text").IsRequired();
            builder.Property(x => x.ExpiresAt).HasColumnName("expires_at").IsRequired();
            builder.Property(x => x.UsedAt).HasColumnName("used_at");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasOne(x => x.User).WithMany(x => x.VerificationCodes).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserIdentityCheck>(builder =>
        {
            builder.ToTable("user_identity_checks");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            builder.Property(x => x.ProviderName).HasColumnName("provider_name").HasMaxLength(128).IsRequired();
            builder.Property(x => x.Success).HasColumnName("success").IsRequired();
            builder.Property(x => x.ResponseCode).HasColumnName("response_code").HasMaxLength(128).IsRequired();
            builder.Property(x => x.RequestHash).HasColumnName("request_hash").HasMaxLength(128).IsRequired();
            builder.Property(x => x.ResultMaskedJson).HasColumnName("result_masked_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.CheckedAt).HasColumnName("checked_at").IsRequired();
            builder.HasOne(x => x.User).WithMany(x => x.IdentityChecks).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserProfile>(builder =>
        {
            builder.ToTable("user_profiles");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            builder.Property(x => x.AcademicTitle).HasColumnName("academic_title").HasMaxLength(128);
            builder.Property(x => x.DegreeLevel).HasColumnName("degree_level").HasMaxLength(128);
            builder.Property(x => x.InstitutionName).HasColumnName("institution_name").HasMaxLength(256);
            builder.Property(x => x.FacultyName).HasColumnName("faculty_name").HasMaxLength(256);
            builder.Property(x => x.DepartmentName).HasColumnName("department_name").HasMaxLength(256);
            builder.Property(x => x.PositionTitle).HasColumnName("position_title").HasMaxLength(256);
            builder.Property(x => x.Biography).HasColumnName("biography").HasColumnType("text");
            builder.Property(x => x.SpecializationSummary).HasColumnName("specialization_summary").HasColumnType("text");
            builder.Property(x => x.HasESignature).HasColumnName("has_e_signature").IsRequired();
            builder.Property(x => x.KepAddress).HasColumnName("kep_address").HasMaxLength(320);
            builder.Property(x => x.CvDocumentId).HasColumnName("cv_document_id");
            builder.Property(x => x.ProfileCompletionPercent).HasColumnName("profile_completion_percent").IsRequired();
            builder.HasIndex(x => x.UserId).IsUnique();
            builder.HasOne(x => x.User).WithOne(x => x.Profile).HasForeignKey<UserProfile>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Role>(builder =>
        {
            builder.ToTable("roles");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(128).IsRequired();
            builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(256).IsRequired();
            builder.HasIndex(x => x.Code).IsUnique();
            builder.HasData(RoleSeedData.All);
        });

        modelBuilder.Entity<UserRole>(builder =>
        {
            builder.ToTable("user_roles");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            builder.Property(x => x.RoleId).HasColumnName("role_id").IsRequired();
            builder.Property(x => x.Active).HasColumnName("active").IsRequired();
            builder.Property(x => x.AssignedAt).HasColumnName("assigned_at").IsRequired();
            builder.HasIndex(x => new { x.UserId, x.RoleId }).IsUnique();
            builder.HasOne(x => x.User).WithMany(x => x.UserRoles).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Committee>(builder =>
        {
            builder.ToTable("committees");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Code).HasColumnName("code").HasMaxLength(128).IsRequired();
            builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(256).IsRequired();
            builder.Property(x => x.Category).HasColumnName("category").HasMaxLength(128);
            builder.Property(x => x.Active).HasColumnName("active").IsRequired();
            builder.HasIndex(x => x.Code).IsUnique();
            builder.HasData(CommitteeSeedData.All);
        });

        modelBuilder.Entity<CommitteeVersion>(builder =>
        {
            builder.ToTable("committee_versions");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CommitteeId).HasColumnName("committee_id").IsRequired();
            builder.Property(x => x.VersionNo).HasColumnName("version_no").IsRequired();
            builder.Property(x => x.EffectiveFrom).HasColumnName("effective_from").IsRequired();
            builder.Property(x => x.EffectiveTo).HasColumnName("effective_to");
            builder.Property(x => x.RulesJson).HasColumnName("rules_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.TemplatesJson).HasColumnName("templates_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.Notes).HasColumnName("notes").HasColumnType("text");
            builder.HasIndex(x => new { x.CommitteeId, x.VersionNo }).IsUnique();
            builder.HasOne(x => x.Committee).WithMany(x => x.Versions).HasForeignKey(x => x.CommitteeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Application>(builder =>
        {
            builder.ToTable("applications");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.PublicRefNo).HasColumnName("public_ref_no").HasMaxLength(128);
            builder.Property(x => x.ApplicantUserId).HasColumnName("applicant_user_id").IsRequired();
            builder.Property(x => x.CommitteeId).HasColumnName("committee_id");
            builder.Property(x => x.CommitteeVersionId).HasColumnName("committee_version_id");
            builder.Property(x => x.EntryMode).HasColumnName("entry_mode").HasConversion<string>().HasMaxLength(32);
            builder.Property(x => x.CommitteeSelectionSource).HasColumnName("committee_selection_source").HasMaxLength(64);
            builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(512);
            builder.Property(x => x.Summary).HasColumnName("summary").HasColumnType("text");
            builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(64).IsRequired();
            builder.Property(x => x.CurrentStep).HasColumnName("current_step").HasConversion<string>().HasMaxLength(128).IsRequired();
            builder.Property(x => x.RoutingConfidence).HasColumnName("routing_confidence").HasColumnType("numeric(5,4)");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
            builder.Property(x => x.SubmittedAt).HasColumnName("submitted_at");
            builder.HasIndex(x => x.ApplicantUserId);
            builder.HasOne(x => x.ApplicantUser).WithMany(x => x.Applications).HasForeignKey(x => x.ApplicantUserId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(x => x.Committee).WithMany(x => x.Applications).HasForeignKey(x => x.CommitteeId).OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(x => x.CommitteeVersion).WithMany(x => x.Applications).HasForeignKey(x => x.CommitteeVersionId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ApplicationParty>(builder =>
        {
            builder.ToTable("application_parties");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
            builder.Property(x => x.PartyRole).HasColumnName("party_role").HasMaxLength(64).IsRequired();
            builder.Property(x => x.FullNameSnapshot).HasColumnName("full_name_snapshot").HasMaxLength(256);
            builder.Property(x => x.InstitutionSnapshot).HasColumnName("institution_snapshot").HasMaxLength(256);
            builder.Property(x => x.TitleSnapshot).HasColumnName("title_snapshot").HasMaxLength(256);
            builder.Property(x => x.PiEligibilityStatus).HasColumnName("pi_eligibility_status").HasMaxLength(128);
            builder.HasIndex(x => new { x.ApplicationId, x.UserId, x.PartyRole }).IsUnique();
            builder.HasOne(x => x.Application).WithMany(x => x.Parties).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.User).WithMany(x => x.ApplicationParties).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RoutingAssessment>(builder =>
        {
            builder.ToTable("routing_assessments");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.AnswersJson).HasColumnName("answers_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.SuggestedCommitteeId).HasColumnName("suggested_committee_id");
            builder.Property(x => x.AlternativeCommitteesJson).HasColumnName("alternative_committees_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.ConfidenceScore).HasColumnName("confidence_score").HasColumnType("numeric(5,4)");
            builder.Property(x => x.ExplanationText).HasColumnName("explanation_text").HasColumnType("text");
            builder.Property(x => x.OverriddenByUser).HasColumnName("overridden_by_user");
            builder.Property(x => x.OverrideReason).HasColumnName("override_reason").HasColumnType("text");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasOne(x => x.Application).WithMany(x => x.RoutingAssessments).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.SuggestedCommittee).WithMany(x => x.SuggestedRoutingAssessments).HasForeignKey(x => x.SuggestedCommitteeId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ApplicationForm>(builder =>
        {
            builder.ToTable("application_forms");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.FormCode).HasColumnName("form_code").HasMaxLength(128).IsRequired();
            builder.Property(x => x.VersionNo).HasColumnName("version_no").IsRequired();
            builder.Property(x => x.DataJson).HasColumnName("data_json").HasColumnType("jsonb").IsRequired();
            builder.Property(x => x.CompletionPercent).HasColumnName("completion_percent").IsRequired();
            builder.Property(x => x.IsLocked).HasColumnName("is_locked").IsRequired();
            builder.HasIndex(x => new { x.ApplicationId, x.FormCode }).IsUnique();
            builder.HasOne(x => x.Application).WithMany(x => x.Forms).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ApplicationDocument>(builder =>
        {
            builder.ToTable("application_documents");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.DocumentType).HasColumnName("document_type").HasMaxLength(128).IsRequired();
            builder.Property(x => x.SourceType).HasColumnName("source_type").HasMaxLength(64).IsRequired();
            builder.Property(x => x.OriginalFileName).HasColumnName("original_filename").HasMaxLength(512).IsRequired();
            builder.Property(x => x.StorageKey).HasColumnName("storage_key").HasMaxLength(512).IsRequired();
            builder.Property(x => x.MimeType).HasColumnName("mime_type").HasMaxLength(256).IsRequired();
            builder.Property(x => x.VersionNo).HasColumnName("version_no").IsRequired();
            builder.Property(x => x.IsRequired).HasColumnName("is_required").IsRequired();
            builder.Property(x => x.ValidationStatus).HasColumnName("validation_status").HasMaxLength(64).IsRequired();
            builder.Property(x => x.CreatedBy).HasColumnName("created_by").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasOne(x => x.Application).WithMany(x => x.Documents).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.CreatedByUser).WithMany(x => x.CreatedApplicationDocuments).HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationChecklist>(builder =>
        {
            builder.ToTable("application_checklists");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.ItemCode).HasColumnName("item_code").HasMaxLength(128).IsRequired();
            builder.Property(x => x.Label).HasColumnName("label").HasMaxLength(256).IsRequired();
            builder.Property(x => x.Severity).HasColumnName("severity").HasConversion<string>().HasMaxLength(32).IsRequired();
            builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32).IsRequired();
            builder.Property(x => x.Message).HasColumnName("message").HasColumnType("text").IsRequired();
            builder.Property(x => x.AutoGenerated).HasColumnName("auto_generated").IsRequired();
            builder.Property(x => x.ResolvedAt).HasColumnName("resolved_at");
            builder.HasOne(x => x.Application).WithMany(x => x.Checklists).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ApplicationExpertAssignment>(builder =>
        {
            builder.ToTable("application_expert_assignments");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.ExpertUserId).HasColumnName("expert_user_id").IsRequired();
            builder.Property(x => x.AssignedByUserId).HasColumnName("assigned_by_user_id").IsRequired();
            builder.Property(x => x.Active).HasColumnName("active").IsRequired();
            builder.Property(x => x.AssignedAt).HasColumnName("assigned_at").IsRequired();
            builder.Property(x => x.ReviewStartedAt).HasColumnName("review_started_at");
            builder.HasIndex(x => new { x.ApplicationId, x.Active });
            builder.HasIndex(x => new { x.ExpertUserId, x.Active });
            builder.HasOne(x => x.Application).WithMany(x => x.ExpertAssignments).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.ExpertUser).WithMany(x => x.ExpertAssignments).HasForeignKey(x => x.ExpertUserId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(x => x.AssignedByUser).WithMany(x => x.AssignedExpertAssignments).HasForeignKey(x => x.AssignedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationExpertReviewDecision>(builder =>
        {
            builder.ToTable("application_expert_review_decisions");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.AssignmentId).HasColumnName("assignment_id").IsRequired();
            builder.Property(x => x.ExpertUserId).HasColumnName("expert_user_id").IsRequired();
            builder.Property(x => x.DecisionType).HasColumnName("decision_type").HasConversion<string>().HasMaxLength(64).IsRequired();
            builder.Property(x => x.Note).HasColumnName("note").HasColumnType("text");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => new { x.ApplicationId, x.CreatedAt });
            builder.HasIndex(x => new { x.AssignmentId, x.CreatedAt });
            builder.HasOne(x => x.Application).WithMany(x => x.ExpertReviewDecisions).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Assignment).WithMany(x => x.ReviewDecisions).HasForeignKey(x => x.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.ExpertUser).WithMany(x => x.ExpertReviewDecisions).HasForeignKey(x => x.ExpertUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationRevisionResponse>(builder =>
        {
            builder.ToTable("application_revision_responses");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.ExpertReviewDecisionId).HasColumnName("expert_review_decision_id").IsRequired();
            builder.Property(x => x.SubmittedByUserId).HasColumnName("submitted_by_user_id").IsRequired();
            builder.Property(x => x.ResponseNote).HasColumnName("response_note").HasColumnType("text").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => new { x.ApplicationId, x.CreatedAt });
            builder.HasIndex(x => new { x.ExpertReviewDecisionId, x.SubmittedByUserId }).IsUnique();
            builder.HasOne(x => x.Application).WithMany(x => x.RevisionResponses).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.ExpertReviewDecision).WithMany(x => x.RevisionResponses).HasForeignKey(x => x.ExpertReviewDecisionId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.SubmittedByUser).WithMany(x => x.ApplicationRevisionResponses).HasForeignKey(x => x.SubmittedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationReviewPackage>(builder =>
        {
            builder.ToTable("application_review_packages");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.PreparedByUserId).HasColumnName("prepared_by_user_id").IsRequired();
            builder.Property(x => x.Note).HasColumnName("note").HasColumnType("text");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => x.ApplicationId).IsUnique();
            builder.HasOne(x => x.Application).WithMany(x => x.ReviewPackages).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.PreparedByUser).WithMany(x => x.PreparedReviewPackages).HasForeignKey(x => x.PreparedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationCommitteeAgendaItem>(builder =>
        {
            builder.ToTable("application_committee_agenda_items");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.CommitteeId).HasColumnName("committee_id").IsRequired();
            builder.Property(x => x.ReviewPackageId).HasColumnName("review_package_id").IsRequired();
            builder.Property(x => x.AddedByUserId).HasColumnName("added_by_user_id").IsRequired();
            builder.Property(x => x.Note).HasColumnName("note").HasColumnType("text");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => x.ApplicationId).IsUnique();
            builder.HasIndex(x => new { x.CommitteeId, x.CreatedAt });
            builder.HasOne(x => x.Application).WithMany(x => x.CommitteeAgendaItems).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Committee).WithMany(x => x.AgendaItems).HasForeignKey(x => x.CommitteeId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(x => x.ReviewPackage).WithMany(x => x.CommitteeAgendaItems).HasForeignKey(x => x.ReviewPackageId).OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(x => x.AddedByUser).WithMany(x => x.AddedCommitteeAgendaItems).HasForeignKey(x => x.AddedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationCommitteeDecision>(builder =>
        {
            builder.ToTable("application_committee_decisions");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.AgendaItemId).HasColumnName("agenda_item_id").IsRequired();
            builder.Property(x => x.DecidedByUserId).HasColumnName("decided_by_user_id").IsRequired();
            builder.Property(x => x.DecisionType).HasColumnName("decision_type").HasConversion<string>().HasMaxLength(64).IsRequired();
            builder.Property(x => x.Note).HasColumnName("note").HasColumnType("text");
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => new { x.ApplicationId, x.CreatedAt });
            builder.HasIndex(x => new { x.AgendaItemId, x.CreatedAt });
            builder.HasOne(x => x.Application).WithMany(x => x.CommitteeDecisions).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.AgendaItem).WithMany(x => x.CommitteeDecisions).HasForeignKey(x => x.AgendaItemId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.DecidedByUser).WithMany(x => x.ApplicationCommitteeDecisions).HasForeignKey(x => x.DecidedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ApplicationCommitteeRevisionResponse>(builder =>
        {
            builder.ToTable("application_committee_revision_responses");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.ApplicationId).HasColumnName("application_id").IsRequired();
            builder.Property(x => x.CommitteeDecisionId).HasColumnName("committee_decision_id").IsRequired();
            builder.Property(x => x.SubmittedByUserId).HasColumnName("submitted_by_user_id").IsRequired();
            builder.Property(x => x.ResponseNote).HasColumnName("response_note").HasColumnType("text").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
            builder.HasIndex(x => new { x.ApplicationId, x.CreatedAt });
            builder.HasIndex(x => new { x.CommitteeDecisionId, x.SubmittedByUserId }).IsUnique();
            builder.HasOne(x => x.Application).WithMany(x => x.CommitteeRevisionResponses).HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.CommitteeDecision).WithMany(x => x.RevisionResponses).HasForeignKey(x => x.CommitteeDecisionId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.SubmittedByUser).WithMany(x => x.ApplicationCommitteeRevisionResponses).HasForeignKey(x => x.SubmittedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
