namespace EtikKurul.Infrastructure.Entities;

public class ApplicationRevisionResponse
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid ExpertReviewDecisionId { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public string ResponseNote { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public ApplicationExpertReviewDecision ExpertReviewDecision { get; set; } = null!;
    public User SubmittedByUser { get; set; } = null!;
}
