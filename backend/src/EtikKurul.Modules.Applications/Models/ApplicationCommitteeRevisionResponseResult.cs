namespace EtikKurul.Modules.Applications.Models;

public sealed record ApplicationCommitteeRevisionResponseResult(
    Guid RevisionResponseId,
    Guid ApplicationId,
    Guid CommitteeDecisionId,
    Guid SubmittedByUserId,
    string ResponseNote,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResult Application);
