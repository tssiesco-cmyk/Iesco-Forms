using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/forms/{formId}/responses")]
public class ResponsesController(
    IFormStore store,
    FormNotifier notifier,
    IFormLinkStore links,
    FormAccess access) : ControllerBase
{
    /// <summary>Limite de envios por IP; se registra en Program.cs.</summary>
    public const string SubmitPolicy = "submit-response";

    /// <summary>
    /// Respuestas de un formulario, de la mas reciente a la mas antigua. Las ve
    /// quien tenga cualquier acceso, incluido el permiso de solo ver. Sin acceso
    /// se responde 404, igual que si no existiera.
    /// </summary>
    [HttpGet]
    public ActionResult<IReadOnlyList<FormResponse>> GetByForm(string formId)
    {
        var form = store.GetForm(formId);
        if (form is null || access.LevelFor(form) == FormAccessLevel.None)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        return Ok(store.GetResponses(formId));
    }

    /// <summary>
    /// Registra una respuesta. Es el unico endpoint de escritura abierto: lo
    /// llama quien llena el formulario, no quien lo administra.
    ///
    /// Con sesion basta con que este publicado. Sin sesion hace falta un enlace
    /// vigente de ese formulario (?link=token): asi, cuando el enlace vence,
    /// deja de servir tambien para enviar, no solo para abrir.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting(SubmitPolicy)]
    [HttpPost]
    public ActionResult<FormResponse> Submit(string formId, [FromBody] SubmitResponseRequest request, [FromQuery] string? link)
    {
        var form = store.GetForm(formId);
        if (form is null || form.TrashedAt is not null)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        if (User.Identity?.IsAuthenticated != true)
        {
            var found = string.IsNullOrWhiteSpace(link) ? null : links.FindByToken(link);

            if (found is null || found.Value.FormId != formId)
                return Problem("Para responder sin iniciar sesion hace falta un enlace valido.",
                    statusCode: StatusCodes.Status401Unauthorized);

            if (found.Value.Link.ExpiresAt <= DateTimeOffset.UtcNow)
                return Problem("Este enlace ya vencio y no acepta mas respuestas.",
                    statusCode: StatusCodes.Status410Gone);
        }

        if (form.Status != FormStatus.Active)
        {
            return Problem("El formulario todavia es un borrador y no acepta respuestas.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Cierre por fecha o por cupo. Vale igual con sesion o con enlace.
        if (form.IsClosed)
        {
            return Problem("Este formulario ya cerro y no acepta mas respuestas.",
                statusCode: StatusCodes.Status410Gone);
        }

        // Con logica condicional no todas las preguntas se ven: solo cuentan las
        // del recorrido que dejan estas respuestas. Las saltadas no se exigen y,
        // si llegan (se contesto y luego se volvio atras), no se guardan.
        var visited = FormLogic.VisitedQuestionIds(form.Questions, request.Answers).ToHashSet();
        var path = form.Questions.Where(q => visited.Contains(q.Id)).ToList();

        // Las preguntas obligatorias deben venir contestadas.
        var missing = path
            .Where(q => q.Required && !HasAnswer(request.Answers, q.Id))
            .Select(q => string.IsNullOrWhiteSpace(q.Title) ? q.Id : q.Title)
            .ToList();

        if (missing.Count > 0)
        {
            ModelState.AddModelError("answers",
                "Faltan respuestas obligatorias: " + string.Join(", ", missing));
            return ValidationProblem(ModelState);
        }

        // Numeros, fechas, estrellas y NPS tienen que venir con su formato.
        var invalid = path
            .Select(q => (Question: q, Reason: FormLogic.InvalidValueReason(q, request.Answers?.GetValueOrDefault(q.Id))))
            .Where(x => x.Reason is not null)
            .Select(x => $"{(string.IsNullOrWhiteSpace(x.Question.Title) ? x.Question.Id : x.Question.Title)} ({x.Reason})")
            .ToList();

        if (invalid.Count > 0)
        {
            ModelState.AddModelError("answers",
                "Hay respuestas con un formato no valido: " + string.Join(", ", invalid));
            return ValidationProblem(ModelState);
        }

        var answers = request.Answers?
            .Where(pair => visited.Contains(pair.Key))
            .ToDictionary(pair => pair.Key, pair => pair.Value);

        // Y los campos de intro marcados como obligatorios tambien.
        var missingFields = form.IntroFields
            .Where(f => f.Enabled && f.Required)
            .Where(f => request.Respondent is null
                || !request.Respondent.TryGetValue(f.Id, out var value)
                || string.IsNullOrWhiteSpace(value))
            .Select(f => f.Label)
            .ToList();

        if (missingFields.Count > 0)
        {
            ModelState.AddModelError("respondent",
                "Faltan datos obligatorios: " + string.Join(", ", missingFields));
            return ValidationProblem(ModelState);
        }

        var response = store.AddResponse(formId, answers, request.Respondent);
        if (response is null)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        // Avisar al dueno y a quienes colaboran en el formulario: la respuesta
        // le interesa a todo el que trabaja con el, no solo a quien lo creo.
        // Si no tiene dueno ni compartidos no avisa a nadie, y esto nunca debe
        // tumbar un envio que ya se guardo bien.
        notifier.Notify(form, NotificationType.NewResponses);

        return Ok(response);
    }

    /// <summary>
    /// Borra una respuesta para siempre (una de prueba, una repetida). Pide
    /// permiso de edicion: quien solo ve resultados no puede hacerlos cambiar.
    /// Queda en el historial, pero sin aviso.
    /// </summary>
    [HttpDelete("{responseId}")]
    public IActionResult Delete(string formId, string responseId)
    {
        var form = store.GetForm(formId);
        if (form is null || access.LevelFor(form) < FormAccessLevel.Edit)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        if (!store.DeleteResponse(formId, responseId))
        {
            return Problem("Esa respuesta no existe o ya se borro.", statusCode: StatusCodes.Status404NotFound);
        }

        notifier.Log(form, FormActivityAction.ResponseDeleted);
        return NoContent();
    }

    /// <summary>
    /// Una pregunta cuenta como contestada si trae texto no vacio o al menos una
    /// opcion elegida.
    /// </summary>
    private static bool HasAnswer(Dictionary<string, System.Text.Json.Nodes.JsonNode?>? answers, string questionId)
    {
        if (answers is null || !answers.TryGetValue(questionId, out var value) || value is null) return false;

        return value switch
        {
            System.Text.Json.Nodes.JsonArray array => array.Count > 0,
            _ => !string.IsNullOrWhiteSpace(value.ToString()),
        };
    }
}
