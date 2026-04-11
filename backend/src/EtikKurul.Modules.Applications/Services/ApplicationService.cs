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

        var access = await applicationAccessEvaluator.EvaluateAsync(command.UserId, cancellationToken);
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

    private static void EnsureDraftStatus(Application application)
    {
        if (application.Status != ApplicationStatus.Draft)
        {
            throw new ValidationAppException("Only draft applications can be updated in this increment.");
        }
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
            application.Title,
            application.Summary);
}
