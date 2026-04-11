namespace EtikKurul.Infrastructure.Entities;

public class Role
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ICollection<UserRole> UserRoles { get; set; } = [];
}
