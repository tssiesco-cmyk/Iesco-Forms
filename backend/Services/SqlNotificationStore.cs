using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>
/// Avisos en SQL Server. Reemplaza a <see cref="InMemoryNotificationStore"/>.
///
/// Mantiene la agrupacion del original: mientras un aviso siga sin leer, otro
/// evento del mismo tipo sobre el mismo formulario le suma en vez de crear uno
/// nuevo. Sin eso, escribir un titulo generaria un aviso por cada pausa al
/// teclear, y un formulario con 200 respuestas daria 200 avisos.
/// </summary>
public class SqlNotificationStore(IescoFormsDbContext db) : INotificationStore
{
    private static string NewId() => Guid.NewGuid().ToString("N")[..8];

    public IReadOnlyList<Notification> GetForUser(string userId, int limit)
    {
        if (string.IsNullOrEmpty(userId)) return [];

        var filas = db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.UpdatedAt)
            .Take(limit)
            .ToList();

        // El nombre se busca al leer y no se guarda en el aviso: si alguien
        // cambia su nombre, sus avisos lo muestran ya cambiado.
        var actorIds = filas.Where(n => n.ActorId != null).Select(n => n.ActorId!).Distinct().ToList();
        var nombres = db.Users
            .AsNoTracking()
            .Where(u => actorIds.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.DisplayName);

        return [.. filas.Select(fila =>
        {
            var aviso = ToModel(fila);
            aviso.ActorName = fila.ActorId is null ? null : nombres.GetValueOrDefault(fila.ActorId);
            return aviso;
        })];
    }

    public int CountUnread(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return 0;

        return db.Notifications.Count(n => n.UserId == userId && n.ReadAt == null);
    }

    public bool MarkRead(string userId, string notificationId)
    {
        var fila = db.Notifications
            .FirstOrDefault(n => n.Id == notificationId && n.UserId == userId && n.ReadAt == null);

        if (fila is null) return false;

        fila.ReadAt = DateTimeOffset.UtcNow;
        db.SaveChanges();
        return true;
    }

    public int MarkAllRead(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return 0;

        // ExecuteUpdate lo resuelve en un solo UPDATE, sin traerse las filas.
        return db.Notifications
            .Where(n => n.UserId == userId && n.ReadAt == null)
            .ExecuteUpdate(s => s.SetProperty(n => n.ReadAt, DateTimeOffset.UtcNow));
    }

    public void Record(string userId, string type, string? formId, string subject, string? actorId)
    {
        if (string.IsNullOrEmpty(userId)) return;

        // Cadena vacia y null son lo mismo aqui: "este aviso no va de un
        // formulario". La columna admite null, que es lo que entiende la clave
        // foranea; una cadena vacia la romperia.
        if (string.IsNullOrEmpty(formId)) formId = null;
        if (string.IsNullOrEmpty(actorId)) actorId = null;

        // El aviso referencia al formulario con clave foranea: si ya no existe,
        // no hay nada que anunciar. Los que van sin formulario se saltan esto.
        if (formId is not null && !db.Forms.Any(f => f.Id == formId)) return;

        var ahora = DateTimeOffset.UtcNow;

        // Se agrupa tambien por autor, para que cada aviso tenga un solo nombre.
        // Los que no llevan formulario se agrupan ademas por asunto: sin el
        // asunto, crear los usuarios A y B dejaria un solo aviso que dice "B",
        // y borrar varios formularios, uno solo con el titulo del ultimo.
        // Comparar FormId == null en LINQ se traduce a "IS NULL", pero
        // escribirlo aparte lo deja claro.
        var existente = formId is null
            ? db.Notifications.FirstOrDefault(n =>
                n.UserId == userId && n.FormId == null && n.Type == type &&
                n.ActorId == actorId && n.Subject == subject && n.ReadAt == null)
            : db.Notifications.FirstOrDefault(n =>
                n.UserId == userId && n.FormId == formId && n.Type == type &&
                n.ActorId == actorId && n.ReadAt == null);

        if (existente is not null)
        {
            existente.Count++;
            existente.UpdatedAt = ahora;
            // Se refresca el texto: si lo renombraron, el aviso sin leer que la
            // persona todavia no vio debe mostrar el nombre actual.
            existente.Subject = subject;
        }
        else
        {
            db.Notifications.Add(new NotificationRow
            {
                Id = NewId(),
                UserId = userId,
                Type = type,
                FormId = formId,
                Subject = subject,
                ActorId = actorId,
                Count = 1,
                CreatedAt = ahora,
                UpdatedAt = ahora,
            });
        }

        db.SaveChanges();
    }

    public void RemoveForForms(IEnumerable<string> formIds)
    {
        var ids = formIds.ToList();
        if (ids.Count == 0) return;

        // Normalmente ya no queda ninguno: al borrar un formulario de verdad,
        // SqlFormStore limpia sus avisos en la misma transaccion porque la clave
        // foranea se lo exige. Esto queda como red por si llega por otro camino.
        // Los avisos sin formulario (cuenta, usuarios, borrado definitivo) no
        // los toca: no pertenecen a ningun formulario que se este borrando.
        db.Notifications.Where(n => n.FormId != null && ids.Contains(n.FormId)).ExecuteDelete();
    }

    private static Notification ToModel(NotificationRow fila) => new()
    {
        Id = fila.Id,
        UserId = fila.UserId,
        Type = fila.Type,
        FormId = fila.FormId,
        Subject = fila.Subject,
        ActorId = fila.ActorId,
        Count = fila.Count,
        CreatedAt = fila.CreatedAt,
        UpdatedAt = fila.UpdatedAt,
        ReadAt = fila.ReadAt,
    };
}
