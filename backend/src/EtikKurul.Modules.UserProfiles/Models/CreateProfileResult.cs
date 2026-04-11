namespace EtikKurul.Modules.UserProfiles.Models;

public sealed record CreateProfileResult(Guid ProfileId, Guid UserId, int ProfileCompletionPercent);
