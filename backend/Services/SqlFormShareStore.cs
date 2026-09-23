using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

public class SqlFormShareStore(IescoFormsDbContext db) : IFormShareStore
{
    public string? GetPermission(string formId, string userId) =>
        db.FormShares
            .AsNoTracking()
            .Where(s => s.FormId == formId && s.UserId == userId)
            .Select(s => s.Permission)
            .FirstOrDefault();

    public IReadOnlyDictionary<string, string> GetPermissionsForUser(string userId) =>
        db.FormShares
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .ToDictionary(s => s.FormId, s => s.Permission);

    public IReadOnlyList<FormShare> GetShares(string formId) =>
        (from s in db.FormShares.AsNoTracking()
         join u in db.Users.AsNoTracking() on s.UserId equals u.Id
         where s.FormId == formId
         orderby u.DisplayName
         select new FormShare(u.Id, u.Email, u.DisplayName, u.AvatarUrl, s.Permission, s.SharedAt))
        .ToList();

    public bool Add(string formId, string userId, string sharedBy)
    {
        if (db.FormShares.Any(s => s.FormId == formId && s.UserId == userId)) return false;

        db.FormShares.Add(new FormShareRow
        {
            FormId = formId,
            UserId = userId,
            Permission = SharePermission.Edit,
            SharedBy = sharedBy,
            SharedAt = DateTimeOffset.UtcNow,
        });
        db.SaveChanges();
        return true;
    }

    public bool SetPublic(string formId, bool isPublic) =>
        db.Forms.Where(f => f.Id == formId).ExecuteUpdate(u => u.SetProperty(f => f.IsPublic, isPublic)) > 0;

    public bool Remove(string formId, string userId) =>
        db.FormShares.Where(s => s.FormId == formId && s.UserId == userId).ExecuteDelete() > 0;

    public IReadOnlyDictionary<string, string> GetDisplayNames(IEnumerable<string> userIds)
    {
        var ids = userIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<string, string>();

        return db.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.DisplayName);
    }
}
