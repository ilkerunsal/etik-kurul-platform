namespace EtikKurul.Infrastructure.Entities;

public class Committee
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public bool Active { get; set; }
    public ICollection<CommitteeVersion> Versions { get; set; } = [];
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<RoutingAssessment> SuggestedRoutingAssessments { get; set; } = [];
}
