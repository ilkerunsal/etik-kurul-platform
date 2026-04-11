namespace EtikKurul.Api.Contracts.Applications;

public sealed record SelectApplicationCommitteeRequest(Guid CommitteeId, string CommitteeSelectionSource);
