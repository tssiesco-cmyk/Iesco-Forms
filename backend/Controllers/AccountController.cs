using System.Security.Claims;
using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Lo que cada usuario puede cambiar de si mismo, sea cual sea su rol.
/// El correo y el rol no estan aqui: esos los cambia un administrador.
/// </summary>
[ApiController]
[Authorize]
[Route("api/account")]
public class AccountController(IUserStore users, ILogger<AccountController> logger) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

    [HttpPatch]
    public ActionResult<UserProfile> Update([FromBody] UpdateAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return Problem("El nombre no puede quedar vacio.", statusCode: StatusCodes.Status400BadRequest);

        if (users.Update(CurrentUserId, request.DisplayName, role: null, isActive: null) is null)
            return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        return Ok(users.FindById(CurrentUserId)!.ToProfile());
    }

    [HttpPost("password")]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = users.FindById(CurrentUserId);
        if (user is null)
            return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        // Se pide la actual aunque haya sesion: asi una sesion abierta y olvidada
        // en otro equipo no basta para quedarse con la cuenta.
        if (users.ValidateCredentials(user.Email, request.CurrentPassword) is null)
            return Problem("La contrasena actual no es correcta.", statusCode: StatusCodes.Status400BadRequest);

        users.SetPassword(user.Id, request.NewPassword);

        logger.LogInformation("{Email} cambio su contrasena.", user.Email);
        return NoContent();
    }
}
