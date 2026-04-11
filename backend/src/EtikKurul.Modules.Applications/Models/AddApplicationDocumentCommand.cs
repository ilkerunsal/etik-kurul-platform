namespace EtikKurul.Modules.Applications.Models;

public sealed record AddApplicationDocumentCommand(
    Guid UserId,
    Guid ApplicationId,
    string DocumentType,
    string SourceType,
    string OriginalFileName,
    string StorageKey,
    string MimeType,
    int VersionNo,
    bool IsRequired);
