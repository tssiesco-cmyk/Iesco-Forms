using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/trash")]
public class TrashController(
    IFormStore store,
    INotificationStore notifications,
    ImageStorage images) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<Form>> GetAll() => Ok(store.GetTrashedForms());

    [HttpPost("{id}/restore")]
    public IActionResult Restore(string id)
    {
        var form = store.GetTrashedForms().FirstOrDefault(f => f.Id == id);
        if (form is null || !store.RestoreForm(id)) return NotInTrash(id);

        notifications.Record(form.OwnerId, NotificationType.FormRestored, form.Id, form.Title);
        return NoContent();
    }

    /// <summary>Borra el formulario y sus respuestas. Esto ya no se deshace.</summary>
    [HttpDelete("{id}")]
    public IActionResult DeletePermanently(string id)
    {
        // Se miran las imagenes antes de borrar: despues ya no hay de donde sacarlas.
        var paths = store.GetImagePaths(id, includeTrashed: true);

        if (!store.PermanentDeleteForm(id)) return NotInTrash(id);

        notifications.RemoveForForms([id]);
        foreach (var path in paths) images.Delete(path);

        return NoContent();
    }

    /// <summary>Vacia la papelera completa. Devuelve cuantos formularios se borraron.</summary>
    [HttpDelete]
    public ActionResult<object> EmptyTrash()
    {
        var backgrounds = store.GetTrashedForms()
            .SelectMany(f => store.GetImagePaths(f.Id, includeTrashed: true))
            .ToList();

        var deletedIds = store.EmptyTrash();
        backgrounds.ForEach(images.Delete);
        notifications.RemoveForForms(deletedIds);

        return Ok(new { deleted = deletedIds.Count });
    }

    private ObjectResult NotInTrash(string id) =>
        Problem($"No hay ningun formulario con id '{id}' en la papelera.",
            statusCode: StatusCodes.Status404NotFound);
}
