using System.Text.RegularExpressions;
using EtikKurul.Api.Contracts.Development;
using EtikKurul.Infrastructure.Adapters.Mocks;
using EtikKurul.Infrastructure.Persistence;
using EtikKurul.Infrastructure.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Route("dev")]
public partial class DevelopmentController(
    IMockMessageInbox mockMessageInbox,
    ApplicationDbContext dbContext,
    IOptions<DevelopmentToolsOptions> options) : ControllerBase
{
    [HttpGet("mock-messages")]
    [ProducesResponseType<IReadOnlyList<MockMessageResponse>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<MockMessageResponse>> GetMockMessages([FromQuery] string? email, [FromQuery] string? phone)
    {
        if (!options.Value.EnableMockMessageEndpoints)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(phone))
        {
            return ValidationProblem(detail: "At least one of email or phone must be provided.");
        }

        var messages = mockMessageInbox.GetRecent(email, phone)
            .Select(message => new MockMessageResponse(
                message.Id,
                message.ChannelType,
                message.Recipient,
                message.Subject,
                message.Body,
                ExtractCode(message.Body),
                message.SentAt))
            .ToArray();

        return Ok(messages);
    }

    [HttpPost("roles/assign")]
    [ProducesResponseType<DevelopmentRoleAssignmentResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<DevelopmentRoleAssignmentResponse>> AssignRole(
        [FromBody] AssignDevelopmentRoleRequest request,
        CancellationToken cancellationToken)
    {
        if (!options.Value.EnableMockMessageEndpoints)
        {
            return NotFound();
        }

        if (request.UserId == Guid.Empty || string.IsNullOrWhiteSpace(request.RoleCode))
        {
            return ValidationProblem(detail: "userId and roleCode are required.");
        }

        var user = await dbContext.Users.FindAsync([request.UserId], cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var normalizedRoleCode = request.RoleCode.Trim();
        var role = dbContext.Roles
            .SingleOrDefault(x => x.Code == normalizedRoleCode);

        if (role is null)
        {
            return NotFound();
        }

        var now = DateTimeOffset.UtcNow;
        var userRole = dbContext.UserRoles
            .SingleOrDefault(x => x.UserId == request.UserId && x.RoleId == role.Id);

        if (userRole is null)
        {
            userRole = new Infrastructure.Entities.UserRole
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                RoleId = role.Id,
                Active = true,
                AssignedAt = now,
            };

            dbContext.UserRoles.Add(userRole);
        }
        else
        {
            userRole.Active = true;
            userRole.AssignedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new DevelopmentRoleAssignmentResponse(
            request.UserId,
            role.Id,
            role.Code,
            userRole.Active,
            userRole.AssignedAt));
    }

    private static string? ExtractCode(string body)
    {
        var match = VerificationCodePattern().Match(body);
        return match.Success ? match.Value : null;
    }

    [GeneratedRegex(@"\b\d{4,8}\b", RegexOptions.Compiled)]
    private static partial Regex VerificationCodePattern();
}
