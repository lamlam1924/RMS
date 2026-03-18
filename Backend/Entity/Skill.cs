using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class Skill
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int CategoryId { get; set; }

    public virtual SkillCategory Category { get; set; } = null!;

    public virtual ICollection<Cvprofile> Cvprofiles { get; set; } = new List<Cvprofile>();
}
