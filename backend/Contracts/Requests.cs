using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace IescoForms.Api.Contracts;

// Los campos opcionales son null cuando el cliente no los envia. En las
// actualizaciones eso significa "no tocar este valor", no "ponlo vacio".
//
// Ojo con los atributos de validacion: en un record deben quedar sobre el
// parametro del constructor primario. Con [property: ...] ASP.NET los ignora
// y lanza InvalidOperationException al validar.

public record CreateFormRequest(
    [MaxLength(200)] string? Title,
    [MaxLength(1000)] string? Description);

public record UpdateFormRequest(
    [MaxLength(200)] string? Title,
    [MaxLength(1000)] string? Description,
    string? Status);

public record AddQuestionRequest([Required] string Type);

public record UpdateQuestionRequest(
    [MaxLength(500)] string? Title,
    [MaxLength(1000)] string? Description,
    bool? Required);

public record ReorderQuestionsRequest(int FromIndex, int ToIndex);

public record UpdateOptionRequest([MaxLength(500)] string? Text);

public record AddIntroFieldRequest(string? Type);

public record UpdateIntroFieldRequest(
    [MaxLength(200)] string? Label,
    [MaxLength(200)] string? Placeholder,
    bool? Required,
    bool? Enabled);

public record SubmitResponseRequest(
    Dictionary<string, JsonNode?>? Answers,
    Dictionary<string, string>? Respondent);

public record UpdateBackgroundRequest(bool? Overlay, bool? PerQuestion);

public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato valido.")]
    string Email,

    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    string Password,

    bool RememberMe = false);
