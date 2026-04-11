namespace EtikKurul.Modules.IdentityVerification.Models;

public sealed record RegisterUserCommand(
    string FirstName,
    string LastName,
    string Tckn,
    DateOnly BirthDate,
    string Email,
    string Phone,
    string Password);
