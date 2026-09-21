using IescoForms.Api.Data;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Comprobaciones de arranque contra la base.
///
/// Las plantillas no se siembran: viven en <see cref="SeedData.Templates"/> y la
/// aplicacion las lee de ahi, asi que no hay nada que copiar ni que mantener
/// sincronizado.
///
/// Los usuarios tampoco: ninguna contrasena vive en el codigo ni en la
/// configuracion. El primer administrador se crea con
/// "dotnet run -- crear-usuario" y los demas desde Configuracion > Usuarios.
/// </summary>
public static class DatabaseSeeder
{
    public static void Run(IescoFormsDbContext db, ILogger logger)
    {
        ComprobarAdministrador(db, logger);
    }

    /// <summary>
    /// Sin un administrador activo nadie puede crear usuarios desde la
    /// aplicacion. No se arregla solo: se avisa de como hacerlo.
    /// </summary>
    private static void ComprobarAdministrador(IescoFormsDbContext db, ILogger logger)
    {
        if (db.Users.Any(u => u.IsActive && u.Role == UserRole.Admin)) return;

        logger.LogError(
            "No hay ningun administrador activo en la base: nadie podra gestionar usuarios. " +
            "Crea uno con 'dotnet run -- crear-usuario' y ejecuta el INSERT que genera.");
    }
}
