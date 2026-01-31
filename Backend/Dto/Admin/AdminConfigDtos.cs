namespace RMS.Dto.Admin;

public class SystemConfigDto
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateConfigRequestDto
{
    public string Value { get; set; } = null!;
}

public class BulkUpdateConfigRequestDto
{
    public Dictionary<string, string> Configs { get; set; } = new();
}
