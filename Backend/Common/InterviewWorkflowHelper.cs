namespace RMS.Common;

public static class InterviewWorkflowHelper
{
    public const string RoundDecisionPass = "PASS";
    public const string RoundDecisionFail = "FAIL";
    public const string RoundDecisionHold = "HOLD";
    public const string RoundDecisionExtraRound = "EXTRA_ROUND";

    public const string RecommendationStrongHire = "STRONG_HIRE";
    public const string RecommendationHire = "HIRE";
    public const string RecommendationNoHire = "NO_HIRE";
    public const string RecommendationStrongNoHire = "STRONG_NO_HIRE";

    private static readonly HashSet<string> ValidRoundDecisions = new(StringComparer.OrdinalIgnoreCase)
    {
        RoundDecisionPass,
        RoundDecisionFail,
        RoundDecisionHold,
        RoundDecisionExtraRound
    };

    private static readonly HashSet<string> ValidRecommendations = new(StringComparer.OrdinalIgnoreCase)
    {
        RecommendationStrongHire,
        RecommendationHire,
        RecommendationNoHire,
        RecommendationStrongNoHire,
        RoundDecisionPass,
        RoundDecisionFail,
        "REJECT"
    };

    public static string NormalizeRoundDecision(string value)
    {
        var normalized = NormalizeRequired(value, "Decision");
        if (!ValidRoundDecisions.Contains(normalized))
        {
            throw new InvalidOperationException(
                $"Invalid round decision: {value}. Must be PASS, FAIL, HOLD or EXTRA_ROUND");
        }

        return normalized;
    }

    public static string NormalizeRecommendation(string value)
    {
        var normalized = NormalizeRequired(value, "Recommendation");
        if (!ValidRecommendations.Contains(normalized))
        {
            throw new InvalidOperationException(
                $"Invalid recommendation: {value}. Must be STRONG_HIRE, HIRE, NO_HIRE or STRONG_NO_HIRE");
        }

        return normalized switch
        {
            RoundDecisionPass => RecommendationHire,
            RoundDecisionFail => RecommendationNoHire,
            "REJECT" => RecommendationNoHire,
            _ => normalized
        };
    }

    public static bool IsPassDecision(string? decisionCode)
        => string.Equals(decisionCode, RoundDecisionPass, StringComparison.OrdinalIgnoreCase);

    private static string NormalizeRequired(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"{fieldName} is required");

        return value.Trim().ToUpperInvariant();
    }
}