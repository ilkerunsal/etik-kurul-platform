namespace EtikKurul.Infrastructure.Entities;

public class ApplicationFinalDossier
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid CommitteeDecisionId { get; set; }
    public int VersionNo { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Sha256Hash { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public Guid GeneratedByUserId { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
    public Application Application { get; set; } = null!;
    public ApplicationCommitteeDecision CommitteeDecision { get; set; } = null!;
    public User GeneratedByUser { get; set; } = null!;
}
