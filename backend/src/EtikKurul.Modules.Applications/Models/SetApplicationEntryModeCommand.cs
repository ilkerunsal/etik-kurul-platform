using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record SetApplicationEntryModeCommand(Guid UserId, Guid ApplicationId, ApplicationEntryMode EntryMode);
