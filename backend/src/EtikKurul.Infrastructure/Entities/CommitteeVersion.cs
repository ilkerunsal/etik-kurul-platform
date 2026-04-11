namespace EtikKurul.Infrastructure.Entities;

public class CommitteeVersion
{
    public Guid Id { get; set; }
    public Guid CommitteeId { get; set; }
    public int VersionNo { get; set; }
    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset? EffectiveTo { get; set; }
    public string RulesJson { get; set; } = "{}";
    public string TemplatesJson { get; set; } = "{}";
    public string? Notes { get; set; }
    public Committee Committee { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
}
