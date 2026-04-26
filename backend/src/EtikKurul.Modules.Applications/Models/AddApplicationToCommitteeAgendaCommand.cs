namespace EtikKurul.Modules.Applications.Models;

public sealed record AddApplicationToCommitteeAgendaCommand(
    Guid SecretariatUserId,
    Guid ApplicationId,
    string? Note);
