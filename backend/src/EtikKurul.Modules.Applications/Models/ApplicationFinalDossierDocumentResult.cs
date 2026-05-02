namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationFinalDossierDocumentResult(
    Guid FinalDossierDocumentId,
    Guid ApplicationId,
    Guid CommitteeDecisionId,
    int VersionNo,
    string FileName,
    string ContentType,
    string Sha256Hash,
    DateTimeOffset GeneratedAt,
    string Html);
