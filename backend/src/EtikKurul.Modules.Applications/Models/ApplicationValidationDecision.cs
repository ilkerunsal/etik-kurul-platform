namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationValidationDecision(
    bool IsValid,
    IReadOnlyList<ApplicationChecklistTemplate> Templates);
