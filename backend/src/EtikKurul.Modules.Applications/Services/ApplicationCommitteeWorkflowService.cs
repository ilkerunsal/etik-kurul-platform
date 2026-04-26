using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.Applications.Abstractions;
using EtikKurul.Modules.Applications.Models;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.Applications.Services;

public class ApplicationCommitteeWorkflowService(ApplicationDbContext dbContext) : IApplicationCommitteeWorkflowService
{
    public async Task<IReadOnlyList<ApplicationSummaryResult>> ListPackageQueueAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Applications
            .AsNoTracking()
            .Where(x =>
                x.Status == ApplicationStatus.UnderReview &&
                x.CurrentStep == ApplicationCurrentStep.ExpertApproved)
            .OrderBy(x => x.UpdatedAt)
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

    public async Task<ApplicationReviewPackageResult> PreparePackageAsync(
        PrepareApplicationPackageCommand command,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .Include(x => x.ReviewPackages)
            .SingleOrDefaultAsync(x => x.Id == command.ApplicationId, cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        if (application.Status != ApplicationStatus.UnderReview ||
            application.CurrentStep != ApplicationCurrentStep.ExpertApproved)
        {
            throw new ConflictAppException("Only expert-approved applications can be packaged.");
        }

        if (application.ReviewPackages.Count > 0)
        {
            throw new ConflictAppException("Application review package already exists.");
        }

        await EnsureSecretariatUserExistsAsync(command.SecretariatUserId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var reviewPackage = new ApplicationReviewPackage
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            PreparedByUserId = command.SecretariatUserId,
            Note = NormalizeNote(command.Note),
            CreatedAt = now,
        };

        application.CurrentStep = ApplicationCurrentStep.PackageReady;
        application.UpdatedAt = now;

        dbContext.ApplicationReviewPackages.Add(reviewPackage);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await LoadPackageResultAsync(reviewPackage.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<ApplicationSummaryResult>> ListAgendaQueueAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Applications
            .AsNoTracking()
            .Where(x =>
                x.Status == ApplicationStatus.UnderReview &&
                x.CurrentStep == ApplicationCurrentStep.PackageReady)
            .OrderBy(x => x.UpdatedAt)
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

    public async Task<ApplicationCommitteeAgendaItemResult> AddToAgendaAsync(
        AddApplicationToCommitteeAgendaCommand command,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .Include(x => x.ReviewPackages)
            .Include(x => x.CommitteeAgendaItems)
            .SingleOrDefaultAsync(x => x.Id == command.ApplicationId, cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        if (application.Status != ApplicationStatus.UnderReview ||
            application.CurrentStep != ApplicationCurrentStep.PackageReady)
        {
            throw new ConflictAppException("Only package-ready applications can be added to the committee agenda.");
        }

        if (application.CommitteeId is null)
        {
            throw new ConflictAppException("Application must have a selected committee before it can be added to the agenda.");
        }

        if (application.CommitteeAgendaItems.Count > 0)
        {
            throw new ConflictAppException("Application is already on the committee agenda.");
        }

        var reviewPackage = application.ReviewPackages
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault()
            ?? throw new ConflictAppException("Application must be packaged before it can be added to the agenda.");

        await EnsureSecretariatUserExistsAsync(command.SecretariatUserId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var agendaItem = new ApplicationCommitteeAgendaItem
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            CommitteeId = application.CommitteeId.Value,
            ReviewPackageId = reviewPackage.Id,
            AddedByUserId = command.SecretariatUserId,
            Note = NormalizeNote(command.Note),
            CreatedAt = now,
        };

        application.CurrentStep = ApplicationCurrentStep.UnderCommitteeReview;
        application.UpdatedAt = now;

        dbContext.ApplicationCommitteeAgendaItems.Add(agendaItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await LoadAgendaItemResultAsync(agendaItem.Id, cancellationToken);
    }

    private async Task EnsureSecretariatUserExistsAsync(Guid secretariatUserId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Users.AnyAsync(x => x.Id == secretariatUserId, cancellationToken);
        if (!exists)
        {
            throw new NotFoundAppException("Secretariat user was not found.");
        }
    }

    private async Task<ApplicationReviewPackageResult> LoadPackageResultAsync(
        Guid reviewPackageId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ApplicationReviewPackages
            .AsNoTracking()
            .Where(x => x.Id == reviewPackageId)
            .Select(x => new ApplicationReviewPackageResult(
                x.Id,
                x.ApplicationId,
                x.PreparedByUserId,
                x.Note,
                x.CreatedAt,
                new ApplicationSummaryResult(
                    x.Application.Id,
                    x.Application.PublicRefNo,
                    x.Application.Status,
                    x.Application.CurrentStep,
                    x.Application.EntryMode,
                    x.Application.CommitteeId,
                    x.Application.CommitteeSelectionSource,
                    x.Application.RoutingConfidence,
                    x.Application.SubmittedAt,
                    x.Application.Title,
                    x.Application.Summary)))
            .SingleAsync(cancellationToken);
    }

    private async Task<ApplicationCommitteeAgendaItemResult> LoadAgendaItemResultAsync(
        Guid agendaItemId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ApplicationCommitteeAgendaItems
            .AsNoTracking()
            .Where(x => x.Id == agendaItemId)
            .Select(x => new ApplicationCommitteeAgendaItemResult(
                x.Id,
                x.ApplicationId,
                x.CommitteeId,
                x.ReviewPackageId,
                x.AddedByUserId,
                x.Note,
                x.CreatedAt,
                new ApplicationSummaryResult(
                    x.Application.Id,
                    x.Application.PublicRefNo,
                    x.Application.Status,
                    x.Application.CurrentStep,
                    x.Application.EntryMode,
                    x.Application.CommitteeId,
                    x.Application.CommitteeSelectionSource,
                    x.Application.RoutingConfidence,
                    x.Application.SubmittedAt,
                    x.Application.Title,
                    x.Application.Summary)))
            .SingleAsync(cancellationToken);
    }

    private static string? NormalizeNote(string? note)
        => string.IsNullOrWhiteSpace(note) ? null : note.Trim();
}
