namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationValidationSnapshot(
    bool IsProfileReady,
    bool HasEntryMode,
    bool HasRoutingAssessment,
    bool HasCommittee,
    bool HasForms,
    bool AreFormsComplete,
    bool HasRejectedRequiredDocuments);
