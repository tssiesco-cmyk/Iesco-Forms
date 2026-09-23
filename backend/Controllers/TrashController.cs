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
    FormNotifier notifier,
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

        notifier.Notify(form, NotificationType.FormRestored);
        return NoContent();
    }

    /// <summary>Borra el formulario y sus respuestas. Esto ya no se deshace.</summary>
    [HttpDelete("{id}")]
    public IActionResult DeletePermanently(string id)
    {
        var form = MyTrash().FirstOrDefault(f => f.Id == id);
        if (form is null) return NotInTrash(id);

        // Se miran las imagenes antes de borrar: despues ya no hay de donde sacarlas.
        var paths = store.GetImagePaths(id, includeTrashed: true);

        // Y a quien avisar, por lo mismo: al borrarse el formulario se van con
        // el sus compartidos, y despues no quedaria a quien mandarle el aviso.
        var destinatarios = notifier.Recipients(form);
        var titulo = form.Title;

        if (!store.PermanentDeleteForm(id)) return NotInTrash(id);

        notifications.RemoveForForms([id]);
        foreach (var path in paths) images.Delete(path);

        // Despues de limpiar los avisos viejos, no antes: si no, este se iria
        // con ellos.
        notifier.NotifyDeleted(destinatarios, titulo);

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

        // Igual que al borrar uno solo: los destinatarios y el titulo se guardan
        // antes, porque el borrado se lleva por delante los compartidos.
        var avisos = mine.ToDictionary(
            f => f.Id,
            f => (Destinatarios: notifier.Recipients(f), f.Title));

        var deletedIds = mine
            .Where(f => store.PermanentDeleteForm(f.Id))
            .Select(f => f.Id)
            .ToList();

        backgrounds.ForEach(images.Delete);
        notifications.RemoveForForms(deletedIds);

        // Solo de los que se borraron de verdad.
        foreach (var id in deletedIds)
        {
            var (destinatarios, titulo) = avisos[id];
            notifier.NotifyDeleted(destinatarios, titulo);
        }

        return Ok(new { deleted = deletedIds.Count });
    }

    private ObjectResult NotInTrash(string id) =>
        Problem($"No hay ningun formulario con id '{id}' en la papelera.",
            statusCode: StatusCodes.Status404NotFound);
}
