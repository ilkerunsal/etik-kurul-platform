namespace EtikKurul.Modules.Applications.Models;

public sealed record RoutingAssessmentResult(
    Guid RoutingAssessmentId,
    Guid ApplicationId,
    Guid? SuggestedCommitteeId,
    decimal? ConfidenceScore,
    string? ExplanationText,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
