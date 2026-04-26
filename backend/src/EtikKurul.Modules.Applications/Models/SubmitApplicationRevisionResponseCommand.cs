namespace EtikKurul.Modules.Applications.Models;

public sealed record SubmitApplicationRevisionResponseCommand(
    Guid UserId,
    Guid ApplicationId,
    string ResponseNote);
