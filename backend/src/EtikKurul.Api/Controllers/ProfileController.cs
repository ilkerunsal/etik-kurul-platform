using EtikKurul.Api.Authentication;
using EtikKurul.Api.Contracts.Profile;
using EtikKurul.Modules.UserProfiles.Abstractions;
using EtikKurul.Modules.UserProfiles.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Authorize]
[Route("profile")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpPut("me")]
    [ProducesResponseType<CurrentProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CurrentProfileResponse>> Update([FromBody] CreateProfileRequest request, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var profile = await profileService.UpdateAsync(
            new UpdateProfileCommand(
                userId,
                request.AcademicTitle,
                request.DegreeLevel,
                request.InstitutionName,
                request.FacultyName,
                request.DepartmentName,
                request.PositionTitle,
                request.Biography,
                request.SpecializationSummary,
                request.HasESignature,
                request.KepAddress,
                request.CvDocumentId),
            cancellationToken);

        return Ok(MapProfile(profile));
    }

    [HttpGet("me")]
    [ProducesResponseType<CurrentProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CurrentProfileResponse>> Me(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var profile = await profileService.GetByUserIdAsync(userId, cancellationToken);
        if (profile is null)
        {
            return NotFound();
        }

        return Ok(MapProfile(profile));
    }

    [HttpPost]
    [ProducesResponseType<CreateProfileResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CreateProfileResponse>> Create([FromBody] CreateProfileRequest request, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await profileService.CreateAsync(
            new CreateProfileCommand(
                userId,
                request.AcademicTitle,
                request.DegreeLevel,
                request.InstitutionName,
                request.FacultyName,
                request.DepartmentName,
                request.PositionTitle,
                request.Biography,
                request.SpecializationSummary,
                request.HasESignature,
                request.KepAddress,
                request.CvDocumentId),
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, new CreateProfileResponse(result.ProfileId, result.UserId, result.ProfileCompletionPercent));
    }

    private static CurrentProfileResponse MapProfile(GetProfileResult profile)
        => new(
            profile.ProfileId,
            profile.UserId,
            profile.AcademicTitle,
            profile.DegreeLevel,
            profile.InstitutionName,
            profile.FacultyName,
            profile.DepartmentName,
            profile.PositionTitle,
            profile.Biography,
            profile.SpecializationSummary,
            profile.HasESignature,
            profile.KepAddress,
            profile.CvDocumentId,
            profile.ProfileCompletionPercent);
}
