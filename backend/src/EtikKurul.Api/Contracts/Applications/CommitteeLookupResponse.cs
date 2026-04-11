namespace EtikKurul.Api.Contracts.Applications;

public sealed record CommitteeLookupResponse(Guid CommitteeId, string Code, string Name, string? Category);
