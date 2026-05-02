using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Entities;

public class ApplicationCommitteeDecision
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid AgendaItemId { get; set; }
    public Guid DecidedByUserId { get; set; }
    public ApplicationCommitteeDecisionType DecisionType { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public ApplicationCommitteeAgendaItem AgendaItem { get; set; } = null!;
    public User DecidedByUser { get; set; } = null!;
    public ICollection<ApplicationCommitteeRevisionResponse> RevisionResponses { get; set; } = [];
    public ICollection<ApplicationFinalDossier> FinalDossiers { get; set; } = [];
}
