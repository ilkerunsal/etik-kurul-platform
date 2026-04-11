namespace EtikKurul.Api.Contracts.Profile;

public sealed record CreateProfileResponse(Guid ProfileId, Guid UserId, int ProfileCompletionPercent);
