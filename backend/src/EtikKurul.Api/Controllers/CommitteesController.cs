using EtikKurul.Api.Contracts.Applications;
using EtikKurul.Modules.Applications.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EtikKurul.Api.Controllers;

[ApiController]
[Authorize]
[Route("committees")]
public class CommitteesController(IApplicationService applicationService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<CommitteeLookupResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CommitteeLookupResponse>>> List(CancellationToken cancellationToken)
    {
        var items = await applicationService.ListCommitteesAsync(cancellationToken);
        return Ok(items.Select(x => new CommitteeLookupResponse(x.CommitteeId, x.Code, x.Name, x.Category)).ToList());
    }
}
