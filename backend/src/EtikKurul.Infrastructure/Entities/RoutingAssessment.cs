namespace EtikKurul.Infrastructure.Entities;

public class RoutingAssessment
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string AnswersJson { get; set; } = "{}";
    public Guid? SuggestedCommitteeId { get; set; }
    public string AlternativeCommitteesJson { get; set; } = "[]";
    public decimal? ConfidenceScore { get; set; }
    public string? ExplanationText { get; set; }
    public Guid? OverriddenByUser { get; set; }
    public string? OverrideReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public Committee? SuggestedCommittee { get; set; }
}
