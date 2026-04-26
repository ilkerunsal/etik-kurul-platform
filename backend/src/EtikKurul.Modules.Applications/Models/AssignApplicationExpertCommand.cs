namespace EtikKurul.Modules.Applications.Models;

public sealed record AssignApplicationExpertCommand(
    Guid SecretariatUserId,
    Guid ApplicationId,
    Guid ExpertUserId);
