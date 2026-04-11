using System.Text.Json;

namespace EtikKurul.Api.Contracts.Applications;

public sealed record SaveApplicationIntakeRequest(
    JsonElement Answers,
    Guid? SuggestedCommitteeId,
    JsonElement? AlternativeCommittees,
    decimal? ConfidenceScore,
    string? ExplanationText);
