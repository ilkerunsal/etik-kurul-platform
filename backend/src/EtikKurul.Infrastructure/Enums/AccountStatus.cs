using System.Text.Json.Serialization;

namespace EtikKurul.Infrastructure.Enums;

public enum AccountStatus
{
    [JsonStringEnumMemberName("pending_identity_check")]
    PendingIdentityCheck,

    [JsonStringEnumMemberName("identity_failed")]
    IdentityFailed,

    [JsonStringEnumMemberName("contact_pending")]
    ContactPending,

    [JsonStringEnumMemberName("active")]
    Active,

    [JsonStringEnumMemberName("suspended")]
    Suspended,

    [JsonStringEnumMemberName("archived")]
    Archived,
}
