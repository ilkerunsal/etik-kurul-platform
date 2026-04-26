namespace EtikKurul.Infrastructure.Entities;

public class ApplicationCommitteeAgendaItem
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid CommitteeId { get; set; }
    public Guid ReviewPackageId { get; set; }
    public Guid AddedByUserId { get; set; }
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Application Application { get; set; } = null!;
    public Committee Committee { get; set; } = null!;
    public ApplicationReviewPackage ReviewPackage { get; set; } = null!;
    public User AddedByUser { get; set; } = null!;
}
