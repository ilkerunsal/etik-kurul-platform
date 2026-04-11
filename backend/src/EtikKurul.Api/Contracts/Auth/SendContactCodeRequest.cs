using System.ComponentModel.DataAnnotations;
using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Api.Contracts.Auth;

public class SendContactCodeRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public ContactChannelType ChannelType { get; set; }
}
