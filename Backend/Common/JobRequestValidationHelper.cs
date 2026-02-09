using RMS.Dto.DepartmentManager;

namespace RMS.Common;

/// <summary>
/// Validation helper for Job Request operations
/// Centralizes business rules for job request validation
/// </summary>
public static class JobRequestValidationHelper
{
    // Business rules constants
    private const int MinQuantity = 1;
    private const int MaxQuantity = 50;
    private const int MinPriority = 1;
    private const int MaxPriority = 3;
    private const int MinReasonLength = 20;
    private const int MaxReasonLength = 500;
    private const decimal MinBudget = 5_000_000m;
    private const decimal MaxBudget = 1_000_000_000m;
    private const int MinDaysFromToday = 14; // 2 weeks
    private const int MaxDaysFromToday = 365; // 1 year

    /// <summary>
    /// Validate job request creation input
    /// </summary>
    public static ValidationResult ValidateCreateJobRequest(CreateJobRequestDto request)
    {
        // Validate quantity
        var quantityResult = ValidateQuantity(request.Quantity);
        if (!quantityResult.IsValid) return quantityResult;

        // Validate priority
        var priorityResult = ValidatePriority(request.Priority);
        if (!priorityResult.IsValid) return priorityResult;

        // Validate reason
        var reasonResult = ValidateReason(request.Reason);
        if (!reasonResult.IsValid) return reasonResult;

        // Validate budget (optional)
        if (request.Budget.HasValue)
        {
            var budgetResult = ValidateBudget(request.Budget.Value);
            if (!budgetResult.IsValid) return budgetResult;
        }

        // Validate expected start date (optional)
        if (request.ExpectedStartDate.HasValue)
        {
            var dateResult = ValidateExpectedStartDate(request.ExpectedStartDate.Value);
            if (!dateResult.IsValid) return dateResult;
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate job request update input
    /// </summary>
    public static ValidationResult ValidateUpdateJobRequest(UpdateJobRequestDto request)
    {
        // Validate quantity
        var quantityResult = ValidateQuantity(request.Quantity);
        if (!quantityResult.IsValid) return quantityResult;

        // Validate priority
        var priorityResult = ValidatePriority(request.Priority);
        if (!priorityResult.IsValid) return priorityResult;

        // Validate reason
        var reasonResult = ValidateReason(request.Reason);
        if (!reasonResult.IsValid) return reasonResult;

        // Validate budget (optional)
        if (request.Budget.HasValue)
        {
            var budgetResult = ValidateBudget(request.Budget.Value);
            if (!budgetResult.IsValid) return budgetResult;
        }

        // Validate expected start date (optional)
        if (request.ExpectedStartDate.HasValue)
        {
            var dateResult = ValidateExpectedStartDate(request.ExpectedStartDate.Value);
            if (!dateResult.IsValid) return dateResult;
        }

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate quantity (1-50 positions)
    /// </summary>
    public static ValidationResult ValidateQuantity(int quantity)
    {
        if (quantity < MinQuantity)
            return ValidationResult.Failure("Quantity must be at least 1");
        
        if (quantity > MaxQuantity)
            return ValidationResult.Failure($"Quantity cannot exceed {MaxQuantity} positions");

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate priority (1-3: 1=Urgent, 2=High, 3=Normal)
    /// </summary>
    public static ValidationResult ValidatePriority(int priority)
    {
        if (priority < MinPriority || priority > MaxPriority)
            return ValidationResult.Failure($"Priority must be between {MinPriority} and {MaxPriority}");

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate reason text (20-500 characters)
    /// </summary>
    public static ValidationResult ValidateReason(string? reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            return ValidationResult.Failure("Reason is required");

        var trimmedLength = reason.Trim().Length;
        if (trimmedLength < MinReasonLength)
            return ValidationResult.Failure($"Reason must be at least {MinReasonLength} characters");

        if (reason.Length > MaxReasonLength)
            return ValidationResult.Failure($"Reason cannot exceed {MaxReasonLength} characters");

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate budget (5,000,000 - 1,000,000,000 VND)
    /// </summary>
    public static ValidationResult ValidateBudget(decimal budget)
    {
        if (budget < MinBudget)
            return ValidationResult.Failure($"Budget must be at least {MinBudget:N0} VND");

        if (budget > MaxBudget)
            return ValidationResult.Failure("Budget seems unrealistic. Please verify the amount");

        return ValidationResult.Success();
    }

    /// <summary>
    /// Validate expected start date (2 weeks to 1 year from today)
    /// </summary>
    public static ValidationResult ValidateExpectedStartDate(DateTime expectedStartDate)
    {
        var startDate = expectedStartDate.Date;
        var today = DateTime.Today;

        // Check if date is in the past
        if (startDate < today)
            return ValidationResult.Failure("Start date cannot be in the past");

        // Check if date is at least 2 weeks from today
        var minDate = today.AddDays(MinDaysFromToday);
        if (startDate < minDate)
            return ValidationResult.Failure("Start date must be at least 2 weeks from today (realistic hiring timeline)");

        // Check if date is not more than 1 year from today
        var maxDate = today.AddDays(MaxDaysFromToday);
        if (startDate > maxDate)
            return ValidationResult.Failure("Start date cannot be more than 1 year from today");

        return ValidationResult.Success();
    }
}
