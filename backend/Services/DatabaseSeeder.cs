using IescoForms.Api.Data;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Carga en SQL Server lo minimo para que la aplicacion sea usable: los usuarios
/// de la seccion "SeedUsers" de appsettings.
///
/// Solo inserta lo que falta. Nunca pisa una fila existente, porque hacerlo
/// devolveria la contrasena del archivo a alguien que ya se la habia cambiado.
/// Por eso se puede ejecutar en cada arranque sin pensarlo.
/// </summary>
public static class DatabaseSeeder
{
    public static void Run(IescoFormsDbContext db, IConfiguration configuration, ILogger logger)
    {
        SembrarUsuarios(db, configuration, logger);
        SembrarPlantillas(db, logger);
    }

    /// <summary>
    /// Las plantillas son solo lectura para la aplicacion, asi que viven en la
    /// base como catalogo fijo. Se reutilizan las mismas de <see cref="SeedData"/>
    /// para no tener la lista escrita en dos sitios.
    /// </summary>
    private static void SembrarPlantillas(IescoFormsDbContext db, ILogger logger)
    {
        var plantillas = SeedData.CreateTemplates();
        var creadas = 0;

        foreach (var plantilla in plantillas)
        {
            if (db.Templates.Any(t => t.Id == plantilla.Id)) continue;

            var fila = new TemplateRow
            {
                Id = plantilla.Id,
                Name = plantilla.Name,
                Description = plantilla.Description,
                Category = plantilla.Category,
            };

            var posicion = 0;
            foreach (var pregunta in plantilla.Questions)
            {
                // TemplateQuestion no tiene id en el modelo (era una lista en
                // memoria); en la tabla si hace falta para que las opciones
                // puedan referenciarla.
                var filaPregunta = new TemplateQuestionRow
                {
                    Id = Guid.NewGuid().ToString("N")[..8],
                    TemplateId = fila.Id,
                    Position = posicion++,
                    Type = pregunta.Type,
                    Title = pregunta.Title,
                    Required = pregunta.Required,
                };

                var posicionOpcion = 0;
                foreach (var texto in pregunta.Options)
                {
                    filaPregunta.Options.Add(new TemplateQuestionOptionRow
                    {
                        Id = Guid.NewGuid().ToString("N")[..8],
                        TemplateQuestionId = filaPregunta.Id,
                        Position = posicionOpcion++,
                        Text = texto,
                    });
                }

                fila.Questions.Add(filaPregunta);
            }

            db.Templates.Add(fila);
            creadas++;
        }

        if (creadas > 0)
        {
            db.SaveChanges();
            logger.LogInformation("Plantillas creadas en la base: {Count}.", creadas);
        }
    }

    private static void SembrarUsuarios(IescoFormsDbContext db, IConfiguration configuration, ILogger logger)
    {
        var seeds = configuration.GetSection("SeedUsers").Get<SeedUser[]>() ?? [];

        if (seeds.Length == 0)
        {
            logger.LogError(
                "No hay ningun usuario configurado: nadie podra entrar. " +
                "Define la seccion 'SeedUsers' en appsettings.");
            return;
        }

        var creados = 0;

        foreach (var seed in seeds)
        {
            if (string.IsNullOrWhiteSpace(seed.Email) || string.IsNullOrWhiteSpace(seed.Password))
            {
                logger.LogWarning("Usuario de ejemplo ignorado: falta el correo o la contrasena.");
                continue;
            }

            // Derivado del correo, igual que en el almacen en memoria: asi los
            // formularios que ya referencian a este usuario siguen cuadrando.
            var id = UserIdentity.ForEmail(seed.Email);

            if (db.Users.Any(u => u.Id == id)) continue;

            db.Users.Add(new UserRow
            {
                Id = id,
                Email = seed.Email.Trim().ToLowerInvariant(),
                DisplayName = string.IsNullOrWhiteSpace(seed.DisplayName) ? seed.Email : seed.DisplayName,
                Role = UserRole.IsValid(seed.Role) ? seed.Role! : UserRole.Editor,
                // La contrasena llega en claro desde el archivo y se cifra aqui:
                // en la base nunca queda el texto original.
                PasswordHash = PasswordHasher.Hash(seed.Password),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
            });

            creados++;
        }

        if (creados > 0)
        {
            db.SaveChanges();
            logger.LogInformation("Usuarios creados en la base: {Count}.", creados);
        }
        else
        {
            logger.LogInformation("Los usuarios de configuracion ya estaban en la base.");
        }
    }

    private sealed class SeedUser
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? DisplayName { get; set; }
        public string? Role { get; set; }
    }
}
