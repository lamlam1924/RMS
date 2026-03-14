using Microsoft.EntityFrameworkCore;
using RMS.Data;
using RMS.Entity;

namespace RMS.Common;

public static class EvaluationCriteriaQueryHelper
{
    public static async Task<List<EvaluationCriterion>> GetCriteriaByPositionAndRoundAsync(
        RecruitmentDbContext context,
        int positionId,
        int roundNo)
    {
        var criteria = await context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == positionId && c.Template.RoundNo == roundNo)
            .ToListAsync();

        if (criteria.Count > 0)
            return criteria;

        criteria = await context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == positionId && c.Template.RoundNo == null)
            .ToListAsync();

        if (criteria.Count > 0)
            return criteria;

        criteria = await context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == null && c.Template.RoundNo == roundNo)
            .ToListAsync();

        if (criteria.Count > 0)
            return criteria;

        return await context.EvaluationCriteria
            .Include(c => c.Template)
            .Where(c => c.Template.PositionId == null && c.Template.RoundNo == null)
            .ToListAsync();
    }
}