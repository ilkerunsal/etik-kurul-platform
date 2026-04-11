namespace EtikKurul.Modules.Applications.Models;

public sealed record SelectApplicationCommitteeCommand(
    Guid UserId,
    Guid ApplicationId,
    Guid CommitteeId,
    string CommitteeSelectionSource);
