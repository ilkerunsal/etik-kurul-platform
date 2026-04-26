namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationRevisionResponseResult(
    Guid RevisionResponseId,
    Guid ApplicationId,
    Guid ExpertReviewDecisionId,
    Guid SubmittedByUserId,
    string ResponseNote,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
