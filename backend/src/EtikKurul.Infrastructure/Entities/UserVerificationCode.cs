using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Entities;

public class UserVerificationCode
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ContactChannelType ChannelType { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public User User { get; set; } = null!;
}
