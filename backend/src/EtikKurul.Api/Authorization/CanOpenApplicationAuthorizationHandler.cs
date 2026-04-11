using EtikKurul.Api.Authentication;
using EtikKurul.Modules.UserProfiles.Abstractions;
using Microsoft.AspNetCore.Authorization;

namespace EtikKurul.Api.Authorization;

public class CanOpenApplicationAuthorizationHandler(
    IApplicationAccessEvaluator applicationAccessEvaluator) : AuthorizationHandler<CanOpenApplicationRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CanOpenApplicationRequirement requirement)
    {
        if (!context.User.TryGetUserId(out var userId))
        {
            return;
        }

        var access = await applicationAccessEvaluator.EvaluateAsync(userId, CancellationToken.None);
        if (access.CanOpenApplication)
        {
            context.Succeed(requirement);
            return;
        }

        context.Fail(new AuthorizationFailureReason(this, access.ReasonCode));
    }
}
