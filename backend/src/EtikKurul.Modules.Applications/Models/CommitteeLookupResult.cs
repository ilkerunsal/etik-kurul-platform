namespace EtikKurul.Modules.Applications.Models;

public sealed record CommitteeLookupResult(Guid CommitteeId, string Code, string Name, string? Category);
