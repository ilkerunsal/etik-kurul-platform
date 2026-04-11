using System.Text.Json;
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
public class ApplicationsController(IApplicationService applicationService) : ControllerBase
{
    [Authorize(Policy = ApplicationPolicies.CanOpenApplication)]
    [HttpPost]
    [ProducesResponseType<ApplicationSummaryResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApplicationSummaryResponse>> Create(
        [FromBody] CreateApplicationRequest? request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.CreateAsync(
            new CreateApplicationCommand(
                userId,
                request?.Title,
                request?.Summary),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, MapSummary(result));
    }

    [HttpPost("{id:guid}/entry-mode")]
    [ProducesResponseType<ApplicationSummaryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationSummaryResponse>> SetEntryMode(
        [FromRoute] Guid id,
        [FromBody] SetApplicationEntryModeRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.SetEntryModeAsync(
            new SetApplicationEntryModeCommand(userId, id, request.EntryMode),
            cancellationToken);

        return Ok(MapSummary(result));
    }

    [HttpPost("{id:guid}/intake")]
    [ProducesResponseType<RoutingAssessmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoutingAssessmentResponse>> SaveIntake(
        [FromRoute] Guid id,
        [FromBody] SaveApplicationIntakeRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.SaveIntakeAsync(
            new SaveApplicationIntakeCommand(
                userId,
                id,
                GetJsonPayloadOrDefault(request.Answers, "{}"),
                request.SuggestedCommitteeId,
                request.AlternativeCommittees is { } alternatives
                    ? GetJsonPayloadOrDefault(alternatives, "[]")
                    : "[]",
                request.ConfidenceScore,
                request.ExplanationText),
            cancellationToken);

        return Ok(new RoutingAssessmentResponse(
            result.RoutingAssessmentId,
            result.ApplicationId,
            result.SuggestedCommitteeId,
            result.ConfidenceScore,
            result.ExplanationText,
            result.CreatedAt,
            MapSummary(result.Application)));
    }

    [HttpPost("{id:guid}/committee")]
    [ProducesResponseType<ApplicationSummaryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationSummaryResponse>> SelectCommittee(
        [FromRoute] Guid id,
        [FromBody] SelectApplicationCommitteeRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.SelectCommitteeAsync(
            new SelectApplicationCommitteeCommand(
                userId,
                id,
                request.CommitteeId,
                request.CommitteeSelectionSource),
            cancellationToken);

        return Ok(MapSummary(result));
    }

    [HttpPost("{id:guid}/forms/{formCode}")]
    [ProducesResponseType<ApplicationFormResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationFormResponse>> SaveForm(
        [FromRoute] Guid id,
        [FromRoute] string formCode,
        [FromBody] SaveApplicationFormRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.SaveFormAsync(
            new SaveApplicationFormCommand(
                userId,
                id,
                formCode,
                request.VersionNo,
                GetJsonPayloadOrDefault(request.Data, "{}"),
                request.CompletionPercent),
            cancellationToken);

        return Ok(new ApplicationFormResponse(
            result.FormId,
            result.ApplicationId,
            result.FormCode,
            result.VersionNo,
            result.CompletionPercent,
            result.IsLocked,
            MapSummary(result.Application)));
    }

    [HttpPost("{id:guid}/documents")]
    [ProducesResponseType<ApplicationDocumentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationDocumentResponse>> AddDocument(
        [FromRoute] Guid id,
        [FromBody] AddApplicationDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.AddDocumentAsync(
            new AddApplicationDocumentCommand(
                userId,
                id,
                request.DocumentType,
                request.SourceType,
                request.OriginalFileName,
                request.StorageKey,
                request.MimeType,
                request.VersionNo,
                request.IsRequired),
            cancellationToken);

        return Ok(new ApplicationDocumentResponse(
            result.DocumentId,
            result.ApplicationId,
            result.DocumentType,
            result.SourceType,
            result.OriginalFileName,
            result.StorageKey,
            result.MimeType,
            result.VersionNo,
            result.IsRequired,
            result.ValidationStatus,
            result.CreatedAt,
            MapSummary(result.Application)));
    }

    [HttpPost("{id:guid}/validate")]
    [ProducesResponseType<ApplicationValidationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApplicationValidationResponse>> Validate(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await applicationService.ValidateAsync(new ValidateApplicationCommand(userId, id), cancellationToken);
        return Ok(new ApplicationValidationResponse(
            result.ApplicationId,
            result.Status,
            result.CurrentStep,
            result.IsValid,
            result.Items
                .Select(item => new ApplicationChecklistItemResponse(
                    item.ChecklistItemId,
                    item.ItemCode,
                    item.Label,
                    item.Severity,
                    item.Status,
                    item.Message,
                    item.AutoGenerated,
                    item.ResolvedAt))
                .ToList()));
    }

    private static string GetJsonPayloadOrDefault(JsonElement element, string fallback)
        => element.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
            ? fallback
            : element.GetRawText();

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
            result.Title,
            result.Summary);
}
