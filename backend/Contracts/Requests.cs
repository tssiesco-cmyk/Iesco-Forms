using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;
using IescoForms.Api.Services;

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

/// <summary>
/// Cierre y mensaje final. Null = no tocar. Para quitar la fecha va
/// ClearClosesAt; un MaxResponses de 0 quita el cupo.
/// </summary>
public record UpdateFormSettingsRequest(
    DateTimeOffset? ClosesAt,
    bool? ClearClosesAt,
    [Range(0, 1_000_000)] int? MaxResponses,
    [MaxLength(1000)] string? ConfirmationMessage);

public record SaveAsTemplateRequest(
    [MaxLength(200)] string? Name,
    [MaxLength(1000)] string? Description);

public record AddQuestionRequest([Required] string Type);

public record UpdateQuestionRequest(
    [MaxLength(500)] string? Title,
    [MaxLength(1000)] string? Description,
    bool? Required,
    string? TextCase);

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

/// <summary>Portada. Cada campo es opcional: lo que llega null no se toca.</summary>
public record UpdateCoverRequest(bool? Enabled, string? Title, string? Subtitle, string? Welcome);

public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato valido.")]
    string Email,

    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    string Password,

    bool RememberMe = false);

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato valido.")]
    [MaxLength(256)]
    string Email);

public record SetPublicRequest(bool IsPublic);

/// <summary>Cuando vence el enlace. Sirve para crearlo y para cambiarle la hora.</summary>
public record FormLinkExpiryRequest(
    [Required(ErrorMessage = "La fecha de vencimiento es obligatoria.")]
    DateTimeOffset? ExpiresAt);

// --- Usuarios (solo administradores) ---

public record CreateUserRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato valido.")]
    [MaxLength(256)]
    string Email,

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(150)]
    string DisplayName,

    [Required(ErrorMessage = "El rol es obligatorio.")]
    string Role,

    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    [MinLength(PasswordHasher.MinLength, ErrorMessage = "La contrasena debe tener al menos 8 caracteres.")]
    string Password);

public record UpdateUserRequest(
    [MaxLength(150)] string? DisplayName,
    string? Role,
    bool? IsActive);

public record ResetPasswordRequest(
    [Required(ErrorMessage = "La contrasena es obligatoria.")]
    [MinLength(PasswordHasher.MinLength, ErrorMessage = "La contrasena debe tener al menos 8 caracteres.")]
    string NewPassword);

// --- Mi cuenta ---

public record UpdateAccountRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(150)]
    string DisplayName);

public record ChangePasswordRequest(
    [Required(ErrorMessage = "Escribe tu contrasena actual.")]
    string CurrentPassword,

    [Required(ErrorMessage = "La contrasena nueva es obligatoria.")]
    [MinLength(PasswordHasher.MinLength, ErrorMessage = "La contrasena nueva debe tener al menos 8 caracteres.")]
    string NewPassword);
