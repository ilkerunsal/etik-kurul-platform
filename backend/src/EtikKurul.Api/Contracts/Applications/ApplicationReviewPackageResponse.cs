namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationReviewPackageResponse(
    Guid ReviewPackageId,
    Guid ApplicationId,
    Guid PreparedByUserId,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
