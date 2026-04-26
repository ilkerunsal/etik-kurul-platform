using EtikKurul.Modules.Applications.Models;

namespace EtikKurul.Modules.Applications.Abstractions;

public interface IApplicationCommitteeWorkflowService
{
    Task<IReadOnlyList<ApplicationSummaryResult>> ListPackageQueueAsync(CancellationToken cancellationToken);
    Task<ApplicationReviewPackageResult> PreparePackageAsync(PrepareApplicationPackageCommand command, CancellationToken cancellationToken);
    Task<IReadOnlyList<ApplicationSummaryResult>> ListAgendaQueueAsync(CancellationToken cancellationToken);
    Task<ApplicationCommitteeAgendaItemResult> AddToAgendaAsync(AddApplicationToCommitteeAgendaCommand command, CancellationToken cancellationToken);
}
