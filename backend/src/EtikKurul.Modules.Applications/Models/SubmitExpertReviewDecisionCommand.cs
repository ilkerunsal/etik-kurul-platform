namespace EtikKurul.Modules.Applications.Models;

public sealed record SubmitExpertReviewDecisionCommand(
    Guid ExpertUserId,
    Guid ApplicationId,
    string? Note);
