using EtikKurul.Modules.Applications.Models;

namespace EtikKurul.Modules.Applications.Abstractions;

public interface IApplicationExpertWorkflowService
{
    Task<IReadOnlyList<ApplicationSummaryResult>> ListAssignmentQueueAsync(CancellationToken cancellationToken);
    Task<ApplicationExpertAssignmentResult> AssignExpertAsync(AssignApplicationExpertCommand command, CancellationToken cancellationToken);
    Task<IReadOnlyList<ApplicationExpertAssignmentResult>> ListAssignedToExpertAsync(Guid expertUserId, CancellationToken cancellationToken);
    Task<ApplicationExpertAssignmentResult> StartReviewAsync(StartExpertReviewCommand command, CancellationToken cancellationToken);
    Task<ApplicationExpertReviewDecisionResult> RequestRevisionAsync(SubmitExpertReviewDecisionCommand command, CancellationToken cancellationToken);
    Task<ApplicationExpertReviewDecisionResult> ApproveAsync(SubmitExpertReviewDecisionCommand command, CancellationToken cancellationToken);
}
