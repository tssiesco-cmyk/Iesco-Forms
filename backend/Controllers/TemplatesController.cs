using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/templates")]
public class TemplatesController(IFormStore store) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<Template>> GetAll() => Ok(store.GetTemplates());

    [HttpGet("{id}")]
    public ActionResult<Template> GetById(string id)
    {
        var template = store.GetTemplates().FirstOrDefault(t => t.Id == id);
        return template is null
            ? Problem($"No existe la plantilla '{id}'.", statusCode: StatusCodes.Status404NotFound)
            : Ok(template);
    }
}
