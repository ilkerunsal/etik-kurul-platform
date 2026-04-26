using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationCommitteeDecisionResult(
    Guid DecisionId,
    Guid AgendaItemId,
    Guid ApplicationId,
    Guid DecidedByUserId,
    ApplicationCommitteeDecisionType DecisionType,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
