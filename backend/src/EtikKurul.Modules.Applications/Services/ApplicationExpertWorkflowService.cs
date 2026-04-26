using EtikKurul.Infrastructure.Entities;
using EtikKurul.Infrastructure.Enums;
using EtikKurul.Infrastructure.Exceptions;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Modules.Applications.Abstractions;
using EtikKurul.Modules.Applications.Models;
using Microsoft.EntityFrameworkCore;

namespace EtikKurul.Modules.Applications.Services;

public class ApplicationExpertWorkflowService(ApplicationDbContext dbContext) : IApplicationExpertWorkflowService
{
    private const string EthicsExpertRoleCode = "ethics_expert";

    public async Task<IReadOnlyList<ApplicationSummaryResult>> ListAssignmentQueueAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Applications
            .AsNoTracking()
            .Where(x =>
                x.Status == ApplicationStatus.Submitted &&
                x.CurrentStep == ApplicationCurrentStep.WaitingExpertAssignment)
            .OrderBy(x => x.SubmittedAt ?? x.UpdatedAt)
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

    public async Task<ApplicationExpertAssignmentResult> AssignExpertAsync(
        AssignApplicationExpertCommand command,
        CancellationToken cancellationToken)
    {
        var application = await dbContext.Applications
            .Include(x => x.ExpertAssignments)
            .SingleOrDefaultAsync(x => x.Id == command.ApplicationId, cancellationToken)
            ?? throw new NotFoundAppException("Application was not found.");

        if (application.Status != ApplicationStatus.Submitted ||
            application.CurrentStep != ApplicationCurrentStep.WaitingExpertAssignment)
        {
            throw new ConflictAppException("Only submitted applications waiting for expert assignment can be assigned.");
        }

        var secretariatExists = await dbContext.Users.AnyAsync(x => x.Id == command.SecretariatUserId, cancellationToken);
        if (!secretariatExists)
        {
            throw new NotFoundAppException("Secretariat user was not found.");
        }

        var expertUser = await dbContext.Users
            .AsNoTracking()
            .Where(x => x.Id == command.ExpertUserId)
            .Select(x => new
            {
                x.Id,
                x.FirstName,
                x.LastName,
                x.AccountStatus,
                HasExpertRole = x.UserRoles.Any(role => role.Active && role.Role.Code == EthicsExpertRoleCode),
            })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundAppException("Expert user was not found.");

        if (expertUser.AccountStatus != AccountStatus.Active)
        {
            throw new ValidationAppException("Only active users can be assigned as experts.");
        }

        if (!expertUser.HasExpertRole)
        {
            throw new ValidationAppException("Selected user does not have the ethics_expert role.");
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var activeAssignment in application.ExpertAssignments.Where(x => x.Active))
        {
            activeAssignment.Active = false;
        }

        var assignment = new ApplicationExpertAssignment
        {
            Id = Guid.NewGuid(),
            ApplicationId = application.Id,
            ExpertUserId = command.ExpertUserId,
            AssignedByUserId = command.SecretariatUserId,
            Active = true,
            AssignedAt = now,
        };

        application.CurrentStep = ApplicationCurrentStep.ExpertAssigned;
        application.UpdatedAt = now;

        dbContext.ApplicationExpertAssignments.Add(assignment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await LoadAssignmentResultAsync(assignment.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<ApplicationExpertAssignmentResult>> ListAssignedToExpertAsync(
        Guid expertUserId,
        CancellationToken cancellationToken)
    {
        var assignments = await dbContext.ApplicationExpertAssignments
            .AsNoTracking()
            .Where(x => x.Active && x.ExpertUserId == expertUserId)
            .OrderByDescending(x => x.AssignedAt)
            .Select(x => new ApplicationExpertAssignmentResult(
                x.Id,
                x.ApplicationId,
                x.ExpertUserId,
                $"{x.ExpertUser.FirstName} {x.ExpertUser.LastName}".Trim(),
                x.AssignedByUserId,
                $"{x.AssignedByUser.FirstName} {x.AssignedByUser.LastName}".Trim(),
                x.Active,
                x.AssignedAt,
                x.ReviewStartedAt,
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
            .ToListAsync(cancellationToken);

        return assignments;
    }

    public async Task<ApplicationExpertAssignmentResult> StartReviewAsync(
        StartExpertReviewCommand command,
        CancellationToken cancellationToken)
    {
        var assignment = await dbContext.ApplicationExpertAssignments
            .Include(x => x.Application)
            .SingleOrDefaultAsync(
                x => x.ApplicationId == command.ApplicationId && x.ExpertUserId == command.ExpertUserId && x.Active,
                cancellationToken)
            ?? throw new NotFoundAppException("Active expert assignment was not found.");

        if (assignment.Application.CurrentStep != ApplicationCurrentStep.ExpertAssigned)
        {
            throw new ConflictAppException("Expert review can only start after the application is assigned to an expert.");
        }

        var now = DateTimeOffset.UtcNow;
        assignment.ReviewStartedAt ??= now;
        assignment.Application.Status = ApplicationStatus.UnderReview;
        assignment.Application.CurrentStep = ApplicationCurrentStep.UnderExpertReview;
        assignment.Application.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await LoadAssignmentResultAsync(assignment.Id, cancellationToken);
    }

    public Task<ApplicationExpertReviewDecisionResult> RequestRevisionAsync(
        SubmitExpertReviewDecisionCommand command,
        CancellationToken cancellationToken)
        => SubmitReviewDecisionAsync(
            command,
            ApplicationExpertReviewDecisionType.RevisionRequested,
            ApplicationStatus.AdditionalDocumentsRequested,
            ApplicationCurrentStep.ExpertRevisionRequested,
            cancellationToken);

    public Task<ApplicationExpertReviewDecisionResult> ApproveAsync(
        SubmitExpertReviewDecisionCommand command,
        CancellationToken cancellationToken)
        => SubmitReviewDecisionAsync(
            command,
            ApplicationExpertReviewDecisionType.Approved,
            ApplicationStatus.UnderReview,
            ApplicationCurrentStep.ExpertApproved,
            cancellationToken);

    private async Task<ApplicationExpertReviewDecisionResult> SubmitReviewDecisionAsync(
        SubmitExpertReviewDecisionCommand command,
        ApplicationExpertReviewDecisionType decisionType,
        ApplicationStatus nextStatus,
        ApplicationCurrentStep nextStep,
        CancellationToken cancellationToken)
    {
        var assignment = await dbContext.ApplicationExpertAssignments
            .Include(x => x.Application)
            .SingleOrDefaultAsync(
                x => x.ApplicationId == command.ApplicationId && x.ExpertUserId == command.ExpertUserId && x.Active,
                cancellationToken)
            ?? throw new NotFoundAppException("Active expert assignment was not found.");

        if (assignment.Application.CurrentStep != ApplicationCurrentStep.UnderExpertReview)
        {
            throw new ConflictAppException("Expert review decisions can only be submitted while the application is under expert review.");
        }

        var now = DateTimeOffset.UtcNow;
        var decision = new ApplicationExpertReviewDecision
        {
            Id = Guid.NewGuid(),
            ApplicationId = assignment.ApplicationId,
            AssignmentId = assignment.Id,
            ExpertUserId = command.ExpertUserId,
            DecisionType = decisionType,
            Note = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim(),
            CreatedAt = now,
        };

        assignment.Application.Status = nextStatus;
        assignment.Application.CurrentStep = nextStep;
        assignment.Application.UpdatedAt = now;

        dbContext.ApplicationExpertReviewDecisions.Add(decision);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await LoadDecisionResultAsync(decision.Id, cancellationToken);
    }

    private async Task<ApplicationExpertAssignmentResult> LoadAssignmentResultAsync(Guid assignmentId, CancellationToken cancellationToken)
    {
        return await dbContext.ApplicationExpertAssignments
            .AsNoTracking()
            .Where(x => x.Id == assignmentId)
            .Select(x => new ApplicationExpertAssignmentResult(
                x.Id,
                x.ApplicationId,
                x.ExpertUserId,
                $"{x.ExpertUser.FirstName} {x.ExpertUser.LastName}".Trim(),
                x.AssignedByUserId,
                $"{x.AssignedByUser.FirstName} {x.AssignedByUser.LastName}".Trim(),
                x.Active,
                x.AssignedAt,
                x.ReviewStartedAt,
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

    private async Task<ApplicationExpertReviewDecisionResult> LoadDecisionResultAsync(
        Guid decisionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ApplicationExpertReviewDecisions
            .AsNoTracking()
            .Where(x => x.Id == decisionId)
            .Select(x => new ApplicationExpertReviewDecisionResult(
                x.Id,
                x.AssignmentId,
                x.ApplicationId,
                x.ExpertUserId,
                x.DecisionType,
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
}
