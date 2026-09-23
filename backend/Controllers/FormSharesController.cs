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
    FormNotifier notifier,
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
            notifications.Record(userId, NotificationType.FormShared, form.Id, form.Title, access.CurrentUserId);

            // Al recien llegado le toca "compartido contigo"; a los que ya
            // estaban, que el formulario cambio de manos compartidas.
            notifier.Notify(form, NotificationType.FormUpdated, except: userId, log: false);
            notifier.Log(form, NotificationType.FormShared, target.DisplayName);

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

        // Los destinatarios se miran antes de quitar el compartido: despues, esa
        // persona ya no sale en la lista y no habria a quien avisar.
        var destinatarios = notifier.Recipients(form);
        var nombre = shares.GetDisplayNames([userId]).GetValueOrDefault(userId) ?? string.Empty;

        if (!shares.Remove(formId, userId))
            return Problem("Ese formulario no estaba compartido con ese usuario.", statusCode: StatusCodes.Status404NotFound);

        // A quien pierde el acceso se le avisa de lo suyo; a los que se quedan,
        // del cambio en el formulario.
        notifications.Record(userId, NotificationType.FormUnshared, form.Id, form.Title, access.CurrentUserId);

        foreach (var destinatario in destinatarios)
        {
            if (destinatario == userId) continue;
            notifications.Record(destinatario, NotificationType.FormUpdated, form.Id, form.Title, access.CurrentUserId);
        }

        notifier.Log(form, NotificationType.FormUnshared, nombre);

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

        var form = store.GetForm(formId)!;
        notifier.Notify(form, request.IsPublic
            ? NotificationType.FormPublic
            : NotificationType.FormPrivate);

        return Ok(access.WithAccess(form));
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
