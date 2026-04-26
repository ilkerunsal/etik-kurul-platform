namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationCommitteeAgendaItemResponse(
    Guid AgendaItemId,
    Guid ApplicationId,
    Guid CommitteeId,
    Guid ReviewPackageId,
    Guid AddedByUserId,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
