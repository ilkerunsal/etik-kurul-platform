namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationFormResponse(
    Guid FormId,
    Guid ApplicationId,
    string FormCode,
    int VersionNo,
    int CompletionPercent,
    bool IsLocked,
    ApplicationSummaryResponse Application);
