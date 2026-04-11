namespace EtikKurul.Api.Contracts.Auth;

public sealed record ApplicationAccessResponse(
    bool CanOpenApplication,
    string ReasonCode,
    int? CurrentProfileCompletionPercent,
    int? MinimumProfileCompletionPercent);
