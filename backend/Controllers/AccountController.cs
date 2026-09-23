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
public class AccountController(
    IUserStore users,
    ImageStorage images,
    INotificationStore notifications,
    ILogger<AccountController> logger) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

    /// <summary>
    /// Deja constancia en la campana de un cambio en la propia cuenta. Estos
    /// avisos no van de ningun formulario, asi que viajan sin id y con el
    /// nombre de la persona como asunto.
    /// </summary>
    private void Notify(string type, User user) =>
        notifications.Record(user.Id, type, formId: null, user.DisplayName, actorId: user.Id);

    [HttpPatch]
    public ActionResult<UserProfile> Update([FromBody] UpdateAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return Problem("El nombre no puede quedar vacio.", statusCode: StatusCodes.Status400BadRequest);

        if (users.Update(CurrentUserId, request.DisplayName, role: null, isActive: null) is null)
            return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        var user = users.FindById(CurrentUserId)!;
        Notify(NotificationType.AccountUpdated, user);

        return Ok(user.ToProfile());
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

        // Un cambio de contrasena que uno no reconoce es la primera senal de que
        // alguien entro en la cuenta, asi que queda anotado en la campana.
        Notify(NotificationType.PasswordChanged, user);

        logger.LogInformation("{Email} cambio su contrasena.", user.Email);
        return NoContent();
    }

    // --- Foto de perfil ---

    /// <summary>
    /// Sube la foto de perfil. Reemplaza la anterior y borra su archivo, para
    /// no ir dejando basura en disco.
    /// </summary>
    [HttpPost("avatar")]
    // Por encima del maximo real (5 MB) a proposito: asi un archivo algo mayor
    // llega y recibe un mensaje claro, en vez de que Kestrel corte la conexion.
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<ActionResult<UserProfile>> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        if (users.FindById(CurrentUserId) is null)
            return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        if (file is null) return Problem("No llego ningun archivo.", statusCode: StatusCodes.Status400BadRequest);

        var result = await images.SaveAsync(file, ImageStorage.Avatars, cancellationToken);
        if (!result.Ok)
        {
            ModelState.AddModelError("file", result.Error!);
            return ValidationProblem(ModelState);
        }

        images.Delete(users.SetAvatar(CurrentUserId, result.PublicPath!));

        var updated = users.FindById(CurrentUserId)!;
        Notify(NotificationType.AccountUpdated, updated);

        return Ok(updated.ToProfile());
    }

    /// <summary>Quita la foto y borra su archivo: se vuelve a las iniciales.</summary>
    [HttpDelete("avatar")]
    public ActionResult<UserProfile> RemoveAvatar()
    {
        if (users.FindById(CurrentUserId) is null)
            return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        images.Delete(users.SetAvatar(CurrentUserId, string.Empty));

        var updated = users.FindById(CurrentUserId)!;
        Notify(NotificationType.AccountUpdated, updated);

        return Ok(updated.ToProfile());
    }
}
