namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationFinalDossierDocumentResult(
    Guid ApplicationId,
    string FileName,
    string ContentType,
    string Html);
