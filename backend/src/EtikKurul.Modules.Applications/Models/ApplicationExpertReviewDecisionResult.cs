using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationExpertReviewDecisionResult(
    Guid DecisionId,
    Guid AssignmentId,
    Guid ApplicationId,
    Guid ExpertUserId,
    ApplicationExpertReviewDecisionType DecisionType,
    string? Note,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
