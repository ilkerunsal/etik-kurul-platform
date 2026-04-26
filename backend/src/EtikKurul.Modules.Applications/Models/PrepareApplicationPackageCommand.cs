namespace EtikKurul.Modules.Applications.Models;

public sealed record PrepareApplicationPackageCommand(
    Guid SecretariatUserId,
    Guid ApplicationId,
    string? Note);
