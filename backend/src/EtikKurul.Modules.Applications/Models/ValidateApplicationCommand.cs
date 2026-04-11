namespace EtikKurul.Modules.Applications.Models;

public sealed record ValidateApplicationCommand(Guid UserId, Guid ApplicationId);
