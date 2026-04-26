using EtikKurul.Api.Authentication;
using EtikKurul.Api.Authorization;
using EtikKurul.Api.Contracts.Applications;
using EtikKurul.Modules.Applications.Abstractions;
using EtikKurul.Modules.Applications.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Authorize]
[Route("applications")]
public class ApplicationExpertWorkflowController(IApplicationExpertWorkflowService expertWorkflowService) : ControllerBase
{
    [Authorize(Policy = ApplicationPolicies.ManageExpertAssignments)]
    [HttpGet("expert-assignment/queue")]
    [ProducesResponseType<IReadOnlyList<ApplicationSummaryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<ApplicationSummaryResponse>>> ListAssignmentQueue(CancellationToken cancellationToken)
    {
        var results = await expertWorkflowService.ListAssignmentQueueAsync(cancellationToken);
        return Ok(results.Select(MapSummary).ToList());
    }

    [Authorize(Policy = ApplicationPolicies.ManageExpertAssignments)]
    [HttpPost("{id:guid}/expert-assignment")]
    [ProducesResponseType<ApplicationExpertAssignmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationExpertAssignmentResponse>> AssignExpert(
        [FromRoute] Guid id,
        [FromBody] AssignApplicationExpertRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await expertWorkflowService.AssignExpertAsync(
            new AssignApplicationExpertCommand(userId, id, request.ExpertUserId),
            cancellationToken);

        return Ok(MapAssignment(result));
    }

    [Authorize(Policy = ApplicationPolicies.StartExpertReview)]
    [HttpGet("expert-review/me")]
    [ProducesResponseType<IReadOnlyList<ApplicationExpertAssignmentResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<ApplicationExpertAssignmentResponse>>> ListAssignedToMe(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var results = await expertWorkflowService.ListAssignedToExpertAsync(userId, cancellationToken);
        return Ok(results.Select(MapAssignment).ToList());
    }

    [Authorize(Policy = ApplicationPolicies.StartExpertReview)]
    [HttpPost("{id:guid}/expert-review/start")]
    [ProducesResponseType<ApplicationExpertAssignmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationExpertAssignmentResponse>> StartReview(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await expertWorkflowService.StartReviewAsync(
            new StartExpertReviewCommand(userId, id),
            cancellationToken);

        return Ok(MapAssignment(result));
    }

    [Authorize(Policy = ApplicationPolicies.StartExpertReview)]
    [HttpPost("{id:guid}/expert-review/request-revision")]
    [ProducesResponseType<ApplicationExpertReviewDecisionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationExpertReviewDecisionResponse>> RequestRevision(
        [FromRoute] Guid id,
        [FromBody] SubmitExpertReviewDecisionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await expertWorkflowService.RequestRevisionAsync(
            new SubmitExpertReviewDecisionCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(MapDecision(result));
    }

    [Authorize(Policy = ApplicationPolicies.StartExpertReview)]
    [HttpPost("{id:guid}/expert-review/approve")]
    [ProducesResponseType<ApplicationExpertReviewDecisionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationExpertReviewDecisionResponse>> Approve(
        [FromRoute] Guid id,
        [FromBody] SubmitExpertReviewDecisionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await expertWorkflowService.ApproveAsync(
            new SubmitExpertReviewDecisionCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(MapDecision(result));
    }

    private static ApplicationExpertAssignmentResponse MapAssignment(ApplicationExpertAssignmentResult result)
        => new(
            result.AssignmentId,
            result.ApplicationId,
            result.ExpertUserId,
            result.ExpertDisplayName,
            result.AssignedByUserId,
            result.AssignedByDisplayName,
            result.Active,
            result.AssignedAt,
            result.ReviewStartedAt,
            MapSummary(result.Application));

    private static ApplicationExpertReviewDecisionResponse MapDecision(ApplicationExpertReviewDecisionResult result)
        => new(
            result.DecisionId,
            result.AssignmentId,
            result.ApplicationId,
            result.ExpertUserId,
            result.DecisionType,
            result.Note,
            result.CreatedAt,
            MapSummary(result.Application));

    private static ApplicationSummaryResponse MapSummary(ApplicationSummaryResult result)
        => new(
            result.ApplicationId,
            result.PublicRefNo,
            result.Status,
            result.CurrentStep,
            result.EntryMode,
            result.CommitteeId,
            result.CommitteeSelectionSource,
            result.RoutingConfidence,
            result.SubmittedAt,
            result.Title,
            result.Summary);
}
