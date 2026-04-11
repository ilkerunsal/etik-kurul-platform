namespace EtikKurul.Infrastructure.Entities;

public class ApplicationDocument
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public int VersionNo { get; set; }
    public bool IsRequired { get; set; }
    public string ValidationStatus { get; set; } = "pending";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
