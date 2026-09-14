using System.Security.Cryptography;
using System.Text;

namespace IescoForms.Api.Services;

/// <summary>
/// Genera el id de un usuario a partir de su correo, siempre el mismo.
///
/// Antes se usaba un Guid nuevo en cada arranque, y eso tenia dos efectos malos:
/// la cookie de sesion dejaba de valer al reiniciar el backend, y nada podia
/// referirse a un usuario de forma estable (por ejemplo, el dueno de un
/// formulario de ejemplo).
/// </summary>
public static class UserIdentity
{
    public static string ForEmail(string email)
    {
        var normalized = (email ?? string.Empty).Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));

        return Convert.ToHexString(bytes)[..8].ToLowerInvariant();
    }
}
