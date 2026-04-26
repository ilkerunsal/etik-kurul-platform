namespace EtikKurul.Api.Contracts.Applications;

public sealed record ApplicationCommitteeRevisionResponseResponse(
    Guid RevisionResponseId,
    Guid ApplicationId,
    Guid CommitteeDecisionId,
    Guid SubmittedByUserId,
    string ResponseNote,
    DateTimeOffset CreatedAt,
    ApplicationSummaryResponse Application);
