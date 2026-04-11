using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Infrastructure.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string TcknEncrypted { get; set; } = string.Empty;
    public string BirthDateEncrypted { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public AccountStatus AccountStatus { get; set; } = AccountStatus.PendingIdentityCheck;
    public bool IsIdentityVerified { get; set; }
    public DateTimeOffset? IdentityVerifiedAt { get; set; }
    public bool EmailVerified { get; set; }
    public bool PhoneVerified { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public ICollection<UserVerificationCode> VerificationCodes { get; set; } = [];
    public ICollection<UserIdentityCheck> IdentityChecks { get; set; } = [];
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<ApplicationParty> ApplicationParties { get; set; } = [];
    public ICollection<ApplicationDocument> CreatedApplicationDocuments { get; set; } = [];
    public UserProfile? Profile { get; set; }
}
