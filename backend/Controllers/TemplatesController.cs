using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

/// <summary>
/// Las plantillas del catalogo (fijas, en el codigo) y las que guarda el
/// equipo desde sus formularios. Para guardar una nueva: POST
/// /api/forms/{id}/save-as-template.
/// </summary>
[ApiController]
[Authorize]
[Route("api/templates")]
public class TemplatesController(
    IFormStore store,
    IUserTemplateStore userTemplates,
    ImageStorage images,
    FormAccess access) : ControllerBase
{
    /// <summary>Primero las del equipo, que suelen ser las que se buscan, y luego el catalogo.</summary>
    [HttpGet]
    public ActionResult<IReadOnlyList<Template>> GetAll() =>
        Ok(userTemplates.List().Select(WithPermissions).Concat(store.GetTemplates()).ToList());

    [HttpGet("{id}")]
    public ActionResult<Template> GetById(string id)
    {
        var template = store.GetTemplates().FirstOrDefault(t => t.Id == id)
            ?? (userTemplates.Find(id) is { } custom ? WithPermissions(custom) : null);

        return template is null ? TemplateNotFound(id) : Ok(template);
    }

    /// <summary>
    /// Borra una plantilla del equipo: solo su autor o un administrador. Las del
    /// catalogo no se borran desde aqui, viven en el codigo. Los formularios ya
    /// creados con ella no se tocan: son copias.
    /// </summary>
    [HttpDelete("{id}")]
    public IActionResult Delete(string id)
    {
        var template = userTemplates.Find(id);
        if (template is null) return TemplateNotFound(id);

        if (!CanDelete(template))
            return Problem("Solo quien creo la plantilla o un administrador puede borrarla.",
                statusCode: StatusCodes.Status403Forbidden);

        if (!userTemplates.Delete(id)) return TemplateNotFound(id);

        // Sus imagenes son copias propias: nadie mas las usa.
        foreach (var path in template.ImagePaths()) images.Delete(path);

        return NoContent();
    }

    private bool CanDelete(Template template) =>
        access.IsAdmin || (!string.IsNullOrEmpty(template.OwnerId) && template.OwnerId == access.CurrentUserId);

    private Template WithPermissions(Template template)
    {
        template.CanDelete = CanDelete(template);
        return template;
    }

    private ObjectResult TemplateNotFound(string id) =>
        Problem($"No existe la plantilla '{id}'.", statusCode: StatusCodes.Status404NotFound);
}
