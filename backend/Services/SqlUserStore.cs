using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>
/// Usuarios leidos de SQL Server.
///
/// Se registra como Scoped: el DbContext dura lo que la peticion, y un
/// singleton no puede quedarse con uno guardado.
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

        return ToModel(db.Users
            .AsNoTracking()
            .FirstOrDefault(u => u.Email == Normalize(email) && u.IsActive));
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

    public IReadOnlyList<UserSummary> List() =>
        db.Users
            .AsNoTracking()
            .OrderBy(u => u.DisplayName)
            .ThenBy(u => u.Email)
            .AsEnumerable()
            .Select(ToSummary)
            .ToList();

    public UserSummary? GetSummary(string id)
    {
        var row = db.Users.AsNoTracking().FirstOrDefault(u => u.Id == id);
        return row is null ? null : ToSummary(row);
    }

    public bool EmailExists(string email) =>
        db.Users.Any(u => u.Email == Normalize(email));

    public int CountActiveAdmins() =>
        db.Users.Count(u => u.IsActive && u.Role == UserRole.Admin);

    public UserSummary Create(string email, string displayName, string role, string password)
    {
        var row = new UserRow
        {
            // Derivado del correo, igual que en el comando crear-usuario.
            Id = UserIdentity.ForEmail(email),
            Email = Normalize(email),
            DisplayName = displayName.Trim(),
            Role = role,
            PasswordHash = PasswordHasher.Hash(password),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Users.Add(row);
        db.SaveChanges();

        return ToSummary(row);
    }

    public UserSummary? Update(string id, string? displayName, string? role, bool? isActive)
    {
        var row = db.Users.FirstOrDefault(u => u.Id == id);
        if (row is null) return null;

        if (displayName is not null) row.DisplayName = displayName.Trim();
        if (role is not null) row.Role = role;
        if (isActive is not null) row.IsActive = isActive.Value;

        db.SaveChanges();
        return ToSummary(row);
    }

    public bool SetPassword(string id, string newPassword)
    {
        var row = db.Users.FirstOrDefault(u => u.Id == id);
        if (row is null) return false;

        row.PasswordHash = PasswordHasher.Hash(newPassword);
        row.PasswordResetRequestedAt = null;
        db.SaveChanges();
        return true;
    }

    public string? SetAvatar(string id, string avatarUrl)
    {
        var row = db.Users.FirstOrDefault(u => u.Id == id);
        if (row is null) return null;

        var previous = row.AvatarUrl;
        row.AvatarUrl = avatarUrl;
        db.SaveChanges();
        return previous;
    }

    public UserSummary? RequestPasswordReset(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;

        var row = db.Users.FirstOrDefault(u => u.Email == Normalize(email) && u.IsActive);

        // Si ya habia una pendiente se conserva la fecha original: pulsar el
        // boton varias veces no debe hacerla parecer mas reciente. Tampoco se
        // vuelve a avisar a los administradores.
        if (row is null || row.PasswordResetRequestedAt is not null) return null;

        row.PasswordResetRequestedAt = DateTimeOffset.UtcNow;
        db.SaveChanges();
        return ToSummary(row);
    }

    public UserSummary? DismissPasswordReset(string id)
    {
        var row = db.Users.FirstOrDefault(u => u.Id == id);
        if (row is null) return null;

        row.PasswordResetRequestedAt = null;
        db.SaveChanges();
        return ToSummary(row);
    }

    /// <summary>
    /// El correo se guarda siempre en minusculas, asi que basta normalizar lo que
    /// llega. Hacerlo aqui y no en SQL deja que se use el indice.
    /// </summary>
    private static string Normalize(string email) => email.Trim().ToLowerInvariant();

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
        AvatarUrl = row.AvatarUrl,
    };

    private static UserSummary ToSummary(UserRow row) =>
        new(row.Id, row.Email, row.DisplayName, row.AvatarUrl, row.Role,
            row.IsActive, row.CreatedAt, row.PasswordResetRequestedAt);
}
