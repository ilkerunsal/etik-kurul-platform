using System.Text.Json.Serialization;

namespace EtikKurul.Infrastructure.Enums;

public enum ContactChannelType
{
    [JsonStringEnumMemberName("email")]
    Email,

    [JsonStringEnumMemberName("sms")]
    Sms,
}
