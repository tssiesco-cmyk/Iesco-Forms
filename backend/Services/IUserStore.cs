using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Mismo patron que IFormStore: la implementacion se elige en Program.cs.
///
/// FindByEmail y FindById solo devuelven usuarios activos, porque los usan el
/// login y la sesion. La gestion de usuarios necesita ver tambien los
/// desactivados, y para eso estan List y GetSummary.
/// </summary>
public interface IUserStore
{
    User? FindByEmail(string email);
    User? FindById(string id);

    /// <summary>Comprueba la contrasena y devuelve el usuario, o null si no cuadra.</summary>
    User? ValidateCredentials(string email, string password);

    // --- Gestion (solo administradores) ---

    IReadOnlyList<UserSummary> List();
    UserSummary? GetSummary(string id);

    /// <summary>Incluye usuarios desactivados: el correo sigue ocupado.</summary>
    bool EmailExists(string email);

    int CountActiveAdmins();

    UserSummary Create(string email, string displayName, string role, string password);

    /// <summary>Los parametros null no se tocan. Devuelve null si el usuario no existe.</summary>
    UserSummary? Update(string id, string? displayName, string? role, bool? isActive);

    /// <summary>
    /// Devuelve false si el usuario no existe. Tambien cierra la solicitud de
    /// "Olvide mi contrasena" que tuviera pendiente.
    /// </summary>
    bool SetPassword(string id, string newPassword);

    // --- Olvide mi contrasena ---

    /// <summary>
    /// Marca la solicitud si el correo es de un usuario activo; si no, no hace
    /// nada. No devuelve el resultado a proposito: quien llama no debe poder
    /// saber si el correo existe.
    /// </summary>
    void RequestPasswordReset(string email);

    /// <summary>Descarta la solicitud sin tocar la contrasena. Null si el usuario no existe.</summary>
    UserSummary? DismissPasswordReset(string id);
}
