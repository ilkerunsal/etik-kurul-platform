namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationExpertAssignmentResult(
    Guid AssignmentId,
    Guid ApplicationId,
    Guid ExpertUserId,
    string ExpertDisplayName,
    Guid AssignedByUserId,
    string AssignedByDisplayName,
    bool Active,
    DateTimeOffset AssignedAt,
    DateTimeOffset? ReviewStartedAt,
    ApplicationSummaryResult Application);
