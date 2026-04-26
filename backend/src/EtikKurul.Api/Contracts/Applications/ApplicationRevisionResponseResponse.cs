namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationRevisionResponseResponse(
    Guid RevisionResponseId,
    Guid ApplicationId,
    Guid ExpertReviewDecisionId,
    Guid SubmittedByUserId,
    string ResponseNote,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
