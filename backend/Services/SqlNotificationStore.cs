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

        return [.. db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.UpdatedAt)
            .Take(limit)
            .ToList()
            .Select(ToModel)];
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

    public void Record(string userId, string type, string formId, string formTitle)
    {
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(formId)) return;

        // El aviso referencia al formulario con clave foranea: si ya no existe,
        // no hay nada que anunciar.
        if (!db.Forms.Any(f => f.Id == formId)) return;

        var ahora = DateTimeOffset.UtcNow;

        var existente = db.Notifications.FirstOrDefault(n =>
            n.UserId == userId && n.FormId == formId && n.Type == type && n.ReadAt == null);

        if (existente is not null)
        {
            existente.Count++;
            existente.UpdatedAt = ahora;
            // Se refresca el titulo: si lo renombraron, el aviso sin leer que la
            // persona todavia no vio debe mostrar el nombre actual.
            existente.FormTitle = formTitle;
        }
        else
        {
            db.Notifications.Add(new NotificationRow
            {
                Id = NewId(),
                UserId = userId,
                Type = type,
                FormId = formId,
                FormTitle = formTitle,
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
        db.Notifications.Where(n => ids.Contains(n.FormId)).ExecuteDelete();
    }

    private static Notification ToModel(NotificationRow fila) => new()
    {
        Id = fila.Id,
        UserId = fila.UserId,
        Type = fila.Type,
        FormId = fila.FormId,
        FormTitle = fila.FormTitle,
        Count = fila.Count,
        CreatedAt = fila.CreatedAt,
        UpdatedAt = fila.UpdatedAt,
        ReadAt = fila.ReadAt,
    };
}
