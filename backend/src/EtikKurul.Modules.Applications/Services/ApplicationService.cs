using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.Applications.Abstractions;
using EtikKurul.Modules.Applications.Models;
using EtikKurul.Modules.UserProfiles.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.Applications.Services;

public class ApplicationService(
    ApplicationDbContext dbContext,
    IApplicationAccessEvaluator applicationAccessEvaluator,
    ApplicationValidationBaseEvaluator validationBaseEvaluator) : IApplicationService
{
    public async Task<IReadOnlyList<CommitteeLookupResult>> ListCommitteesAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Committees
            .AsNoTracking()
            .Where(x => x.Active)
            .OrderBy(x => x.Name)
            .Select(x => new CommitteeLookupResult(x.Id, x.Code, x.Name, x.Category))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ApplicationSummaryResult>> ListMineAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Applications
            .AsNoTracking()
            .Where(x => x.ApplicantUserId == userId)
            .OrderByDescending(x => x.UpdatedAt)
            .Select(x => new ApplicationSummaryResult(
                x.Id,
                x.PublicRefNo,
                x.Status,
                x.CurrentStep,
                x.EntryMode,
                x.CommitteeId,
                x.CommitteeSelectionSource,
                x.RoutingConfidence,
                x.SubmittedAt,
                x.Title,
                x.Summary))
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationSummaryResult> GetOwnedAsync(Guid userId, Guid applicationId, CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == applicationId && x.ApplicantUserId == userId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        return MapSummary(application);
    }

    public async Task<ApplicationFinalDossierResult> GetFinalDossierAsync(
        Guid userId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .AsNoTracking()
            .Include(x => x.Forms)
            .Include(x => x.Documents)
            .Include(x => x.Checklists)
            .Include(x => x.ExpertReviewDecisions)
            .Include(x => x.RevisionResponses)
            .Include(x => x.ReviewPackages)
            .Include(x => x.CommitteeAgendaItems)
            .Include(x => x.CommitteeDecisions)
            .Include(x => x.CommitteeRevisionResponses)
            .SingleOrDefaultAsync(
                x => x.Id == applicationId && x.ApplicantUserId == userId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        var latestPackage = application.ReviewPackages
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();
        var latestAgendaItem = application.CommitteeAgendaItems
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();
        var finalDecision = application.CommitteeDecisions
            .Where(x => x.DecisionType is ApplicationCommitteeDecisionType.Approved or ApplicationCommitteeDecisionType.Rejected)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();

        var isReady = finalDecision is not null &&
            application.CurrentStep is ApplicationCurrentStep.Approved or ApplicationCurrentStep.Rejected;
        var includedSections = BuildDossierSections(
            application,
            latestPackage is not null,
            latestAgendaItem is not null);

        return new ApplicationFinalDossierResult(
            application.Id,
            isReady,
            GetDossierStatus(application, latestPackage, latestAgendaItem, finalDecision),
            DateTimeOffset.UtcNow,
            MapSummary(application),
            latestPackage?.Id,
            latestPackage?.CreatedAt,
            latestPackage?.Note,
            latestAgendaItem?.Id,
            latestAgendaItem?.CreatedAt,
            latestAgendaItem?.CommitteeId,
            latestAgendaItem?.Note,
            finalDecision?.Id,
            finalDecision?.DecisionType,
            finalDecision?.CreatedAt,
            finalDecision?.Note,
            application.Forms.Count,
            application.Documents.Count,
            application.Checklists.Count,
            application.ExpertReviewDecisions.Count,
            application.RevisionResponses.Count,
            application.CommitteeRevisionResponses.Count,
            includedSections);
    }

    public async Task<ApplicationSummaryResult> CreateAsync(CreateApplicationCommand command, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.Profile)
            .SingleOrDefaultAsync(x => x.Id == command.ApplicantUserId, cancellationToken)
            ?? throw new NotFoundAppException("User was not found.");

        if (user.AccountStatus != AccountStatus.Active)
        {
            throw new ValidationAppException("Only active users can create an application.");
        }

        var now = DateTimeOffset.UtcNow;
        var application = new Application
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = command.ApplicantUserId,
            Title = command.Title?.Trim(),
            Summary = command.Summary?.Trim(),
            Status = ApplicationStatus.Draft,
            CurrentStep = ApplicationCurrentStep.Draft,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var applicantParty = new ApplicationParty
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            UserId = user.Id,
            PartyRole = "applicant",
            FullNameSnapshot = $"{user.FirstName} {user.LastName}".Trim(),
            InstitutionSnapshot = user.Profile?.InstitutionName?.Trim(),
            TitleSnapshot = user.Profile?.AcademicTitle?.Trim(),
        };

        dbContext.Applications.Add(application);
        dbContext.ApplicationParties.Add(applicantParty);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapSummary(application);
    }

    public async Task<ApplicationSummaryResult> SetEntryModeAsync(SetApplicationEntryModeCommand command, CancellationToken cancellationToken)
    {
        var application = await LoadOwnedApplicationAsync(command.UserId, command.ApplicationId, cancellationToken);

        EnsureDraftStatus(application);

        application.EntryMode = command.EntryMode;
        application.CurrentStep = ApplicationCurrentStep.IntakeInProgress;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapSummary(application);
    }

    public async Task<RoutingAssessmentResult> SaveIntakeAsync(SaveApplicationIntakeCommand command, CancellationToken cancellationToken)
    {
        var application = await LoadOwnedApplicationAsync(command.UserId, command.ApplicationId, cancellationToken);

        EnsureDraftStatus(application);

        if (application.EntryMode is null)
        {
            throw new ValidationAppException("Application entry mode must be selected before intake can be saved.");
        }

        if (command.SuggestedCommitteeId.HasValue)
        {
            var suggestedCommitteeExists = await dbContext.Committees
                .AnyAsync(x => x.Id == command.SuggestedCommitteeId.Value && x.Active, cancellationToken);

            if (!suggestedCommitteeExists)
            {
                throw new NotFoundAppException("Suggested committee was not found.");
            }
        }

        var assessment = new RoutingAssessment
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            AnswersJson = command.AnswersJson,
            SuggestedCommitteeId = command.SuggestedCommitteeId,
            AlternativeCommitteesJson = command.AlternativeCommitteesJson,
            ConfidenceScore = command.ConfidenceScore,
            ExplanationText = command.ExplanationText?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        application.RoutingConfidence = command.ConfidenceScore;
        application.CurrentStep = ApplicationCurrentStep.IntakeInProgress;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.RoutingAssessments.Add(assessment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new RoutingAssessmentResult(
            assessment.Id,
            assessment.ApplicationId,
            assessment.SuggestedCommitteeId,
            assessment.ConfidenceScore,
            assessment.ExplanationText,
            assessment.CreatedAt,
            MapSummary(application));
    }

    public async Task<ApplicationSummaryResult> SelectCommitteeAsync(SelectApplicationCommitteeCommand command, CancellationToken cancellationToken)
    {
        var application = await LoadOwnedApplicationAsync(command.UserId, command.ApplicationId, cancellationToken);

        EnsureDraftStatus(application);

        var committee = await dbContext.Committees
            .SingleOrDefaultAsync(x => x.Id == command.CommitteeId && x.Active, cancellationToken)
            ?? throw new NotFoundAppException("Committee was not found.");

        if (string.IsNullOrWhiteSpace(command.CommitteeSelectionSource))
        {
            throw new ValidationAppException("Committee selection source is required.");
        }

        var latestVersion = await dbContext.CommitteeVersions
            .Where(x => x.CommitteeId == committee.Id && (x.EffectiveTo == null || x.EffectiveTo > DateTimeOffset.UtcNow))
            .OrderByDescending(x => x.VersionNo)
            .FirstOrDefaultAsync(cancellationToken);

        application.CommitteeId = committee.Id;
        application.CommitteeVersionId = latestVersion?.Id;
        application.CommitteeSelectionSource = command.CommitteeSelectionSource.Trim();
        application.CurrentStep = application.Forms.Any() || application.Documents.Any()
            ? ApplicationCurrentStep.ApplicationInPreparation
            : ApplicationCurrentStep.CommitteeSelected;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapSummary(application);
    }

    public async Task<ApplicationFormResult> SaveFormAsync(SaveApplicationFormCommand command, CancellationToken cancellationToken)
    {
        var application = await LoadOwnedApplicationAsync(command.UserId, command.ApplicationId, cancellationToken);

        EnsureDraftStatus(application);

        if (application.CommitteeId is null)
        {
            throw new ValidationAppException("Committee must be selected before forms can be saved.");
        }

        if (string.IsNullOrWhiteSpace(command.FormCode))
        {
            throw new ValidationAppException("Form code is required.");
        }

        if (command.CompletionPercent is < 0 or > 100)
        {
            throw new ValidationAppException("Completion percent must be between 0 and 100.");
        }

        var existingForm = await dbContext.ApplicationForms
            .SingleOrDefaultAsync(
                x => x.ApplicationId == application.Id && x.FormCode == command.FormCode.Trim(),
                cancellationToken);

        if (existingForm is null)
        {
            existingForm = new ApplicationForm
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                FormCode = command.FormCode.Trim(),
            };

            dbContext.ApplicationForms.Add(existingForm);
        }

        existingForm.VersionNo = command.VersionNo;
        existingForm.DataJson = command.DataJson;
        existingForm.CompletionPercent = command.CompletionPercent;
        existingForm.IsLocked = false;

        application.CurrentStep = ApplicationCurrentStep.ApplicationInPreparation;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ApplicationFormResult(
            existingForm.Id,
            existingForm.ApplicationId,
            existingForm.FormCode,
            existingForm.VersionNo,
            existingForm.CompletionPercent,
            existingForm.IsLocked,
            MapSummary(application));
    }

    public async Task<ApplicationDocumentResult> AddDocumentAsync(AddApplicationDocumentCommand command, CancellationToken cancellationToken)
    {
        var application = await LoadOwnedApplicationAsync(command.UserId, command.ApplicationId, cancellationToken);

        EnsureDraftStatus(application);

        if (string.IsNullOrWhiteSpace(command.DocumentType) ||
            string.IsNullOrWhiteSpace(command.SourceType) ||
            string.IsNullOrWhiteSpace(command.OriginalFileName) ||
            string.IsNullOrWhiteSpace(command.StorageKey) ||
            string.IsNullOrWhiteSpace(command.MimeType))
        {
            throw new ValidationAppException("Document metadata fields are required.");
        }

        var document = new ApplicationDocument
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            DocumentType = command.DocumentType.Trim(),
            SourceType = command.SourceType.Trim(),
            OriginalFileName = command.OriginalFileName.Trim(),
            StorageKey = command.StorageKey.Trim(),
            MimeType = command.MimeType.Trim(),
            VersionNo = command.VersionNo,
            IsRequired = command.IsRequired,
            ValidationStatus = "pending",
            CreatedBy = command.UserId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.ApplicationDocuments.Add(document);
        application.CurrentStep = application.CommitteeId is null
            ? application.CurrentStep
            : ApplicationCurrentStep.ApplicationInPreparation;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ApplicationDocumentResult(
            document.Id,
            document.ApplicationId,
            document.DocumentType,
            document.SourceType,
            document.OriginalFileName,
            document.StorageKey,
            document.MimeType,
            document.VersionNo,
            document.IsRequired,
            document.ValidationStatus,
            document.CreatedAt,
            MapSummary(application));
    }

    public async Task<ApplicationValidationResult> ValidateAsync(ValidateApplicationCommand command, CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .Include(x => x.Forms)
            .Include(x => x.Documents)
            .Include(x => x.RoutingAssessments)
            .SingleOrDefaultAsync(
                x => x.Id == command.ApplicationId && x.ApplicantUserId == command.UserId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        var (decision, generatedItems) = await RefreshValidationChecklistAsync(application, command.UserId, cancellationToken);

        application.CurrentStep = decision.IsValid
            ? ApplicationCurrentStep.ValidationPassed
            : ApplicationCurrentStep.ValidationFailed;
        application.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new ApplicationValidationResult(
            application.Id,
            application.Status,
            application.CurrentStep,
            decision.IsValid,
            generatedItems
                .Select(x => new ApplicationChecklistItemResult(
                    x.Id,
                    x.ItemCode,
                    x.Label,
                    x.Severity,
                    x.Status,
                    x.Message,
                    x.AutoGenerated,
                    x.ResolvedAt))
                .ToList());
    }

    public async Task<ApplicationSummaryResult> SubmitAsync(SubmitApplicationCommand command, CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .Include(x => x.Forms)
            .Include(x => x.Documents)
            .Include(x => x.RoutingAssessments)
            .SingleOrDefaultAsync(
                x => x.Id == command.ApplicationId && x.ApplicantUserId == command.UserId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        EnsureDraftStatus(application);

        var (decision, _) = await RefreshValidationChecklistAsync(application, command.UserId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (!decision.IsValid)
        {
            application.CurrentStep = ApplicationCurrentStep.ValidationFailed;
            application.UpdatedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new ValidationAppException("Application must pass system validation before submission.");
        }

        application.Status = ApplicationStatus.Submitted;
        application.CurrentStep = ApplicationCurrentStep.WaitingExpertAssignment;
        application.SubmittedAt ??= now;
        application.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapSummary(application);
    }

    public async Task<ApplicationRevisionResponseResult> SubmitRevisionResponseAsync(
        SubmitApplicationRevisionResponseCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.ResponseNote))
        {
            throw new ValidationAppException("Revision response note is required.");
        }

        var application = await dbContext.Applications
            .Include(x => x.ExpertReviewDecisions)
            .SingleOrDefaultAsync(
                x => x.Id == command.ApplicationId && x.ApplicantUserId == command.UserId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        if (application.Status != ApplicationStatus.AdditionalDocumentsRequested ||
            application.CurrentStep != ApplicationCurrentStep.ExpertRevisionRequested)
        {
            throw new ConflictAppException("Revision response can only be submitted after an expert revision request.");
        }

        var latestRevisionDecision = application.ExpertReviewDecisions
            .Where(x => x.DecisionType == ApplicationExpertReviewDecisionType.RevisionRequested)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault()
            ?? throw new ConflictAppException("Application does not have an expert revision request to answer.");

        var hasExistingResponse = await dbContext.ApplicationRevisionResponses.AnyAsync(
            x => x.ExpertReviewDecisionId == latestRevisionDecision.Id && x.SubmittedByUserId == command.UserId,
            cancellationToken);

        if (hasExistingResponse)
        {
            throw new ConflictAppException("This expert revision request has already been answered.");
        }

        var now = DateTimeOffset.UtcNow;
        var response = new ApplicationRevisionResponse
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            ExpertReviewDecisionId = latestRevisionDecision.Id,
            SubmittedByUserId = command.UserId,
            ResponseNote = command.ResponseNote.Trim(),
            CreatedAt = now,
        };

        application.Status = ApplicationStatus.UnderReview;
        application.CurrentStep = ApplicationCurrentStep.UnderExpertReview;
        application.UpdatedAt = now;

        dbContext.ApplicationRevisionResponses.Add(response);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ApplicationRevisionResponseResult(
            response.Id,
            response.ApplicationId,
            response.ExpertReviewDecisionId,
            response.SubmittedByUserId,
            response.ResponseNote,
            response.CreatedAt,
            MapSummary(application));
    }

    public async Task<ApplicationCommitteeRevisionResponseResult> SubmitCommitteeRevisionResponseAsync(
        SubmitCommitteeRevisionResponseCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.ResponseNote))
        {
            throw new ValidationAppException("Committee revision response note is required.");
        }

        var application = await dbContext.Applications
            .Include(x => x.CommitteeDecisions)
            .SingleOrDefaultAsync(
                x => x.Id == command.ApplicationId && x.ApplicantUserId == command.UserId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        if (application.Status != ApplicationStatus.AdditionalDocumentsRequested ||
            application.CurrentStep != ApplicationCurrentStep.CommitteeRevisionRequested)
        {
            throw new ConflictAppException("Committee revision response can only be submitted after a committee revision request.");
        }

        var latestRevisionDecision = application.CommitteeDecisions
            .Where(x => x.DecisionType == ApplicationCommitteeDecisionType.RevisionRequested)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault()
            ?? throw new ConflictAppException("Application does not have a committee revision request to answer.");

        var hasExistingResponse = await dbContext.ApplicationCommitteeRevisionResponses.AnyAsync(
            x => x.CommitteeDecisionId == latestRevisionDecision.Id && x.SubmittedByUserId == command.UserId,
            cancellationToken);

        if (hasExistingResponse)
        {
            throw new ConflictAppException("This committee revision request has already been answered.");
        }

        var now = DateTimeOffset.UtcNow;
        var response = new ApplicationCommitteeRevisionResponse
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            CommitteeDecisionId = latestRevisionDecision.Id,
            SubmittedByUserId = command.UserId,
            ResponseNote = command.ResponseNote.Trim(),
            CreatedAt = now,
        };

        application.Status = ApplicationStatus.UnderReview;
        application.CurrentStep = ApplicationCurrentStep.UnderCommitteeReview;
        application.UpdatedAt = now;

        dbContext.ApplicationCommitteeRevisionResponses.Add(response);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ApplicationCommitteeRevisionResponseResult(
            response.Id,
            response.ApplicationId,
            response.CommitteeDecisionId,
            response.SubmittedByUserId,
            response.ResponseNote,
            response.CreatedAt,
            MapSummary(application));
    }

    private async Task<Application> LoadOwnedApplicationAsync(Guid userId, Guid applicationId, CancellationToken cancellationToken)
    {
        return await dbContext.Applications
            .Include(x => x.Forms)
            .Include(x => x.Documents)
            .SingleOrDefaultAsync(
                x => x.Id == applicationId && x.ApplicantUserId == userId,
                cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");
    }

    private async Task<(ApplicationValidationDecision Decision, List<ApplicationChecklist> GeneratedItems)> RefreshValidationChecklistAsync(
        Application application,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var access = await applicationAccessEvaluator.EvaluateAsync(userId, cancellationToken);
        var snapshot = new ApplicationValidationSnapshot(
            access.CanOpenApplication,
            application.EntryMode is not null,
            application.RoutingAssessments.Any(),
            application.CommitteeId is not null,
            application.Forms.Any(),
            application.Forms.Any() && application.Forms.All(x => x.CompletionPercent >= 100),
            application.Documents.Any(x =>
                x.IsRequired &&
                string.Equals(x.ValidationStatus, "invalid", StringComparison.OrdinalIgnoreCase)));

        var decision = validationBaseEvaluator.Evaluate(snapshot);

        var existingItems = await dbContext.ApplicationChecklists
            .Where(x => x.ApplicationId == application.Id && x.AutoGenerated)
            .ToListAsync(cancellationToken);

        dbContext.ApplicationChecklists.RemoveRange(existingItems);

        var generatedItems = decision.Templates
            .Select(template => new ApplicationChecklist
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ItemCode = template.ItemCode,
                Label = template.Label,
                Severity = template.Severity,
                Status = template.Status,
                Message = template.Message,
                AutoGenerated = true,
            })
            .ToList();

        dbContext.ApplicationChecklists.AddRange(generatedItems);
        return (decision, generatedItems);
    }

    private static void EnsureDraftStatus(Application application)
    {
        if (application.Status != ApplicationStatus.Draft)
        {
            throw new ValidationAppException("Only draft applications can be updated in this increment.");
        }
    }

    private static string GetDossierStatus(
        Application application,
        ApplicationReviewPackage? latestPackage,
        ApplicationCommitteeAgendaItem? latestAgendaItem,
        ApplicationCommitteeDecision? finalDecision)
    {
        if (finalDecision is not null &&
            application.CurrentStep is ApplicationCurrentStep.Approved or ApplicationCurrentStep.Rejected)
        {
            return "final_ready";
        }

        if (latestAgendaItem is not null)
        {
            return "agenda_ready";
        }

        if (latestPackage is not null)
        {
            return "package_ready";
        }

        return application.CurrentStep == ApplicationCurrentStep.ExpertApproved
            ? "package_pending"
            : "not_ready";
    }

    private static IReadOnlyList<string> BuildDossierSections(
        Application application,
        bool hasPackage,
        bool hasAgendaItem)
    {
        var sections = new List<string>
        {
            "Basvuru ozeti",
            "Sistem dogrulama kontrol listesi",
        };

        if (application.Forms.Count > 0)
        {
            sections.Add("Basvuru formlari");
        }

        if (application.Documents.Count > 0)
        {
            sections.Add("Yuklenen dokuman meta verileri");
        }

        if (application.ExpertReviewDecisions.Count > 0)
        {
            sections.Add("Uzman inceleme karar kayitlari");
        }

        if (application.RevisionResponses.Count > 0 ||
            application.CommitteeRevisionResponses.Count > 0)
        {
            sections.Add("Arastirmaci revizyon yanitlari");
        }

        if (hasPackage)
        {
            sections.Add("Sekretarya kurul dosyasi paketi");
        }

        if (hasAgendaItem)
        {
            sections.Add("Kurul gundem kaydi");
        }

        if (application.CommitteeDecisions.Count > 0)
        {
            sections.Add("Kurul karar kayitlari");
        }

        return sections;
    }

    private static ApplicationSummaryResult MapSummary(Application application)
        => new(
            application.Id,
            application.PublicRefNo,
            application.Status,
            application.CurrentStep,
            application.EntryMode,
            application.CommitteeId,
            application.CommitteeSelectionSource,
            application.RoutingConfidence,
            application.SubmittedAt,
            application.Title,
            application.Summary);
}
