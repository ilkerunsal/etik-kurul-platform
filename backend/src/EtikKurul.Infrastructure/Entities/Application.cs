using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Entities;

public class Application
{
    public Guid Id { get; set; }
    public string? PublicRefNo { get; set; }
    public Guid ApplicantUserId { get; set; }
    public Guid? CommitteeId { get; set; }
    public Guid? CommitteeVersionId { get; set; }
    public ApplicationEntryMode? EntryMode { get; set; }
    public string? CommitteeSelectionSource { get; set; }
    public string? Title { get; set; }
    public string? Summary { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    public ApplicationCurrentStep CurrentStep { get; set; } = ApplicationCurrentStep.Draft;
    public decimal? RoutingConfidence { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public User ApplicantUser { get; set; } = null!;
    public Committee? Committee { get; set; }
    public CommitteeVersion? CommitteeVersion { get; set; }
    public ICollection<ApplicationParty> Parties { get; set; } = [];
    public ICollection<RoutingAssessment> RoutingAssessments { get; set; } = [];
    public ICollection<ApplicationForm> Forms { get; set; } = [];
    public ICollection<ApplicationDocument> Documents { get; set; } = [];
    public ICollection<ApplicationChecklist> Checklists { get; set; } = [];
    public ICollection<ApplicationExpertAssignment> ExpertAssignments { get; set; } = [];
    public ICollection<ApplicationExpertReviewDecision> ExpertReviewDecisions { get; set; } = [];
    public ICollection<ApplicationRevisionResponse> RevisionResponses { get; set; } = [];
    public ICollection<ApplicationReviewPackage> ReviewPackages { get; set; } = [];
    public ICollection<ApplicationCommitteeAgendaItem> CommitteeAgendaItems { get; set; } = [];
}
