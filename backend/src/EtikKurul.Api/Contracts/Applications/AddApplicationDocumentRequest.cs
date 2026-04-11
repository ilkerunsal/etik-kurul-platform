namespace EtikKurul.Api.Contracts.Applications;

public sealed record AddApplicationDocumentRequest(
    string DocumentType,
    string SourceType,
    string OriginalFileName,
    string StorageKey,
    string MimeType,
    int VersionNo,
    bool IsRequired);
