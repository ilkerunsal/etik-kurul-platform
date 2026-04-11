using EtikKurul.Api.Contracts.Auth;
using EtikKurul.Api.Authentication;
using EtikKurul.Api.Authorization;
using EtikKurul.Modules.IdentityVerification.Abstractions;
using EtikKurul.Modules.IdentityVerification.Models;
using EtikKurul.Modules.UserProfiles.Abstractions;
using EtikKurul.Modules.UserProfiles.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    IRegistrationService registrationService,
    IIdentityVerificationService identityVerificationService,
    IContactVerificationService contactVerificationService,
    IAuthenticationService authenticationService,
    IApplicationAccessEvaluator applicationAccessEvaluator,
    IJwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType<RegisterResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await registrationService.RegisterAsync(
            new RegisterUserCommand(
                request.FirstName,
                request.LastName,
                request.Tckn,
                request.BirthDate,
                request.Email,
                request.Phone,
                request.Password),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new RegisterResponse(result.UserId, result.AccountStatus));
    }

    [HttpPost("verify-identity")]
    [ProducesResponseType<VerifyIdentityResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<VerifyIdentityResponse>> VerifyIdentity([FromBody] VerifyIdentityRequest request, CancellationToken cancellationToken)
    {
        var result = await identityVerificationService.VerifyAsync(new VerifyIdentityCommand(request.UserId), cancellationToken);
        return Ok(new VerifyIdentityResponse(result.UserId, result.Success, result.ResponseCode, result.AccountStatus));
    }

    [HttpPost("send-code")]
    [ProducesResponseType<SendContactCodeResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<SendContactCodeResponse>> SendCode([FromBody] SendContactCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await contactVerificationService.SendCodeAsync(
            new SendContactCodeCommand(request.UserId, request.ChannelType),
            cancellationToken);

        return Ok(new SendContactCodeResponse(result.UserId, result.ChannelType, result.ExpiresAt, result.AccountStatus));
    }

    [HttpPost("confirm-code")]
    [ProducesResponseType<ConfirmContactCodeResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ConfirmContactCodeResponse>> ConfirmCode([FromBody] ConfirmContactCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await contactVerificationService.ConfirmCodeAsync(
            new ConfirmContactCodeCommand(request.UserId, request.ChannelType, request.Code),
            cancellationToken);

        return Ok(new ConfirmContactCodeResponse(
            result.UserId,
            result.ChannelType,
            result.ChannelVerified,
            result.EmailVerified,
            result.PhoneVerified,
            result.AccountStatus));
    }

    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await authenticationService.LoginAsync(new LoginCommand(request.EmailOrPhone, request.Password), cancellationToken);
        var token = jwtTokenService.CreateAccessToken(user);
        var access = await applicationAccessEvaluator.EvaluateAsync(user.UserId, cancellationToken);
        return Ok(new LoginResponse(token.AccessToken, token.ExpiresAt, MapUser(user, access)));
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentUserResponse>> Me(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var user = await authenticationService.GetCurrentUserAsync(userId, cancellationToken);
        var access = await applicationAccessEvaluator.EvaluateAsync(user.UserId, cancellationToken);
        return Ok(new CurrentUserResponse(MapUser(user, access)));
    }

    [Authorize]
    [HttpGet("application-access")]
    [ProducesResponseType<CurrentApplicationAccessResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentApplicationAccessResponse>> ApplicationAccess(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var access = await applicationAccessEvaluator.EvaluateAsync(userId, cancellationToken);
        return Ok(new CurrentApplicationAccessResponse(MapApplicationAccess(access)));
    }

    [Authorize(Policy = ApplicationPolicies.CanOpenApplication)]
    [HttpGet("application-access/probe")]
    [ProducesResponseType<ApplicationAccessProbeResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<ApplicationAccessProbeResponse> ApplicationAccessProbe()
    {
        return Ok(new ApplicationAccessProbeResponse("ready"));
    }

    private static SessionUserResponse MapUser(AuthenticatedUserResult user, ApplicationAccessResult access)
    {
        return new SessionUserResponse(
            user.UserId,
            user.FirstName,
            user.LastName,
            user.Email,
            user.Phone,
            user.AccountStatus,
            user.IsIdentityVerified,
            user.EmailVerified,
            user.PhoneVerified,
            user.ProfileCompletionPercent,
            user.Roles,
            MapApplicationAccess(access));
    }

    private static ApplicationAccessResponse MapApplicationAccess(ApplicationAccessResult access)
        => new(
            access.CanOpenApplication,
            access.ReasonCode,
            access.CurrentProfileCompletionPercent,
            access.MinimumProfileCompletionPercent);
}
