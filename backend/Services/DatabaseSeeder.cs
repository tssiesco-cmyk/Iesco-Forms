using IescoForms.Api.Data;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Carga en SQL Server lo minimo para que la aplicacion sea usable: el catalogo
/// de plantillas.
///
/// Los usuarios no se siembran: ninguna contrasena vive en el codigo ni en la
/// configuracion. El primer administrador se crea con
/// "dotnet run -- crear-usuario" y los demas desde Configuracion > Usuarios.
///
/// Solo inserta lo que falta, asi que se puede ejecutar en cada arranque.
/// </summary>
public static class DatabaseSeeder
{
    public static void Run(IescoFormsDbContext db, ILogger logger)
    {
        ComprobarAdministrador(db, logger);
        SembrarPlantillas(db, logger);
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
}
