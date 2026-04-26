namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationReviewPackageResult(
    Guid ReviewPackageId,
    Guid ApplicationId,
    Guid PreparedByUserId,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
