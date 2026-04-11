namespace EtikKurul.Modules.Applications.Models;

public sealed record SaveApplicationFormCommand(
    Guid UserId,
    Guid ApplicationId,
    string FormCode,
    int VersionNo,
    string DataJson,
    int CompletionPercent);
