using System.ComponentModel.DataAnnotations;

namespace EtikKurul.Api.Contracts.Auth;

public class VerifyIdentityRequest
{
    [Required]
    public Guid UserId { get; set; }
}
