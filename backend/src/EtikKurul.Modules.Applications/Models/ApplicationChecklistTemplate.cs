using EtikKurul.Infrastructure.Enums;

namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationChecklistTemplate(
    string ItemCode,
    string Label,
    ApplicationChecklistSeverity Severity,
    ApplicationChecklistStatus Status,
    string Message);
