namespace IescoForms.Api.Models;

/// <summary>Roles disponibles. Van dentro del token de sesion.</summary>
public static class UserRole
{
    public const string Admin = "Administrador";
    public const string Editor = "Editor";

    public static bool IsValid(string? role) => role is Admin or Editor;
}

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = UserRole.Editor;

    /// <summary>
    /// Contrasena cifrada. Nunca se guarda ni se devuelve en claro: por eso el
    /// perfil que viaja al cliente es <see cref="UserProfile"/>, no esta clase.
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Ruta publica de la foto de perfil ("/uploads/avatars/xxx.png"), o cadena
    /// vacia si no subio ninguna: entonces la interfaz pinta sus iniciales.
    /// </summary>
    public string AvatarUrl { get; set; } = string.Empty;

    public UserProfile ToProfile() => new(Id, Email, DisplayName, Role, AvatarUrl);
}

/// <summary>Lo unico del usuario que sale hacia el cliente.</summary>
public record UserProfile(string Id, string Email, string DisplayName, string Role, string AvatarUrl);

/// <summary>
/// Lo que ve un administrador en la lista de usuarios. Tampoco lleva el hash.
/// </summary>
public record UserSummary(
    string Id,
    string Email,
    string DisplayName,
    string AvatarUrl,
    string Role,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PasswordResetRequestedAt);
