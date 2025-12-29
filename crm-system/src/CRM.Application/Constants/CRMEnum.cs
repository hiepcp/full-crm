using System.ComponentModel;
using System.Reflection;

namespace CRMSys.Application.Constants;


public class EnumDto
{
    public int Value { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int Kind { get; set; }
    public int ModelType { get; set; }
}


public static class EnumHelper
{
    public static string GetDescription(Enum value)
    {
        var field = value.GetType().GetField(value.ToString());
        var attribute = field?.GetCustomAttribute<DescriptionAttribute>();
        return attribute?.Description ?? value.ToString();
    }

    public static List<EnumDto> ToList<T>() where T : Enum
    {
        return Enum.GetValues(typeof(T))
            .Cast<T>()
            .Select(e => new EnumDto
            {
                Value = Convert.ToInt32(e),
                Name = e.ToString(),
                Description = GetDescription(e)
            })
            .ToList();
    }
}


public enum SendAlertType
{
    [Description("Auto send alert update")]
    AutoSendAlert = 1,

    [Description("Review")]
    Review = 2,

    [Description("Manual send alert")]
    ManualSendAlert = 3,
}

public enum SendAlertTableType
{
    [Description("Compliance")]
    Compliance = 1,

    [Description("Compliance required")]
    ComplianceRequired = 2
}

/// <summary>
/// ComplianceType dùng để xác định Type trong Category và Template
/// </summary>
public enum ComplianceType
{
    [Description("Normal")]
    Normal = 1,

    [Description("Link materials")]
    LinkMaterials = 2,

    [Description("Sales order")]
    SalesOrder = 3,

    [Description("Link products")]
    LinkProducts = 4
}
public enum LinkType
{   
    [Description("Link materials")]
    LinkMaterials = 2,

    [Description("Link products")]
    LinkProducts = 4
}

public enum FRTreatmentType
{
    [Description("Default")]
    Default = 0,

    [Description("Foam")]
    Foam = 1,

    [Description("Fabric")]
    Fabric = 2,
}

public enum RequiredType
{
    [Description("Product")]
    Product = 1,

    [Description("Variant")]
    Variant = 2,

    [Description("Variant link customer")]
    VariantLinkCustomer = 3,
}

public enum ComplDefinedType
{
    [Description("Predefined")]
    Predefined = 1,

    [Description("Additional")]
    Additional = 2
}