namespace EtikKurul.Infrastructure.Entities;

public class UserIdentityCheck
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string ResponseCode { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public string ResultMaskedJson { get; set; } = string.Empty;
    public DateTimeOffset CheckedAt { get; set; }
    public User User { get; set; } = null!;
}
