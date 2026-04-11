namespace EtikKurul.Api.Contracts.Applications;

public sealed record RoutingAssessmentResponse(
    Guid RoutingAssessmentId,
    Guid ApplicationId,
    Guid? SuggestedCommitteeId,
    decimal? ConfidenceScore,
    string? ExplanationText,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
