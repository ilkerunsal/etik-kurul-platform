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
[Authorize(Policy = ApplicationPolicies.ManageCommitteeAgenda)]
[Route("applications")]
public class ApplicationCommitteeWorkflowController(IApplicationCommitteeWorkflowService committeeWorkflowService) : ControllerBase
{
    [HttpGet("secretariat/package-queue")]
    [ProducesResponseType<IReadOnlyList<ApplicationSummaryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<ApplicationSummaryResponse>>> ListPackageQueue(CancellationToken cancellationToken)
    {
        var results = await committeeWorkflowService.ListPackageQueueAsync(cancellationToken);
        return Ok(results.Select(MapSummary).ToList());
    }

    [HttpPost("{id:guid}/secretariat/package")]
    [ProducesResponseType<ApplicationReviewPackageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationReviewPackageResponse>> PreparePackage(
        [FromRoute] Guid id,
        [FromBody] PrepareApplicationPackageRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await committeeWorkflowService.PreparePackageAsync(
            new PrepareApplicationPackageCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(new ApplicationReviewPackageResponse(
            result.ReviewPackageId,
            result.ApplicationId,
            result.PreparedByUserId,
            result.Note,
            result.CreatedAt,
            MapSummary(result.Application)));
    }

    [HttpGet("committee-agenda/queue")]
    [ProducesResponseType<IReadOnlyList<ApplicationSummaryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<ApplicationSummaryResponse>>> ListAgendaQueue(CancellationToken cancellationToken)
    {
        var results = await committeeWorkflowService.ListAgendaQueueAsync(cancellationToken);
        return Ok(results.Select(MapSummary).ToList());
    }

    [HttpPost("{id:guid}/committee-agenda")]
    [ProducesResponseType<ApplicationCommitteeAgendaItemResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationCommitteeAgendaItemResponse>> AddToAgenda(
        [FromRoute] Guid id,
        [FromBody] AddApplicationToCommitteeAgendaRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await committeeWorkflowService.AddToAgendaAsync(
            new AddApplicationToCommitteeAgendaCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(new ApplicationCommitteeAgendaItemResponse(
            result.AgendaItemId,
            result.ApplicationId,
            result.CommitteeId,
            result.ReviewPackageId,
            result.AddedByUserId,
            result.Note,
            result.CreatedAt,
            MapSummary(result.Application)));
    }

    [HttpPost("{id:guid}/committee-review/request-revision")]
    [ProducesResponseType<ApplicationCommitteeDecisionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationCommitteeDecisionResponse>> RequestRevision(
        [FromRoute] Guid id,
        [FromBody] SubmitCommitteeDecisionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await committeeWorkflowService.RequestRevisionAsync(
            new SubmitCommitteeDecisionCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(MapDecision(result));
    }

    [HttpPost("{id:guid}/committee-review/approve")]
    [ProducesResponseType<ApplicationCommitteeDecisionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationCommitteeDecisionResponse>> Approve(
        [FromRoute] Guid id,
        [FromBody] SubmitCommitteeDecisionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await committeeWorkflowService.ApproveAsync(
            new SubmitCommitteeDecisionCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(MapDecision(result));
    }

    [HttpPost("{id:guid}/committee-review/reject")]
    [ProducesResponseType<ApplicationCommitteeDecisionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApplicationCommitteeDecisionResponse>> Reject(
        [FromRoute] Guid id,
        [FromBody] SubmitCommitteeDecisionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await committeeWorkflowService.RejectAsync(
            new SubmitCommitteeDecisionCommand(userId, id, request?.Note),
            cancellationToken);

        return Ok(MapDecision(result));
    }

    private static ApplicationCommitteeDecisionResponse MapDecision(ApplicationCommitteeDecisionResult result)
        => new(
            result.DecisionId,
            result.AgendaItemId,
            result.ApplicationId,
            result.DecidedByUserId,
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
