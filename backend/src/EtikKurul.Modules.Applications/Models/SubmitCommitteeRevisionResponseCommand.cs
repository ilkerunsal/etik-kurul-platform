namespace EtikKurul.Modules.Applications.Models;

public sealed record SubmitCommitteeRevisionResponseCommand(
    Guid UserId,
    Guid ApplicationId,
    string ResponseNote);
