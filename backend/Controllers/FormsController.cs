using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/forms")]
public class FormsController(
    IFormStore store,
    FormNotifier notifier,
    ImageStorage images,
    FormAccess access,
    IUserTemplateStore userTemplates,
    IFormActivityStore activity) : ControllerBase
{
    private string CurrentUserId => access.CurrentUserId;

    /// <summary>
    /// Avisa de un cambio en el formulario al dueno y a quienes colaboran en el.
    /// Se avisa aunque el cambio lo haya hecho uno mismo: sirve de registro de
    /// actividad. Los avisos del mismo tipo se agrupan mientras no se lean, asi
    /// que teclear un titulo no genera un aviso por pulsacion.
    /// </summary>
    private void Notify(Form form, string type) => notifier.Notify(form, type);

    /// <summary>
    /// Devuelve el formulario solo si el usuario llega al nivel pedido. Si no,
    /// se responde como si no existiera: un 403 confirmaria que ese id es de otro.
    /// Quien solo tiene permiso de ver tampoco recibe un 403 al intentar editar,
    /// por lo mismo.
    /// </summary>
    private Form? WithLevel(string id, FormAccessLevel minimum)
    {
        var form = store.GetForm(id);
        return form is not null && access.LevelFor(form) >= minimum ? form : null;
    }

    /// <summary>Dueno o compartido con permiso de edicion.</summary>
    private Form? Editable(string id) => WithLevel(id, FormAccessLevel.Edit);

    // --- Formularios ---

    [HttpGet]
    public ActionResult<IReadOnlyList<Form>> GetAll() =>
        Ok(access.VisibleWithAccess(store.GetForms()));

    /// <summary>
    /// Formularios publicos de otros usuarios, para responderlos. Solo los
    /// publicados: un borrador no acepta respuestas. Los propios no salen aqui,
    /// ya estan en Mis formularios.
    /// </summary>
    [HttpGet("public")]
    public ActionResult<IReadOnlyList<Form>> GetPublic() =>
        Ok(access.WithOwnerNames(store.GetForms()
            .Where(f => f.IsPublic && f.Status == FormStatus.Active && f.OwnerId != CurrentUserId)
            .ToList()));

    /// <summary>
    /// Con sesion, un formulario publicado lo puede leer cualquiera (para
    /// responderlo); un borrador solo quien tiene acceso. Sin sesion no se lee
    /// por id: para responder sin cuenta estan los enlaces que vencen
    /// (/api/links/{token}), y si el id bastara el vencimiento no serviria.
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<Form> GetById(string id)
    {
        var form = store.GetForm(id);
        if (form is null) return FormNotFound(id);

        var level = access.LevelFor(form);

        // Publicado: lo puede leer cualquier usuario. Si ademas tiene acceso, se
        // le dice que puede hacer con el.
        if (form.Status == FormStatus.Active)
            return Ok(level == FormAccessLevel.None ? form : access.WithAccess(form));

        // Borrador: solo quien tiene acceso (dueno, administrador o alguien con
        // quien se compartio). Se responde 404 y no 401 a proposito, para no
        // confirmar que ese id existe.
        if (level == FormAccessLevel.None) return FormNotFound(id);

        return Ok(access.WithAccess(form));
    }

    [HttpPost]
    public ActionResult<Form> Create([FromBody] CreateFormRequest request)
    {
        var form = store.CreateForm(request.Title, request.Description, CurrentUserId);
        Notify(form, NotificationType.FormCreated);

        return CreatedAtAction(nameof(GetById), new { id = form.Id }, access.WithAccess(form));
    }

    /// <summary>
    /// Crea un formulario desde una plantilla del catalogo o de un usuario. Las
    /// imagenes subidas se copian: el formulario nuevo tiene las suyas y puede
    /// cambiarlas o borrarse sin dejar a la plantilla sin fondo.
    /// </summary>
    [HttpPost("from-template/{templateId}")]
    public ActionResult<Form> CreateFromTemplate(string templateId)
    {
        // Las del catalogo son instancias compartidas: se trabaja sobre una copia
        // para que MapImages no las modifique para todos.
        var template = SeedData.FindTemplate(templateId)?.Clone() ?? userTemplates.Find(templateId);
        if (template is null)
            return Problem($"No existe la plantilla '{templateId}'.", statusCode: StatusCodes.Status404NotFound);

        template.MapImages(images.Copy);
        var form = store.CreateFormFrom(template, CurrentUserId);
        Notify(form, NotificationType.FormCreated);

        return CreatedAtAction(nameof(GetById), new { id = form.Id }, access.WithAccess(form));
    }

    /// <summary>
    /// Copia un formulario con todo su contenido, pero sin respuestas, sin
    /// compartidos, sin enlaces y sin cierre. La copia nace en borrador y es de
    /// quien la pide, aunque el original fuera de otro.
    /// </summary>
    [HttpPost("{id}/duplicate")]
    public ActionResult<Form> Duplicate(string id)
    {
        if (Editable(id) is null) return FormNotFound(id);

        var template = store.ToTemplate(id);
        if (template is null) return FormNotFound(id);

        template.MapImages(images.Copy);
        // El titulo admite 200 caracteres; el prefijo no puede pasarse de ahi.
        var title = $"Copia de {template.Name}";
        if (title.Length > 200) title = title[..200];

        var copy = store.CreateFormFrom(template, CurrentUserId, title);
        Notify(copy, NotificationType.FormCreated);

        return CreatedAtAction(nameof(GetById), new { id = copy.Id }, access.WithAccess(copy));
    }

    /// <summary>
    /// Guarda el formulario como plantilla del equipo. Es una foto del momento:
    /// cambios posteriores al formulario no la tocan, ni al reves.
    /// </summary>
    [HttpPost("{id}/save-as-template")]
    public ActionResult<Template> SaveAsTemplate(string id, [FromBody] SaveAsTemplateRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var template = store.ToTemplate(id);
        if (template is null) return FormNotFound(id);

        if (!string.IsNullOrWhiteSpace(request.Name)) template.Name = request.Name.Trim();
        if (request.Description is not null) template.Description = request.Description.Trim();

        template.MapImages(images.Copy);
        var saved = userTemplates.Add(template, CurrentUserId);
        saved.CanDelete = true;

        notifier.Log(form, FormActivityAction.SavedAsTemplate, saved.Name);
        return Ok(saved);
    }

    /// <summary>Cierre por fecha, cupo de respuestas y mensaje final.</summary>
    [HttpPatch("{id}/settings")]
    public ActionResult<Form> UpdateSettings(string id, [FromBody] UpdateFormSettingsRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var updated = store.UpdateSettings(id, request.ClosesAt, request.ClearClosesAt == true,
            request.MaxResponses, request.ConfirmationMessage);
        if (updated is null) return FormNotFound(id);

        // Sin aviso: no cambia lo que ven los colaboradores al editar. Pero si
        // queda en el historial, porque explica por que dejo de recibir respuestas.
        notifier.Log(form, FormActivityAction.SettingsUpdated);

        return Ok(access.WithAccess(updated));
    }

    /// <summary>Historial del formulario. Lo ve cualquiera con acceso.</summary>
    [HttpGet("{id}/activity")]
    public ActionResult<IReadOnlyList<FormActivity>> GetActivity(string id)
    {
        if (WithLevel(id, FormAccessLevel.View) is null) return FormNotFound(id);
        return Ok(activity.GetForForm(id, limit: 100));
    }

    [HttpPatch("{id}")]
    public ActionResult<Form> Update(string id, [FromBody] UpdateFormRequest request)
    {
        if (request.Status is not null && request.Status is not (FormStatus.Draft or FormStatus.Active))
        {
            ModelState.AddModelError(nameof(request.Status),
                $"Estado no valido. Se espera '{FormStatus.Draft}' o '{FormStatus.Active}'.");
            return ValidationProblem(ModelState);
        }

        var before = Editable(id);
        if (before is null) return FormNotFound(id);

        // Se copia antes de actualizar: el almacen devuelve el mismo objeto y
        // comparar despues seria comparar el valor nuevo consigo mismo.
        var previousStatus = before.Status;

        var form = store.UpdateForm(id, request.Title, request.Description, request.Status);
        if (form is null) return FormNotFound(id);

        if (request.Status is not null && request.Status != previousStatus)
        {
            Notify(form, request.Status == FormStatus.Active
                ? NotificationType.FormPublished
                : NotificationType.FormUnpublished);
        }
        else if (request.Title is not null || request.Description is not null)
        {
            Notify(form, NotificationType.FormUpdated);
        }

        return Ok(access.WithAccess(form));
    }

    /// <summary>
    /// Manda el formulario a la papelera. No lo borra: se puede restaurar.
    /// Solo el dueno: quien lo tiene compartido no puede hacerlo desaparecer.
    /// </summary>
    [HttpDelete("{id}")]
    public IActionResult Trash(string id)
    {
        var form = WithLevel(id, FormAccessLevel.Owner);
        if (form is null || !store.TrashForm(id)) return FormNotFound(id);

        Notify(form, NotificationType.FormTrashed);
        return NoContent();
    }

    // --- Preguntas ---

    [HttpPost("{id}/questions")]
    public ActionResult<Question> AddQuestion(string id, [FromBody] AddQuestionRequest request)
    {
        if (!QuestionType.IsValid(request.Type))
        {
            ModelState.AddModelError(nameof(request.Type),
                $"Tipo de pregunta no valido: '{request.Type}'.");
            return ValidationProblem(ModelState);
        }

        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var question = store.AddQuestion(id, request.Type);
        if (question is null) return FormNotFound(id);

        Notify(form, NotificationType.FormUpdated);
        return Ok(question);
    }

    [HttpPost("{id}/questions/{questionId}/duplicate")]
    public ActionResult<Question> DuplicateQuestion(string id, string questionId)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var question = store.DuplicateQuestion(id, questionId);
        if (question is null) return QuestionNotFound(id, questionId);

        Notify(form, NotificationType.FormUpdated);
        return Ok(question);
    }

    [HttpPatch("{id}/questions/{questionId}")]
    public ActionResult<Question> UpdateQuestion(string id, string questionId, [FromBody] UpdateQuestionRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        // Null significa "no lo toques"; cualquier otro valor tiene que ser uno
        // de los tres conocidos, para que no entre basura en el modelo.
        if (request.TextCase is not null && !QuestionTextCase.IsValid(request.TextCase))
        {
            ModelState.AddModelError(nameof(request.TextCase),
                $"Formato de texto no valido: '{request.TextCase}'.");
            return ValidationProblem(ModelState);
        }

        if (request.JumpTo is not null && !IsValidJump(form, questionId, request.JumpTo))
        {
            ModelState.AddModelError(nameof(request.JumpTo), "El salto tiene que llevar a otra pregunta del formulario o al final.");
            return ValidationProblem(ModelState);
        }

        var question = store.UpdateQuestion(id, questionId, request.Title, request.Description, request.Required,
            request.TextCase, request.JumpTo, request.ScaleMax);
        if (question is null) return QuestionNotFound(id, questionId);

        Notify(form, NotificationType.FormUpdated);
        return Ok(question);
    }

    [HttpDelete("{id}/questions/{questionId}")]
    public IActionResult DeleteQuestion(string id, string questionId)
    {
        var form = Editable(id);
        if (form is null) return QuestionNotFound(id, questionId);

        // Se anota la imagen antes de borrar: despues ya no hay de donde sacarla.
        var image = form.Questions.FirstOrDefault(q => q.Id == questionId)?.BackgroundImage;

        if (!store.DeleteQuestion(id, questionId)) return QuestionNotFound(id, questionId);

        images.Delete(image);
        Notify(form, NotificationType.FormUpdated);

        return NoContent();
    }

    [HttpPost("{id}/questions/reorder")]
    public IActionResult ReorderQuestions(string id, [FromBody] ReorderQuestionsRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        if (!store.ReorderQuestions(id, request.FromIndex, request.ToIndex))
        {
            return Problem("Los indices estan fuera del rango de preguntas del formulario.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        Notify(form, NotificationType.FormUpdated);
        return NoContent();
    }

    // --- Opciones ---

    [HttpPost("{id}/questions/{questionId}/options")]
    public ActionResult<QuestionOption> AddOption(string id, string questionId)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var option = store.AddOption(id, questionId);
        if (option is null)
        {
            return Problem($"No se encontro la pregunta '{questionId}', o su tipo no admite opciones.",
                statusCode: StatusCodes.Status404NotFound);
        }

        Notify(form, NotificationType.FormUpdated);
        return Ok(option);
    }

    [HttpPatch("{id}/questions/{questionId}/options/{optionId}")]
    public IActionResult UpdateOption(string id, string questionId, string optionId, [FromBody] UpdateOptionRequest request)
    {
        var form = Editable(id);

        if (form is not null && request.JumpTo is not null && !IsValidJump(form, questionId, request.JumpTo))
        {
            ModelState.AddModelError(nameof(request.JumpTo), "El salto tiene que llevar a otra pregunta del formulario o al final.");
            return ValidationProblem(ModelState);
        }

        if (form is null || !store.UpdateOption(id, questionId, optionId, request.Text, request.JumpTo))
        {
            return Problem($"No se encontro la opcion '{optionId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        Notify(form, NotificationType.FormUpdated);
        return NoContent();
    }

    [HttpDelete("{id}/questions/{questionId}/options/{optionId}")]
    public IActionResult DeleteOption(string id, string questionId, string optionId)
    {
        var form = Editable(id);
        if (form is null || !store.DeleteOption(id, questionId, optionId))
        {
            return Problem($"No se encontro la opcion '{optionId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        Notify(form, NotificationType.FormUpdated);
        return NoContent();
    }

    // --- Campos del respondedor ---

    [HttpPost("{id}/intro-fields")]
    public ActionResult<IntroField> AddIntroField(string id, [FromBody] AddIntroFieldRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var field = store.AddIntroField(id, request.Type);
        if (field is null) return FormNotFound(id);

        Notify(form, NotificationType.FormUpdated);
        return Ok(field);
    }

    [HttpPatch("{id}/intro-fields/{fieldId}")]
    public IActionResult UpdateIntroField(string id, string fieldId, [FromBody] UpdateIntroFieldRequest request)
    {
        var form = Editable(id);
        if (form is null || !store.UpdateIntroField(id, fieldId, request.Label, request.Placeholder, request.Required, request.Enabled))
        {
            return Problem($"No se encontro el campo '{fieldId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        Notify(form, NotificationType.FormUpdated);
        return NoContent();
    }

    [HttpDelete("{id}/intro-fields/{fieldId}")]
    public IActionResult RemoveIntroField(string id, string fieldId)
    {
        var form = Editable(id);
        if (form is null || !store.RemoveIntroField(id, fieldId))
        {
            return Problem($"No se encontro el campo '{fieldId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        Notify(form, NotificationType.FormUpdated);
        return NoContent();
    }

    // --- Imagen de fondo ---

    /// <summary>
    /// Sube la imagen de fondo que vera quien responda. Reemplaza la anterior y
    /// borra su archivo, para no ir dejando basura en disco.
    /// </summary>
    [HttpPost("{id}/background")]
    // Por encima del maximo real (5 MB) a proposito: asi un archivo algo mayor
    // llega y recibe un mensaje claro, en vez de que Kestrel corte la conexion.
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<ActionResult<Form>> UploadBackground(
        string id, IFormFile file, CancellationToken cancellationToken)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        if (file is null) return Problem("No llego ningun archivo.", statusCode: StatusCodes.Status400BadRequest);

        var result = await images.SaveAsync(file, ImageStorage.Backgrounds, cancellationToken);
        if (!result.Ok)
        {
            ModelState.AddModelError("file", result.Error!);
            return ValidationProblem(ModelState);
        }

        var previous = store.SetBackground(id, result.PublicPath, null, null);
        images.Delete(previous);

        Notify(form, NotificationType.FormUpdated);
        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    /// <summary>Quita el fondo y borra su archivo.</summary>
    [HttpDelete("{id}/background")]
    public ActionResult<Form> RemoveBackground(string id)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        var previous = store.SetBackground(id, string.Empty, null, null);
        images.Delete(previous);

        Notify(form, NotificationType.FormUpdated);
        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    /// <summary>Activa o desactiva el velo oscuro sobre la imagen.</summary>
    [HttpPatch("{id}/background")]
    public ActionResult<Form> UpdateBackground(string id, [FromBody] UpdateBackgroundRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        store.SetBackground(id, null, request.Overlay, request.PerQuestion);
        Notify(form, NotificationType.FormUpdated);

        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    /// <summary>
    /// Portada: la pantalla de bienvenida antes de las preguntas. Se puede
    /// activar o apagar y darle sus propios textos.
    /// </summary>
    [HttpPatch("{id}/cover")]
    public ActionResult<Form> UpdateCover(string id, [FromBody] UpdateCoverRequest request)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        store.SetCover(id, request.Enabled, request.Title, request.Subtitle, request.Welcome);
        Notify(form, NotificationType.FormUpdated);

        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    /// <summary>
    /// Sube la imagen de una pregunta concreta. Solo se muestra si el formulario
    /// tiene activado el fondo por pregunta.
    /// </summary>
    [HttpPost("{id}/questions/{questionId}/background")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<ActionResult<Form>> UploadQuestionBackground(
        string id, string questionId, IFormFile file, CancellationToken cancellationToken)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        if (!form.Questions.Any(q => q.Id == questionId)) return QuestionNotFound(id, questionId);
        if (file is null) return Problem("No llego ningun archivo.", statusCode: StatusCodes.Status400BadRequest);

        var result = await images.SaveAsync(file, ImageStorage.Backgrounds, cancellationToken);
        if (!result.Ok)
        {
            ModelState.AddModelError("file", result.Error!);
            return ValidationProblem(ModelState);
        }

        var previous = store.SetQuestionBackground(id, questionId, result.PublicPath);
        images.Delete(previous);

        Notify(form, NotificationType.FormUpdated);
        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    [HttpDelete("{id}/questions/{questionId}/background")]
    public ActionResult<Form> RemoveQuestionBackground(string id, string questionId)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);
        if (!form.Questions.Any(q => q.Id == questionId)) return QuestionNotFound(id, questionId);

        var previous = store.SetQuestionBackground(id, questionId, string.Empty);
        images.Delete(previous);

        Notify(form, NotificationType.FormUpdated);
        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    /// <summary>Imagen propia de la pantalla de datos del respondedor.</summary>
    [HttpPost("{id}/intro-background")]
    [RequestSizeLimit(8 * 1024 * 1024)]
    public async Task<ActionResult<Form>> UploadIntroBackground(
        string id, IFormFile file, CancellationToken cancellationToken)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);
        if (file is null) return Problem("No llego ningun archivo.", statusCode: StatusCodes.Status400BadRequest);

        var result = await images.SaveAsync(file, ImageStorage.Backgrounds, cancellationToken);
        if (!result.Ok)
        {
            ModelState.AddModelError("file", result.Error!);
            return ValidationProblem(ModelState);
        }

        images.Delete(store.SetIntroBackground(id, result.PublicPath));
        Notify(form, NotificationType.FormUpdated);

        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    [HttpDelete("{id}/intro-background")]
    public ActionResult<Form> RemoveIntroBackground(string id)
    {
        var form = Editable(id);
        if (form is null) return FormNotFound(id);

        images.Delete(store.SetIntroBackground(id, string.Empty));
        Notify(form, NotificationType.FormUpdated);

        return Ok(access.WithAccess(store.GetForm(id)!));
    }

    // --- Ayudantes ---

    /// <summary>
    /// Un salto vale si se quita (vacio), si termina el formulario o si lleva a
    /// otra pregunta del mismo formulario. Que sea hacia adelante no se exige
    /// aqui: el orden cambia al reordenar, y al responder uno hacia atras se ignora.
    /// </summary>
    private static bool IsValidJump(Form form, string questionId, string jumpTo) =>
        jumpTo.Length == 0
        || jumpTo == QuestionJump.End
        || (jumpTo != questionId && form.Questions.Any(q => q.Id == jumpTo));

    private ObjectResult FormNotFound(string id) =>
        Problem($"No existe el formulario '{id}'.", statusCode: StatusCodes.Status404NotFound);

    private ObjectResult QuestionNotFound(string formId, string questionId) =>
        Problem($"No se encontro la pregunta '{questionId}' en el formulario '{formId}'.",
            statusCode: StatusCodes.Status404NotFound);
}
