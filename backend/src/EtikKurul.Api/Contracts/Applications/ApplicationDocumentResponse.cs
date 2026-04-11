namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationDocumentResponse(
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
    ApplicationSummaryResponse Application);
