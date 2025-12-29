using System.ComponentModel;

namespace ResAuthApi.Application.Constants;

public enum AppEnv
{
    [Description("Development Environment")]
    Dev = 1,

    [Description("Sandbox Environment")]
    SandBox = 2,

    [Description("Production Environment")]
    Production = 3
}
