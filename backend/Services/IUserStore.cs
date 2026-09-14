using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Mismo patron que IFormStore: cuando entre SQL Server se escribe otra
/// implementacion y solo cambia el registro en Program.cs.
/// </summary>
public interface IUserStore
{
    User? FindByEmail(string email);
    User? FindById(string id);

    /// <summary>Comprueba la contrasena y devuelve el usuario, o null si no cuadra.</summary>
    User? ValidateCredentials(string email, string password);
}
