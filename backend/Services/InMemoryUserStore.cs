using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Usuarios en memoria, sembrados desde la configuracion al arrancar.
/// Como los formularios, se pierden al reiniciar.
/// </summary>
public class InMemoryUserStore : IUserStore
{
    private readonly Lock _gate = new();
    private readonly List<User> _users = [];
    private readonly ILogger<InMemoryUserStore> _logger;

    public InMemoryUserStore(IConfiguration configuration, ILogger<InMemoryUserStore> logger)
    {
        _logger = logger;
        SeedFromConfiguration(configuration);
    }

    /// <summary>
    /// Lee la seccion "SeedUsers" de appsettings. Las contrasenas llegan en claro
    /// y se cifran aqui mismo: en la lista nunca queda el texto original.
    /// </summary>
    private void SeedFromConfiguration(IConfiguration configuration)
    {
        var seeds = configuration.GetSection("SeedUsers").Get<SeedUser[]>() ?? [];

        foreach (var seed in seeds)
        {
            if (string.IsNullOrWhiteSpace(seed.Email) || string.IsNullOrWhiteSpace(seed.Password))
            {
                _logger.LogWarning("Usuario de ejemplo ignorado: falta el correo o la contrasena.");
                continue;
            }

            _users.Add(new User
            {
                // Derivado del correo: el mismo en cada arranque, asi la sesion
                // sobrevive a un reinicio y los formularios pueden referenciarlo.
                Id = UserIdentity.ForEmail(seed.Email),
                Email = seed.Email.Trim().ToLowerInvariant(),
                DisplayName = string.IsNullOrWhiteSpace(seed.DisplayName) ? seed.Email : seed.DisplayName,
                Role = UserRole.IsValid(seed.Role) ? seed.Role! : UserRole.Editor,
                PasswordHash = PasswordHasher.Hash(seed.Password),
            });
        }

        if (_users.Count == 0)
        {
            _logger.LogError(
                "No hay ningun usuario configurado: nadie podra entrar. " +
                "Define la seccion 'SeedUsers' en appsettings.");
        }
        else
        {
            _logger.LogInformation("Usuarios cargados: {Count}.", _users.Count);
        }
    }

    public User? FindByEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var normalized = email.Trim().ToLowerInvariant();

        lock (_gate) return _users.FirstOrDefault(u => u.Email == normalized);
    }

    public User? FindById(string id)
    {
        lock (_gate) return _users.FirstOrDefault(u => u.Id == id);
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

    private sealed class SeedUser
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? DisplayName { get; set; }
        public string? Role { get; set; }
    }
}
