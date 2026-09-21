using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Compartir un formulario, de dos formas:
///
/// - Privado: con personas concretas, para editarlo entre varios.
/// - Publico: todos los usuarios lo ven en Compartidos &gt; Publicos para
///   responderlo. No da acceso al editor ni a los resultados.
///
/// Solo el dueno (o un administrador) cambia cualquiera de las dos cosas. La
/// unica excepcion es quitarse a uno mismo de un compartido privado.
/// </summary>
[ApiController]
[Authorize]
[Route("api/forms/{formId}/shares")]
public class FormSharesController(
    IFormStore store,
    IFormShareStore shares,
    IUserStore users,
    INotificationStore notifications,
    FormAccess access,
    ILogger<FormSharesController> logger) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<FormShare>> GetAll(string formId)
    {
        if (OwnedForm(formId) is null) return FormNotFound(formId);
        return Ok(shares.GetShares(formId));
    }

    /// <summary>Comparte con un usuario para que pueda editarlo.</summary>
    [HttpPut("{userId}")]
    public ActionResult<IReadOnlyList<FormShare>> Share(string formId, string userId)
    {
        var form = OwnedForm(formId);
        if (form is null) return FormNotFound(formId);

        // Solo usuarios activos: a uno desactivado no le serviria de nada.
        var target = users.FindById(userId);
        if (target is null)
            return Problem("Ese usuario no existe o esta desactivado.", statusCode: StatusCodes.Status404NotFound);

        if (target.Id == form.OwnerId)
            return Problem("Ese usuario ya es el dueno del formulario.", statusCode: StatusCodes.Status400BadRequest);

        if (target.Id == access.CurrentUserId)
            return Problem("No puedes compartir un formulario contigo mismo.", statusCode: StatusCodes.Status400BadRequest);

        // Compartir dos veces con la misma persona no duplica ni vuelve a avisar.
        if (shares.Add(formId, userId, access.CurrentUserId))
        {
            notifications.Record(userId, NotificationType.FormShared, form.Id, form.Title);
            logger.LogInformation("{UserId} compartio {FormId} con {TargetId}.", access.CurrentUserId, formId, userId);
        }

        return Ok(shares.GetShares(formId));
    }

    [HttpDelete("{userId}")]
    public IActionResult Unshare(string formId, string userId)
    {
        var form = store.GetForm(formId);
        if (form is null) return FormNotFound(formId);

        var leavingMyself = userId == access.CurrentUserId;
        if (!leavingMyself && access.LevelFor(form) != FormAccessLevel.Owner) return FormNotFound(formId);

        if (!shares.Remove(formId, userId))
            return Problem("Ese formulario no estaba compartido con ese usuario.", statusCode: StatusCodes.Status404NotFound);

        return NoContent();
    }

    /// <summary>
    /// Publico o no. Se puede marcar aunque este en borrador: aparecera en
    /// Publicos en cuanto se publique.
    /// </summary>
    [HttpPut("~/api/forms/{formId}/public")]
    public ActionResult<Form> SetPublic(string formId, [FromBody] SetPublicRequest request)
    {
        if (OwnedForm(formId) is null) return FormNotFound(formId);

        shares.SetPublic(formId, request.IsPublic);
        logger.LogInformation("{UserId} marco {FormId} como {Visibilidad}.",
            access.CurrentUserId, formId, request.IsPublic ? "publico" : "privado");

        return Ok(access.WithAccess(store.GetForm(formId)!));
    }

    private Form? OwnedForm(string formId)
    {
        var form = store.GetForm(formId);

        // En la papelera no se comparte: al restaurarlo vuelve con sus permisos.
        if (form is null || form.TrashedAt is not null) return null;
        return access.LevelFor(form) == FormAccessLevel.Owner ? form : null;
    }

    private ObjectResult FormNotFound(string id) =>
        Problem($"No existe el formulario '{id}'.", statusCode: StatusCodes.Status404NotFound);
}
