using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// La papelera de cada uno: solo los formularios de los que se es dueno (un
/// Administrador ve todos). Quien tenia uno compartido no lo ve aqui ni puede
/// restaurarlo o borrarlo.
/// </summary>
[ApiController]
[Authorize]
[Route("api/trash")]
public class TrashController(
    IFormStore store,
    INotificationStore notifications,
    ImageStorage images,
    FormAccess access) : ControllerBase
{
    private List<Form> MyTrash() =>
        [.. store.GetTrashedForms().Where(f => access.LevelFor(f) == FormAccessLevel.Owner)];

    [HttpGet]
    public ActionResult<IReadOnlyList<Form>> GetAll() => Ok(MyTrash());

    [HttpPost("{id}/restore")]
    public IActionResult Restore(string id)
    {
        var form = MyTrash().FirstOrDefault(f => f.Id == id);
        if (form is null || !store.RestoreForm(id)) return NotInTrash(id);

        notifications.Record(form.OwnerId, NotificationType.FormRestored, form.Id, form.Title);
        return NoContent();
    }

    /// <summary>Borra el formulario y sus respuestas. Esto ya no se deshace.</summary>
    [HttpDelete("{id}")]
    public IActionResult DeletePermanently(string id)
    {
        if (MyTrash().All(f => f.Id != id)) return NotInTrash(id);

        // Se miran las imagenes antes de borrar: despues ya no hay de donde sacarlas.
        var paths = store.GetImagePaths(id, includeTrashed: true);

        if (!store.PermanentDeleteForm(id)) return NotInTrash(id);

        notifications.RemoveForForms([id]);
        foreach (var path in paths) images.Delete(path);

        return NoContent();
    }

    /// <summary>
    /// Vacia la papelera de quien la pide. Antes vaciaba la de todos los
    /// usuarios; ahora borra uno a uno solo los formularios propios.
    /// </summary>
    [HttpDelete]
    public ActionResult<object> EmptyTrash()
    {
        var mine = MyTrash();

        var backgrounds = mine
            .SelectMany(f => store.GetImagePaths(f.Id, includeTrashed: true))
            .ToList();

        var deletedIds = mine
            .Where(f => store.PermanentDeleteForm(f.Id))
            .Select(f => f.Id)
            .ToList();

        backgrounds.ForEach(images.Delete);
        notifications.RemoveForForms(deletedIds);

        return Ok(new { deleted = deletedIds.Count });
    }

    private ObjectResult NotInTrash(string id) =>
        Problem($"No hay ningun formulario con id '{id}' en la papelera.",
            statusCode: StatusCodes.Status404NotFound);
}
