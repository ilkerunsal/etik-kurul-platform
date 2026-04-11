using System.ComponentModel.DataAnnotations;
using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public class ConfirmContactCodeRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public ContactChannelType ChannelType { get; set; }

    [Required]
    [MaxLength(16)]
    public string Code { get; set; } = string.Empty;
}
