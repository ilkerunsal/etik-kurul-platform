using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationSummaryResult(
    Guid ApplicationId,
    string? PublicRefNo,
    ApplicationStatus Status,
    ApplicationCurrentStep CurrentStep,
    ApplicationEntryMode? EntryMode,
    Guid? CommitteeId,
    string? CommitteeSelectionSource,
    decimal? RoutingConfidence,
    string? Title,
    string? Summary);
