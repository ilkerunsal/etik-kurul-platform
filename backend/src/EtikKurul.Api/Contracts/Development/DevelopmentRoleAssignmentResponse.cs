namespace EtikKurul.Api.Contracts.Development;

public sealed record DevelopmentRoleAssignmentResponse(
    Guid UserId,
    Guid RoleId,
    string RoleCode,
    bool Active,
    DateTimeOffset AssignedAt);
