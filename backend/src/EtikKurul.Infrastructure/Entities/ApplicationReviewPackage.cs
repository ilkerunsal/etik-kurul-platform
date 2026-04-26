namespace EtikKurul.Infrastructure.Entities;

public class ApplicationReviewPackage
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid PreparedByUserId { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public User PreparedByUser { get; set; } = null!;
    public ICollection<ApplicationCommitteeAgendaItem> CommitteeAgendaItems { get; set; } = [];
}
