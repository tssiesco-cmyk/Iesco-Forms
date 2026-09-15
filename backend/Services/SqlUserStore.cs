using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>
/// Usuarios leidos de SQL Server. Reemplaza a <see cref="InMemoryUserStore"/>.
///
/// A diferencia de aquel, se registra como Scoped: el DbContext dura lo que la
/// peticion, y un singleton no puede quedarse con uno guardado.
///
/// Los metodos son sincronos porque asi esta definida la interfaz. No se
/// cambio a async para no arrastrar el cambio hasta los controladores; EF
/// soporta ambas formas y el volumen de esta tabla es minimo.
/// </summary>
public class SqlUserStore(IescoFormsDbContext db) : IUserStore
{
    public User? FindByEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;

        // El correo se guarda siempre en minusculas, asi que basta normalizar
        // lo que llega. Hacerlo aqui y no en SQL deja que se use el indice.
        var normalized = email.Trim().ToLowerInvariant();

        return ToModel(db.Users
            .AsNoTracking()
            .FirstOrDefault(u => u.Email == normalized && u.IsActive));
    }

    public User? FindById(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;

        return ToModel(db.Users
            .AsNoTracking()
            .FirstOrDefault(u => u.Id == id && u.IsActive));
    }

    public User? ValidateCredentials(string email, string password)
    {
        var user = FindByEmail(email);

        // Si el correo no existe igual ciframos una contrasena de descarte. Sin
        // esto, un correo inexistente responderia mucho mas rapido que uno real
        // y permitiria averiguar que cuentas existen.
        if (user is null)
        {
            PasswordHasher.Verify(password, PasswordHasher.Hash("descarte"));
            return null;
        }

        return PasswordHasher.Verify(password, user.PasswordHash) ? user : null;
    }

    /// <summary>
    /// La fila de la tabla no sale nunca de esta clase: hacia afuera solo viaja
    /// el modelo que ya conocian los controladores.
    /// </summary>
    private static User? ToModel(UserRow? row) => row is null ? null : new User
    {
        Id = row.Id,
        Email = row.Email,
        DisplayName = row.DisplayName,
        Role = row.Role,
        PasswordHash = row.PasswordHash,
    };
}
