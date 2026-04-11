using EtikKurul.Infrastructure.Enums;
using EtikKurul.Modules.Applications.Models;

namespace EtikKurul.Modules.Applications.Abstractions;

public interface IApplicationService
{
    Task<IReadOnlyList<CommitteeLookupResult>> ListCommitteesAsync(CancellationToken cancellationToken);
    Task<ApplicationSummaryResult> CreateAsync(CreateApplicationCommand command, CancellationToken cancellationToken);
    Task<ApplicationSummaryResult> SetEntryModeAsync(SetApplicationEntryModeCommand command, CancellationToken cancellationToken);
    Task<RoutingAssessmentResult> SaveIntakeAsync(SaveApplicationIntakeCommand command, CancellationToken cancellationToken);
    Task<ApplicationSummaryResult> SelectCommitteeAsync(SelectApplicationCommitteeCommand command, CancellationToken cancellationToken);
    Task<ApplicationFormResult> SaveFormAsync(SaveApplicationFormCommand command, CancellationToken cancellationToken);
    Task<ApplicationDocumentResult> AddDocumentAsync(AddApplicationDocumentCommand command, CancellationToken cancellationToken);
    Task<ApplicationValidationResult> ValidateAsync(ValidateApplicationCommand command, CancellationToken cancellationToken);
}
