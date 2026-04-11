namespace EtikKurul.Modules.Applications.Models;

public sealed record SaveApplicationIntakeCommand(
    Guid UserId,
    Guid ApplicationId,
    string AnswersJson,
    Guid? SuggestedCommitteeId,
    string AlternativeCommitteesJson,
    decimal? ConfidenceScore,
    string? ExplanationText);
