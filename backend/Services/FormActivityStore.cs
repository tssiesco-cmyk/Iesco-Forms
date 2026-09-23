using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>El historial de cada formulario. Ver <see cref="FormActivity"/>.</summary>
public interface IFormActivityStore
{
    /// <summary>
    /// Anota una accion. Si la misma persona hizo lo mismo en el mismo
    /// formulario hace poco, suma a esa linea en vez de abrir otra.
    /// </summary>
    void Record(string formId, string? userId, string action, string detail = "");

    /// <summary>Lo mas reciente primero, con el nombre de cada persona.</summary>
    IReadOnlyList<FormActivity> GetForForm(string formId, int limit);
}

public class SqlFormActivityStore(IescoFormsDbContext db) : IFormActivityStore
{
    /// <summary>
    /// Cuanto puede pasar entre dos acciones iguales para que cuenten como una.
    /// Media hora cubre una sesion de edicion sin mezclar dias distintos.
    /// </summary>
    private static readonly TimeSpan Agrupar = TimeSpan.FromMinutes(30);

    public void Record(string formId, string? userId, string action, string detail = "")
    {
        if (string.IsNullOrEmpty(userId)) userId = null;
        detail ??= string.Empty;
        if (detail.Length > 500) detail = detail[..500];

        var ahora = DateTimeOffset.UtcNow;
        var desde = ahora - Agrupar;

        var existente = db.FormActivity
            .Where(a => a.FormId == formId && a.UserId == userId && a.Action == action &&
                        a.Detail == detail && a.UpdatedAt >= desde)
            .OrderByDescending(a => a.UpdatedAt)
            .FirstOrDefault();

        if (existente is not null)
        {
            existente.Count++;
            existente.UpdatedAt = ahora;
        }
        else
        {
            db.FormActivity.Add(new FormActivityRow
            {
                Id = Guid.NewGuid().ToString("N")[..12],
                FormId = formId,
                UserId = userId,
                Action = action,
                Detail = detail,
                Count = 1,
                CreatedAt = ahora,
                UpdatedAt = ahora,
            });
        }

        db.SaveChanges();
    }

    public IReadOnlyList<FormActivity> GetForForm(string formId, int limit)
    {
        var filas = db.FormActivity
            .AsNoTracking()
            .Where(a => a.FormId == formId)
            .OrderByDescending(a => a.UpdatedAt)
            .Take(limit)
            .ToList();

        var ids = filas.Where(a => a.UserId != null).Select(a => a.UserId!).Distinct().ToList();
        var nombres = db.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.DisplayName);

        return [.. filas.Select(a => new FormActivity
        {
            Id = a.Id,
            Action = a.Action,
            UserId = a.UserId,
            UserName = a.UserId is null ? null : nombres.GetValueOrDefault(a.UserId),
            Detail = a.Detail,
            Count = a.Count,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
        })];
    }
}
