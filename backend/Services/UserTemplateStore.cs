using System.Text.Json;
using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>
/// Plantillas que guardan los usuarios. Las ve todo el equipo; solo su autor o
/// un administrador las borra. Las del catalogo no pasan por aqui (SeedData).
/// </summary>
public interface IUserTemplateStore
{
    IReadOnlyList<Template> List();
    Template? Find(string id);
    Template Add(Template template, string ownerId);
    bool Delete(string id);
}

public class SqlUserTemplateStore(IescoFormsDbContext db) : IUserTemplateStore
{
    /// <summary>Todas llevan esta categoria, para separarlas en la pantalla de plantillas.</summary>
    public const string Category = "Del equipo";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public IReadOnlyList<Template> List()
    {
        var filas = db.UserTemplates.AsNoTracking().OrderByDescending(t => t.CreatedAt).ToList();
        var nombres = Nombres(filas.Select(f => f.OwnerId));

        return [.. filas.Select(f => ToModel(f, nombres))];
    }

    public Template? Find(string id)
    {
        var fila = db.UserTemplates.AsNoTracking().FirstOrDefault(t => t.Id == id);
        return fila is null ? null : ToModel(fila, Nombres([fila.OwnerId]));
    }

    public Template Add(Template template, string ownerId)
    {
        var fila = new UserTemplateRow
        {
            // Prefijo propio: los ids del catalogo son legibles ("satisfaccion")
            // y asi no pueden chocar nunca con uno de usuario.
            Id = "u-" + Guid.NewGuid().ToString("N")[..10],
            OwnerId = string.IsNullOrEmpty(ownerId) ? null : ownerId,
            Name = template.Name,
            Description = template.Description,
            Content = JsonSerializer.Serialize(template, Json),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.UserTemplates.Add(fila);
        db.SaveChanges();

        return ToModel(fila, Nombres([fila.OwnerId]));
    }

    public bool Delete(string id) => db.UserTemplates.Where(t => t.Id == id).ExecuteDelete() > 0;

    private Dictionary<string, string> Nombres(IEnumerable<string?> ids)
    {
        var lista = ids.Where(id => id is not null).Select(id => id!).Distinct().ToList();
        return db.Users.AsNoTracking()
            .Where(u => lista.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.DisplayName);
    }

    /// <summary>
    /// El contenido sale del JSON; lo que es de la fila (id, nombre, autor,
    /// fecha) manda sobre lo que hubiera dentro.
    /// </summary>
    private static Template ToModel(UserTemplateRow fila, Dictionary<string, string> nombres)
    {
        var plantilla = JsonSerializer.Deserialize<Template>(fila.Content, Json) ?? new Template();

        plantilla.Id = fila.Id;
        plantilla.Name = fila.Name;
        plantilla.Description = fila.Description;
        plantilla.Category = Category;
        plantilla.IsCustom = true;
        plantilla.OwnerId = fila.OwnerId;
        plantilla.OwnerName = fila.OwnerId is null ? null : nombres.GetValueOrDefault(fila.OwnerId);
        plantilla.CreatedAt = fila.CreatedAt;
        return plantilla;
    }
}
