using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/forms/{formId}/responses")]
public class ResponsesController(IFormStore store, INotificationStore notifications) : ControllerBase
{
    /// <summary>Respuestas de un formulario, de la mas reciente a la mas antigua.</summary>
    [HttpGet]
    public ActionResult<IReadOnlyList<FormResponse>> GetByForm(string formId)
    {
        if (store.GetForm(formId) is null)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        return Ok(store.GetResponses(formId));
    }

    /// <summary>
    /// Registra una respuesta. Este es el unico endpoint de escritura abierto:
    /// lo llama quien llena el formulario, no quien lo administra. Leer las
    /// respuestas si exige sesion.
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    public ActionResult<FormResponse> Submit(string formId, [FromBody] SubmitResponseRequest request)
    {
        var form = store.GetForm(formId);
        if (form is null)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        if (form.Status != FormStatus.Active)
        {
            return Problem("El formulario todavia es un borrador y no acepta respuestas.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Las preguntas obligatorias deben venir contestadas.
        var missing = form.Questions
            .Where(q => q.Required && !HasAnswer(request.Answers, q.Id))
            .Select(q => string.IsNullOrWhiteSpace(q.Title) ? q.Id : q.Title)
            .ToList();

        if (missing.Count > 0)
        {
            ModelState.AddModelError("answers",
                "Faltan respuestas obligatorias: " + string.Join(", ", missing));
            return ValidationProblem(ModelState);
        }

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

        var response = store.AddResponse(formId, request.Answers, request.Respondent);
        if (response is null)
        {
            return Problem($"No existe el formulario '{formId}'.", statusCode: StatusCodes.Status404NotFound);
        }

        // Avisar al dueno. Si el formulario no tiene dueno no avisa a nadie, y
        // esto nunca debe tumbar un envio que ya se guardo bien.
        notifications.Record(form.OwnerId, NotificationType.NewResponses, form.Id, form.Title);

        return Ok(response);
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
