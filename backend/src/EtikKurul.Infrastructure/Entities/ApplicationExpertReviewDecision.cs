using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Entities;

public class ApplicationExpertReviewDecision
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid ExpertUserId { get; set; }
    public ApplicationExpertReviewDecisionType DecisionType { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public ApplicationExpertAssignment Assignment { get; set; } = null!;
    public User ExpertUser { get; set; } = null!;
    public ICollection<ApplicationRevisionResponse> RevisionResponses { get; set; } = [];
}
