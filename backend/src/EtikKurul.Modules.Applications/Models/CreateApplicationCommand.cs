namespace EtikKurul.Modules.Applications.Models;

public sealed record CreateApplicationCommand(Guid ApplicantUserId, string? Title, string? Summary);
