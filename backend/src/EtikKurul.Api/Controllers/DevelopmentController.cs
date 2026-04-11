using System.Text.RegularExpressions;
using EtikKurul.Api.Contracts.Development;
using EtikKurul.Infrastructure.Adapters.Mocks;
using EtikKurul.Infrastructure.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Route("dev")]
public partial class DevelopmentController(
    IMockMessageInbox mockMessageInbox,
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

    private static string? ExtractCode(string body)
    {
        var match = VerificationCodePattern().Match(body);
        return match.Success ? match.Value : null;
    }

    [GeneratedRegex(@"\b\d{4,8}\b", RegexOptions.Compiled)]
    private static partial Regex VerificationCodePattern();
}
