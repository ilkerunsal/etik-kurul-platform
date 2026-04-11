namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationFormResult(
    Guid FormId,
    Guid ApplicationId,
    string FormCode,
    int VersionNo,
    int CompletionPercent,
    bool IsLocked,
    ApplicationSummaryResult Application);
