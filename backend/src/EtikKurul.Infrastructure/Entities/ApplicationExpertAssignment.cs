namespace EtikKurul.Infrastructure.Entities;

public class ApplicationExpertAssignment
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid ExpertUserId { get; set; }
    public Guid AssignedByUserId { get; set; }
    public bool Active { get; set; }
    public DateTimeOffset AssignedAt { get; set; }
    public DateTimeOffset? ReviewStartedAt { get; set; }
    public Application Application { get; set; } = null!;
    public User ExpertUser { get; set; } = null!;
    public User AssignedByUser { get; set; } = null!;
    public ICollection<ApplicationExpertReviewDecision> ReviewDecisions { get; set; } = [];
}
