namespace EtikKurul.Infrastructure.Entities;

public class ApplicationForm
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string FormCode { get; set; } = string.Empty;
    public int VersionNo { get; set; }
    public string DataJson { get; set; } = "{}";
    public int CompletionPercent { get; set; }
    public bool IsLocked { get; set; }
    public Application Application { get; set; } = null!;
}
