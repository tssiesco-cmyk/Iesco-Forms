using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

public class InMemoryNotificationStore : INotificationStore
{
    private readonly Lock _gate = new();
    private readonly List<Notification> _items = [];

    /// <summary>
    /// Tope por usuario. Sin esto la lista crece sin fin mientras corre el
    /// proceso; nadie mira mas de un centenar de avisos viejos.
    /// </summary>
    private const int MaxPerUser = 100;

    private static string NewId() => Guid.NewGuid().ToString("N")[..8];

    public IReadOnlyList<Notification> GetForUser(string userId, int limit)
    {
        if (string.IsNullOrEmpty(userId)) return [];

        lock (_gate)
        {
            return [.. _items
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.UpdatedAt)
                .Take(Math.Clamp(limit, 1, MaxPerUser))];
        }
    }

    public int CountUnread(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return 0;

        lock (_gate) return _items.Count(n => n.UserId == userId && n.ReadAt is null);
    }

    public bool MarkRead(string userId, string notificationId)
    {
        lock (_gate)
        {
            var item = _items.FirstOrDefault(n => n.Id == notificationId && n.UserId == userId);
            if (item is null) return false;

            item.ReadAt ??= DateTimeOffset.UtcNow;
            return true;
        }
    }

    public int MarkAllRead(string userId)
    {
        lock (_gate)
        {
            var pending = _items.Where(n => n.UserId == userId && n.ReadAt is null).ToList();
            var now = DateTimeOffset.UtcNow;

            foreach (var item in pending) item.ReadAt = now;
            return pending.Count;
        }
    }

    public void Record(string userId, string type, string? formId, string subject, string? actorId)
    {
        // Un formulario sin dueno no avisa a nadie.
        if (string.IsNullOrEmpty(userId)) return;

        // Cadena vacia y null son lo mismo: "no va de un formulario".
        if (string.IsNullOrEmpty(formId)) formId = null;
        if (string.IsNullOrEmpty(actorId)) actorId = null;

        lock (_gate)
        {
            var existing = _items.FirstOrDefault(n =>
                n.UserId == userId &&
                n.FormId == formId &&
                n.Type == type &&
                n.ActorId == actorId &&
                // Sin formulario, el asunto distingue a quien o a que se refiere.
                (formId is not null || n.Subject == subject) &&
                n.ReadAt is null);

            if (existing is not null)
            {
                // Se agrupa mientras siga sin leer. Una vez leido, el siguiente
                // evento abre un aviso nuevo en vez de resucitar el viejo.
                existing.Count += 1;
                existing.UpdatedAt = DateTimeOffset.UtcNow;
                existing.Subject = subject;
                return;
            }

            var now = DateTimeOffset.UtcNow;
            _items.Add(new Notification
            {
                Id = NewId(),
                UserId = userId,
                Type = type,
                FormId = formId,
                Subject = subject,
                ActorId = actorId,
                Count = 1,
                CreatedAt = now,
                UpdatedAt = now,
            });

            TrimUser(userId);
        }
    }

    public void RemoveForForms(IEnumerable<string> formIds)
    {
        var ids = formIds.ToHashSet();
        if (ids.Count == 0) return;

        // Los avisos sin formulario (cuenta, usuarios) no pertenecen a ninguno
        // de los que se borran, asi que se quedan.
        lock (_gate) _items.RemoveAll(n => n.FormId is not null && ids.Contains(n.FormId));
    }

    /// <summary>Deja solo los mas recientes. Siempre se llama dentro del lock.</summary>
    private void TrimUser(string userId)
    {
        var mine = _items.Where(n => n.UserId == userId).ToList();
        if (mine.Count <= MaxPerUser) return;

        foreach (var old in mine.OrderByDescending(n => n.UpdatedAt).Skip(MaxPerUser))
        {
            _items.Remove(old);
        }
    }
}
