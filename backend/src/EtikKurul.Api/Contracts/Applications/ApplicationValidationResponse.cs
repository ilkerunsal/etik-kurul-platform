using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationValidationResponse(
    Guid ApplicationId,
    ApplicationStatus Status,
    ApplicationCurrentStep CurrentStep,
    bool IsValid,
    IReadOnlyList<ApplicationChecklistItemResponse> Items);
