using System.Security.Cryptography;
using System.Text;
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
            .Include(x => x.FinalDossiers)
            .AsSplitQuery()
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
        var latestFinalDossier = finalDecision is null
            ? null
            : application.FinalDossiers
                .Where(x => x.CommitteeDecisionId == finalDecision.Id)
                .OrderByDescending(x => x.VersionNo)
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
            latestFinalDossier?.Id,
            latestFinalDossier?.VersionNo,
            latestFinalDossier?.Sha256Hash,
            latestFinalDossier?.GeneratedAt,
            latestFinalDossier?.FileName,
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

    public async Task<ApplicationFinalDossierDocumentResult> GetFinalDossierDocumentAsync(
        Guid userId,
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        var dossier = await GetFinalDossierAsync(userId, applicationId, cancellationToken);

        if (!dossier.IsReady)
        {
            throw new ConflictAppException("Final dossier document can only be generated after a final committee decision.");
        }

        if (dossier.CommitteeDecisionId is null)
        {
            throw new ConflictAppException("Final dossier document requires a final committee decision record.");
        }

        var existingFinalDossier = await dbContext.ApplicationFinalDossiers
            .AsNoTracking()
            .Where(x =>
                x.ApplicationId == applicationId &&
                x.CommitteeDecisionId == dossier.CommitteeDecisionId.Value)
            .OrderByDescending(x => x.VersionNo)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingFinalDossier is not null)
        {
            return MapFinalDossierDocument(existingFinalDossier);
        }

        var latestVersionNo = await dbContext.ApplicationFinalDossiers
            .Where(x => x.ApplicationId == applicationId)
            .MaxAsync(x => (int?)x.VersionNo, cancellationToken) ?? 0;
        var generatedAt = DateTimeOffset.UtcNow;
        var html = BuildFinalDossierHtml(dossier, generatedAt);
        var finalDossier = new ApplicationFinalDossier
        {
            Id = Guid.NewGuid(),
            ApplicationId = dossier.ApplicationId,
            CommitteeDecisionId = dossier.CommitteeDecisionId.Value,
            VersionNo = latestVersionNo + 1,
            FileName = BuildFinalDossierFileName(dossier.ApplicationId),
            ContentType = "text/html; charset=utf-8",
            Sha256Hash = ComputeSha256(html),
            HtmlContent = html,
            GeneratedByUserId = userId,
            GeneratedAt = generatedAt,
        };

        dbContext.ApplicationFinalDossiers.Add(finalDossier);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapFinalDossierDocument(finalDossier);
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

    private static string BuildFinalDossierHtml(ApplicationFinalDossierResult dossier, DateTimeOffset generatedAt)
    {
        var application = dossier.Application;
        var title = string.IsNullOrWhiteSpace(application.Title)
            ? "Etik Kurul Basvurusu"
            : application.Title;
        var summary = string.IsNullOrWhiteSpace(application.Summary)
            ? "Basvuru ozeti girilmemis."
            : application.Summary;

        return $$"""
            <!doctype html>
            <html lang="tr">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{{Html(title)}} - Kurul Karar Dosyasi</title>
              <style>
                :root { color-scheme: light; --ink: #17110c; --muted: #66584a; --line: #dfd4c5; --accent: #1b6b6d; --paper: #fffaf2; }
                * { box-sizing: border-box; }
                body { margin: 0; padding: 40px; background: #efe8dd; color: var(--ink); font-family: "Segoe UI", Arial, sans-serif; line-height: 1.5; }
                main { max-width: 920px; margin: 0 auto; padding: 42px; background: var(--paper); border: 1px solid var(--line); border-radius: 28px; box-shadow: 0 24px 70px rgba(42, 30, 20, 0.12); }
                header { display: grid; gap: 14px; padding-bottom: 24px; border-bottom: 2px solid var(--line); }
                h1, h2 { margin: 0; line-height: 1.05; }
                h1 { font-size: 2.4rem; letter-spacing: -0.03em; }
                h2 { margin-top: 28px; font-size: 1.25rem; color: var(--accent); }
                p { margin: 8px 0 0; color: var(--muted); }
                table { width: 100%; margin-top: 16px; border-collapse: collapse; overflow: hidden; border: 1px solid var(--line); border-radius: 16px; }
                th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
                th { width: 34%; background: rgba(27, 107, 109, 0.08); color: var(--ink); }
                tr:last-child th, tr:last-child td { border-bottom: 0; }
                .badge { display: inline-flex; width: fit-content; padding: 7px 12px; border-radius: 999px; background: rgba(18, 99, 78, 0.12); color: #12634e; font-weight: 700; }
                .sections { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding: 0; list-style: none; }
                .sections li { padding: 8px 12px; border-radius: 999px; background: #f1eadf; border: 1px solid var(--line); font-weight: 700; }
                footer { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.9rem; }
                @media print {
                  body { padding: 0; background: white; }
                  main { box-shadow: none; border: 0; border-radius: 0; }
                }
              </style>
            </head>
            <body>
              <main>
                <header>
                  <span class="badge">{{Html(dossier.CommitteeDecisionType?.ToString() ?? "Final")}}</span>
                  <h1>Kurul Karar Dosyasi</h1>
                  <p>{{Html(title)}}</p>
                </header>

                <section>
                  <h2>Basvuru Ozeti</h2>
                  <table>
                    <tr><th>Basvuru ID</th><td>{{Html(dossier.ApplicationId.ToString())}}</td></tr>
                    <tr><th>Referans No</th><td>{{Html(application.PublicRefNo ?? "-")}}</td></tr>
                    <tr><th>Durum</th><td>{{Html(application.Status.ToString())}} / {{Html(application.CurrentStep.ToString())}}</td></tr>
                    <tr><th>Baslik</th><td>{{Html(title)}}</td></tr>
                    <tr><th>Ozet</th><td>{{Html(summary)}}</td></tr>
                    <tr><th>Olusturma Zamani</th><td>{{Html(FormatDate(generatedAt))}}</td></tr>
                  </table>
                </section>

                <section>
                  <h2>Kurul Karari</h2>
                  <table>
                    <tr><th>Karar ID</th><td>{{Html(dossier.CommitteeDecisionId?.ToString() ?? "-")}}</td></tr>
                    <tr><th>Karar Tipi</th><td>{{Html(dossier.CommitteeDecisionType?.ToString() ?? "-")}}</td></tr>
                    <tr><th>Karar Tarihi</th><td>{{Html(dossier.CommitteeDecisionAt.HasValue ? FormatDate(dossier.CommitteeDecisionAt.Value) : "-")}}</td></tr>
                    <tr><th>Karar Notu</th><td>{{Html(dossier.CommitteeDecisionNote ?? "-")}}</td></tr>
                  </table>
                </section>

                <section>
                  <h2>Paket ve Gundem</h2>
                  <table>
                    <tr><th>Paket ID</th><td>{{Html(dossier.ReviewPackageId?.ToString() ?? "-")}}</td></tr>
                    <tr><th>Paket Tarihi</th><td>{{Html(dossier.ReviewPackagePreparedAt.HasValue ? FormatDate(dossier.ReviewPackagePreparedAt.Value) : "-")}}</td></tr>
                    <tr><th>Paket Notu</th><td>{{Html(dossier.ReviewPackageNote ?? "-")}}</td></tr>
                    <tr><th>Gundem ID</th><td>{{Html(dossier.AgendaItemId?.ToString() ?? "-")}}</td></tr>
                    <tr><th>Komite ID</th><td>{{Html(dossier.CommitteeId?.ToString() ?? "-")}}</td></tr>
                    <tr><th>Gundem Notu</th><td>{{Html(dossier.AgendaNote ?? "-")}}</td></tr>
                  </table>
                </section>

                <section>
                  <h2>Dosya Kapsami</h2>
                  <table>
                    <tr><th>Form</th><td>{{dossier.FormCount}}</td></tr>
                    <tr><th>Dokuman</th><td>{{dossier.DocumentCount}}</td></tr>
                    <tr><th>Checklist</th><td>{{dossier.ChecklistItemCount}}</td></tr>
                    <tr><th>Uzman Karari</th><td>{{dossier.ExpertDecisionCount}}</td></tr>
                    <tr><th>Arastirmaci Revizyon Yaniti</th><td>{{dossier.ApplicantRevisionResponseCount + dossier.CommitteeRevisionResponseCount}}</td></tr>
                  </table>
                  <ul class="sections">
                    {{BuildSectionList(dossier.IncludedSections)}}
                  </ul>
                </section>

                <footer>
                  Bu cikti Etik Kurul Platformu tarafindan application-level kayitlardan uretilmistir. TCKN ve dogum tarihi bu dosyada yer almaz.
                </footer>
              </main>
            </body>
            </html>
            """;
    }

    private static string BuildSectionList(IReadOnlyList<string> sections)
        => string.Join(Environment.NewLine, sections.Select(section => $"<li>{Html(section)}</li>"));

    private static ApplicationFinalDossierDocumentResult MapFinalDossierDocument(ApplicationFinalDossier finalDossier)
        => new(
            finalDossier.Id,
            finalDossier.ApplicationId,
            finalDossier.CommitteeDecisionId,
            finalDossier.VersionNo,
            finalDossier.FileName,
            finalDossier.ContentType,
            finalDossier.Sha256Hash,
            finalDossier.GeneratedAt,
            finalDossier.HtmlContent);

    private static string BuildFinalDossierFileName(Guid applicationId)
        => $"etik-kurul-karar-dosyasi-{applicationId:N}.html";

    private static string ComputeSha256(string value)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    private static string FormatDate(DateTimeOffset value)
        => value.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss 'UTC'");

    private static string Html(string value)
        => System.Net.WebUtility.HtmlEncode(value);

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
