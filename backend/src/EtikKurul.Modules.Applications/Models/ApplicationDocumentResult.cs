namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationDocumentResult(
    Guid DocumentId,
    Guid ApplicationId,
    string DocumentType,
    string SourceType,
    string OriginalFileName,
    string StorageKey,
    string MimeType,
    int VersionNo,
    bool IsRequired,
    string ValidationStatus,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
