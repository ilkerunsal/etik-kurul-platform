namespace EtikKurul.Modules.Applications.Models;

public sealed record SubmitCommitteeDecisionCommand(
    Guid SecretariatUserId,
    Guid ApplicationId,
    string? Note);
