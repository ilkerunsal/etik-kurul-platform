namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationExpertAssignmentResponse(
    Guid AssignmentId,
    Guid ApplicationId,
    Guid ExpertUserId,
    string ExpertDisplayName,
    Guid AssignedByUserId,
    string AssignedByDisplayName,
    bool Active,
    DateTimeOffset AssignedAt,
    DateTimeOffset? ReviewStartedAt,
    ApplicationSummaryResponse Application);
