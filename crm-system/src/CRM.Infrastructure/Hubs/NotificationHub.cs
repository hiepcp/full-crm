using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CRMSys.Infrastructure.Hubs;

/// <summary>
/// SignalR Hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private readonly IUserService _userService;

    public NotificationHub(ILogger<NotificationHub> logger, IUserService userService)
    {
        _logger = logger;
        _userService = userService;
    }

    public override async Task OnConnectedAsync()
    {
        try
        {
            // Get email from JWT token - try multiple claim types
            var userEmail = Context.User?.FindFirst("email")?.Value 
                ?? Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                ?? Context.User?.FindFirst("preferred_username")?.Value;

            _logger.LogInformation(
                "SignalR OnConnectedAsync: ConnectionId={ConnectionId}, Email={Email}, AllClaims={Claims}",
                Context.ConnectionId, userEmail, 
                string.Join(", ", Context.User?.Claims?.Select(c => $"{c.Type}={c.Value}") ?? Array.Empty<string>()));

            if (string.IsNullOrEmpty(userEmail))
            {
                _logger.LogWarning(
                    "SignalR client connected without email claim. ConnectionId={ConnectionId}", 
                    Context.ConnectionId);
                await base.OnConnectedAsync();
                return;
            }

            // Lookup userId from database using email
            var user = await _userService.GetByEmailAsync(userEmail);
            if (user == null)
            {
                _logger.LogWarning(
                    "SignalR client connected with unknown email. ConnectionId={ConnectionId}, Email={Email}", 
                    Context.ConnectionId, userEmail);
                await base.OnConnectedAsync();
                return;
            }

            // Add connection to user-specific group using database userId
            var groupName = $"user_{user.Id}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            
            _logger.LogInformation(
                "SignalR client connected and added to group. ConnectionId={ConnectionId}, UserId={UserId}, GroupName={GroupName}, Email={Email}", 
                Context.ConnectionId, user.Id, groupName, userEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SignalR OnConnectedAsync. ConnectionId={ConnectionId}", 
                Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        try
        {
            // Get email from JWT token - try multiple claim types
            var userEmail = Context.User?.FindFirst("email")?.Value 
                ?? Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                ?? Context.User?.FindFirst("preferred_username")?.Value;
            
            if (!string.IsNullOrEmpty(userEmail))
            {
                // Lookup userId from database
                var user = await _userService.GetByEmailAsync(userEmail);
                if (user != null)
                {
                    var groupName = $"user_{user.Id}";
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
                    
                    _logger.LogInformation(
                        "SignalR client disconnected. ConnectionId={ConnectionId}, UserId={UserId}, GroupName={GroupName}, Email={Email}, Exception={Exception}", 
                        Context.ConnectionId, user.Id, groupName, userEmail, exception?.Message);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SignalR OnDisconnectedAsync. ConnectionId={ConnectionId}", 
                Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Client can call this to test connection
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}
