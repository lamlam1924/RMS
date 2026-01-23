using System;
using System.Collections.Generic;

namespace RMS.Entity;

public partial class SkillCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
}
