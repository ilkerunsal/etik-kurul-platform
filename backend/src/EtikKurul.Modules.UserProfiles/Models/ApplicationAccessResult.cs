namespace EtikKurul.Modules.UserProfiles.Models;

public sealed record ApplicationAccessResult(
    bool CanOpenApplication,
    string ReasonCode,
    int? CurrentProfileCompletionPercent,
    int? MinimumProfileCompletionPercent);
