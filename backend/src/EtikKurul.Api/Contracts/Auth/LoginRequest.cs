using System.ComponentModel.DataAnnotations;

namespace EtikKurul.Api.Contracts.Auth;

public class LoginRequest
{
    [Required]
    public string EmailOrPhone { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
