using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Lista minima de usuarios para elegir con quien compartir. A diferencia de
/// /api/users (solo administradores), la puede pedir cualquiera con sesion, asi
/// que no lleva rol, estado ni fechas: solo lo necesario para reconocer a alguien.
/// </summary>
[ApiController]
[Authorize]
[Route("api/directory")]
public class DirectoryController(IUserStore users) : ControllerBase
{
    public record DirectoryUser(string Id, string DisplayName, string Email);

    [HttpGet("users")]
    public ActionResult<IReadOnlyList<DirectoryUser>> Users() =>
        Ok(users.List()
            .Where(u => u.IsActive)
            .Select(u => new DirectoryUser(u.Id, u.DisplayName, u.Email))
            .ToList());
}
