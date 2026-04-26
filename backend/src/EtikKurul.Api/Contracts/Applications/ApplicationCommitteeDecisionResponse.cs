using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationCommitteeDecisionResponse(
    Guid DecisionId,
    Guid AgendaItemId,
    Guid ApplicationId,
    Guid DecidedByUserId,
    ApplicationCommitteeDecisionType DecisionType,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
