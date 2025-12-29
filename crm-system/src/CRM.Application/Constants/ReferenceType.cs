using System.ComponentModel;
using System.Reflection;

namespace CRMSys.Application.Constants;

public enum ReferenceType
{
    [Description("Factory")]
    Factory = 1,

    [Description("Customers")]
    Customer = 2,

    [Description("Products")]
    Product = 3,

    [Description("Materials")]
    MaterialAttributes = 4,

    [Description("SalesOrder")]
    SalesOrder = 5,

    [Description("Country")]
    Country = 6,

    [Description("Variant")]
    Variant = 8
}

