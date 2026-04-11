using EtikKurul.Modules.UserProfiles.Models;

namespace EtikKurul.Modules.UserProfiles.Abstractions;

public interface IProfileService
{
    Task<CreateProfileResult> CreateAsync(CreateProfileCommand command, CancellationToken cancellationToken);
    Task<GetProfileResult?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<GetProfileResult> UpdateAsync(UpdateProfileCommand command, CancellationToken cancellationToken);
}
