namespace EtikKurul.Modules.Applications.Models;

public sealed record StartExpertReviewCommand(
    Guid ExpertUserId,
    Guid ApplicationId);
