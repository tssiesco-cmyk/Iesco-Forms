using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Enlaces para responder sin iniciar sesion que vencen a una hora dada.
///
/// Vencido un enlace, solo cae ese enlace: el formulario sigue abierto y se
/// puede crear otro. Los gestiona quien puede editar el formulario.
/// </summary>
[ApiController]
[Authorize]
public class FormLinksController(
    IFormStore store,
    IFormLinkStore links,
    FormNotifier notifier,
    FormAccess access) : ControllerBase
{
    /// <summary>Tope para no dejar enlaces abiertos practicamente para siempre.</summary>
    private static readonly TimeSpan MaxDuration = TimeSpan.FromDays(365);

    [HttpGet("api/forms/{formId}/links")]
    public ActionResult<IReadOnlyList<FormLink>> GetAll(string formId)
    {
        if (Editable(formId) is null) return FormNotFound(formId);
        return Ok(links.List(formId));
    }

    [HttpPost("api/forms/{formId}/links")]
    public ActionResult<FormLink> Create(string formId, [FromBody] FormLinkExpiryRequest request)
    {
        if (Editable(formId) is not { } form) return FormNotFound(formId);
        if (InvalidExpiry(request.ExpiresAt) is { } problem) return problem;

        var link = links.Create(formId, request.ExpiresAt!.Value, access.CurrentUserId);
        notifier.Notify(form, NotificationType.FormLink);

        return Ok(link);
    }

    /// <summary>Cambia la hora de vencimiento. Sirve tambien para reabrir uno vencido.</summary>
    [HttpPatch("api/forms/{formId}/links/{linkId}")]
    public ActionResult<FormLink> UpdateExpiry(string formId, string linkId, [FromBody] FormLinkExpiryRequest request)
    {
        if (Editable(formId) is not { } form) return FormNotFound(formId);
        if (InvalidExpiry(request.ExpiresAt) is { } problem) return problem;

        var updated = links.UpdateExpiry(formId, linkId, request.ExpiresAt!.Value);
        if (updated is null) return LinkNotFound();

        notifier.Notify(form, NotificationType.FormLink);
        return Ok(updated);
    }

    /// <summary>Anula el enlace al momento, aunque no haya vencido.</summary>
    [HttpDelete("api/forms/{formId}/links/{linkId}")]
    public IActionResult Delete(string formId, string linkId)
    {
        if (Editable(formId) is not { } form) return FormNotFound(formId);
        if (!links.Delete(formId, linkId)) return LinkNotFound();

        notifier.Notify(form, NotificationType.FormLink);
        return NoContent();
    }

    /// <summary>
    /// Lo que abre quien recibe el enlace, sin sesion. Devuelve el formulario
    /// solo si el enlace sigue vigente y el formulario esta publicado.
    ///
    /// Sin cache: un 410 o un 404 los guarda el navegador por su cuenta, y un
    /// enlace reabierto seguiria saliendo como vencido.
    /// </summary>
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet("api/links/{token}")]
    public ActionResult<object> Open(string token)
    {
        var found = links.FindByToken(token);
        if (found is null) return LinkNotFound();

        var (link, formId) = found.Value;

        if (link.ExpiresAt <= DateTimeOffset.UtcNow)
            return Problem("Este enlace ya vencio. Pide uno nuevo a quien te lo envio.",
                statusCode: StatusCodes.Status410Gone);

        var form = store.GetForm(formId);
        if (form is null || form.TrashedAt is not null) return LinkNotFound();

        if (form.Status != FormStatus.Active)
            return Problem("Este formulario no esta aceptando respuestas en este momento.",
                statusCode: StatusCodes.Status409Conflict);

        return Ok(new { expiresAt = link.ExpiresAt, form });
    }

    private Form? Editable(string formId)
    {
        var form = store.GetForm(formId);
        return form is not null && form.TrashedAt is null && access.LevelFor(form) >= FormAccessLevel.Edit
            ? form
            : null;
    }

    private ObjectResult? InvalidExpiry(DateTimeOffset? expiresAt)
    {
        if (expiresAt is null)
            return Problem("La fecha de vencimiento es obligatoria.", statusCode: StatusCodes.Status400BadRequest);

        if (expiresAt <= DateTimeOffset.UtcNow)
            return Problem("La fecha de vencimiento tiene que ser futura.", statusCode: StatusCodes.Status400BadRequest);

        if (expiresAt > DateTimeOffset.UtcNow + MaxDuration)
            return Problem("Un enlace puede durar como mucho un ano.", statusCode: StatusCodes.Status400BadRequest);

        return null;
    }

    private ObjectResult FormNotFound(string id) =>
        Problem($"No existe el formulario '{id}'.", statusCode: StatusCodes.Status404NotFound);

    private ObjectResult LinkNotFound() =>
        Problem("El enlace no existe o fue anulado.", statusCode: StatusCodes.Status404NotFound);
}
