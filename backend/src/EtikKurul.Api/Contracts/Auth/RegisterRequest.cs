using System.ComponentModel.DataAnnotations;

namespace EtikKurul.Api.Contracts.Auth;

public class RegisterRequest
{
    [Required]
    [MaxLength(150)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^\d{11}$")]
    public string Tckn { get; set; } = string.Empty;

    [Required]
    public DateOnly BirthDate { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
