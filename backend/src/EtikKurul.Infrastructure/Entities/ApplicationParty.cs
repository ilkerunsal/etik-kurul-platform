namespace EtikKurul.Infrastructure.Entities;

public class ApplicationParty
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid UserId { get; set; }
    public string PartyRole { get; set; } = string.Empty;
    public string? FullNameSnapshot { get; set; }
    public string? InstitutionSnapshot { get; set; }
    public string? TitleSnapshot { get; set; }
    public string? PiEligibilityStatus { get; set; }
    public Application Application { get; set; } = null!;
    public User User { get; set; } = null!;
}
