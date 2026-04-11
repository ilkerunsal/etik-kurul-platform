using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationSummaryResponse(
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
