using System.Security.Claims;
using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Gestion de usuarios. Solo para administradores: un Editor recibe 403.
///
/// No hay borrado: se desactiva. Borrar a alguien dejaria sin dueno sus
/// formularios y, mas adelante, sin autor su actividad.
/// </summary>
[ApiController]
[Authorize(Roles = UserRole.Admin)]
[Route("api/users")]
public class UsersController(
    IUserStore users,
    INotificationStore notifications,
    ILogger<UsersController> logger) : ControllerBase
{
    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

    /// <summary>
    /// Anota el cambio en la campana de dos personas: la afectada, que es a
    /// quien le cambia algo, y el administrador que lo hizo, para que le quede
    /// registro de lo que toca. Si se administra a si mismo, solo una vez.
    ///
    /// Van sin formulario, con el nombre del afectado como asunto.
    /// </summary>
    private void Notify(string type, UserSummary affected)
    {
        notifications.Record(affected.Id, type, formId: null, affected.DisplayName, CurrentUserId);

        if (affected.Id != CurrentUserId)
            notifications.Record(CurrentUserId, type, formId: null, affected.DisplayName, CurrentUserId);
    }

    [HttpGet]
    public ActionResult<IReadOnlyList<UserSummary>> GetAll() => Ok(users.List());

    [HttpPost]
    public ActionResult<UserSummary> Create([FromBody] CreateUserRequest request)
    {
        if (!UserRole.IsValid(request.Role))
            return Problem($"El rol tiene que ser {UserRole.Admin} o {UserRole.Editor}.", statusCode: StatusCodes.Status400BadRequest);

        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return Problem("El nombre es obligatorio.", statusCode: StatusCodes.Status400BadRequest);

        // Tambien cuenta a los desactivados: el correo es unico en la tabla.
        if (users.EmailExists(request.Email))
            return Problem("Ya existe un usuario con ese correo.", statusCode: StatusCodes.Status409Conflict);

        var created = users.Create(request.Email, request.DisplayName, request.Role, request.Password);
        Notify(NotificationType.UserCreated, created);

        logger.LogInformation("{AdminId} creo el usuario {Email} ({Role}).", CurrentUserId, created.Email, created.Role);
        return Created($"/api/users/{created.Id}", created);
    }

    [HttpPatch("{id}")]
    public ActionResult<UserSummary> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var existing = users.GetSummary(id);
        if (existing is null) return NotFound();

        if (request.Role is not null && !UserRole.IsValid(request.Role))
            return Problem($"El rol tiene que ser {UserRole.Admin} o {UserRole.Editor}.", statusCode: StatusCodes.Status400BadRequest);

        if (request.DisplayName is not null && string.IsNullOrWhiteSpace(request.DisplayName))
            return Problem("El nombre no puede quedar vacio.", statusCode: StatusCodes.Status400BadRequest);

        var pierdeAdmin = existing.IsActive && existing.Role == UserRole.Admin &&
            (request.IsActive == false || (request.Role is not null && request.Role != UserRole.Admin));

        if (pierdeAdmin)
        {
            // Quitarse el rol a uno mismo lo echaria de esta pantalla a mitad de uso.
            if (id == CurrentUserId)
                return Problem("No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.", statusCode: StatusCodes.Status400BadRequest);

            // Sin ningun administrador activo nadie podria volver a gestionar usuarios.
            if (users.CountActiveAdmins() <= 1)
                return Problem("Tiene que quedar al menos un administrador activo.", statusCode: StatusCodes.Status400BadRequest);
        }

        var updated = users.Update(id, request.DisplayName, request.Role, request.IsActive);
        if (updated is null) return NotFound();

        // Un aviso por cada cosa que cambio de verdad: el PATCH puede traer las
        // tres a la vez, y mandar "rol cambiado" cuando solo se corrigio una
        // tilde del nombre seria mentir.
        if (request.Role is not null && request.Role != existing.Role)
            Notify(NotificationType.UserRoleChanged, updated);

        if (request.IsActive is not null && request.IsActive != existing.IsActive)
        {
            Notify(request.IsActive.Value
                ? NotificationType.UserActivated
                : NotificationType.UserDeactivated, updated);
        }

        if (request.DisplayName is not null && request.DisplayName.Trim() != existing.DisplayName)
            Notify(NotificationType.AccountUpdated, updated);

        logger.LogInformation("{AdminId} modifico el usuario {Email}.", CurrentUserId, updated.Email);
        return Ok(updated);
    }

    /// <summary>
    /// Pone una contrasena nueva sin pedir la anterior. Es para quien la olvido;
    /// cambiar la propia se hace desde Mi cuenta.
    /// </summary>
    [HttpPost("{id}/password")]
    public IActionResult ResetPassword(string id, [FromBody] ResetPasswordRequest request)
    {
        var affected = users.GetSummary(id);
        if (affected is null) return NotFound();

        if (!users.SetPassword(id, request.NewPassword)) return NotFound();

        Notify(NotificationType.PasswordReset, affected);

        logger.LogInformation("{AdminId} restablecio la contrasena del usuario {UserId}.", CurrentUserId, id);
        return NoContent();
    }

    /// <summary>
    /// Descarta una solicitud de "Olvide mi contrasena" sin cambiar nada, por
    /// ejemplo si la pidio alguien que no era el dueno de la cuenta.
    /// </summary>
    [HttpDelete("{id}/password-request")]
    public ActionResult<UserSummary> DismissPasswordRequest(string id)
    {
        var updated = users.DismissPasswordReset(id);
        if (updated is null) return NotFound();

        // Quien la pidio se queda esperando una contrasena que no va a llegar,
        // asi que conviene que lo sepa.
        Notify(NotificationType.PasswordRequestDismissed, updated);

        return Ok(updated);
    }
}
