using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationValidationResult(
    Guid ApplicationId,
    ApplicationStatus Status,
    ApplicationCurrentStep CurrentStep,
    bool IsValid,
    IReadOnlyList<ApplicationChecklistItemResult> Items);
