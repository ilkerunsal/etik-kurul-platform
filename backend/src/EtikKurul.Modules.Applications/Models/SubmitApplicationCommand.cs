namespace EtikKurul.Modules.Applications.Models;

public sealed record SubmitApplicationCommand(Guid UserId, Guid ApplicationId);
