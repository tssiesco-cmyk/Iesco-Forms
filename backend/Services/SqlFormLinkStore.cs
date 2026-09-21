using System.Security.Cryptography;
using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

public class SqlFormLinkStore(IescoFormsDbContext db) : IFormLinkStore
{
    public IReadOnlyList<FormLink> List(string formId) =>
        db.FormLinks
            .AsNoTracking()
            .Where(l => l.FormId == formId)
            .OrderByDescending(l => l.ExpiresAt)
            .AsEnumerable()
            .Select(ToModel)
            .ToList();

    public FormLink Create(string formId, DateTimeOffset expiresAt, string createdBy)
    {
        var row = new FormLinkRow
        {
            Id = Guid.NewGuid().ToString("N")[..12],
            FormId = formId,
            Token = NewToken(),
            ExpiresAt = expiresAt,
            CreatedBy = createdBy,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.FormLinks.Add(row);
        db.SaveChanges();
        return ToModel(row);
    }

    public FormLink? UpdateExpiry(string formId, string linkId, DateTimeOffset expiresAt)
    {
        var row = db.FormLinks.FirstOrDefault(l => l.Id == linkId && l.FormId == formId);
        if (row is null) return null;

        row.ExpiresAt = expiresAt;
        db.SaveChanges();
        return ToModel(row);
    }

    public bool Delete(string formId, string linkId) =>
        db.FormLinks.Where(l => l.Id == linkId && l.FormId == formId).ExecuteDelete() > 0;

    public (FormLink Link, string FormId)? FindByToken(string token)
    {
        var row = db.FormLinks.AsNoTracking().FirstOrDefault(l => l.Token == token);
        return row is null ? null : (ToModel(row), row.FormId);
    }

    /// <summary>
    /// 16 bytes aleatorios en base64 apto para URL: 22 caracteres. Imposible de
    /// adivinar, que es lo que protege a un enlace que no pide sesion.
    /// </summary>
    private static string NewToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(16))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

    private static FormLink ToModel(FormLinkRow row) =>
        new(row.Id, row.Token, row.ExpiresAt, row.CreatedAt);
}
