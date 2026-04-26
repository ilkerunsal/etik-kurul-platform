namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationCommitteeAgendaItemResult(
    Guid AgendaItemId,
    Guid ApplicationId,
    Guid CommitteeId,
    Guid ReviewPackageId,
    Guid AddedByUserId,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
