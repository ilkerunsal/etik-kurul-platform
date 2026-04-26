using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationExpertReviewDecisionResponse(
    Guid DecisionId,
    Guid AssignmentId,
    Guid ApplicationId,
    Guid ExpertUserId,
    ApplicationExpertReviewDecisionType DecisionType,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
