using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Con quien esta compartido cada formulario. Va aparte de IFormStore porque es
/// otra responsabilidad: aquel guarda el contenido, este decide quien mas lo ve.
/// </summary>
public interface IFormShareStore
{
    /// <summary>Permiso (edit/view) de un usuario sobre un formulario, o null.</summary>
    string? GetPermission(string formId, string userId);

    /// <summary>Todos los formularios compartidos con un usuario: formId -> permiso.</summary>
    IReadOnlyDictionary<string, string> GetPermissionsForUser(string userId);

    /// <summary>Personas con las que esta compartido, con su nombre y correo.</summary>
    IReadOnlyList<FormShare> GetShares(string formId);

    /// <summary>
    /// Comparte para editar. Devuelve true si es la primera vez que se comparte
    /// con esa persona (para avisarle solo entonces).
    /// </summary>
    bool Add(string formId, string userId, string sharedBy);

    bool Remove(string formId, string userId);

    /// <summary>Marca o desmarca el formulario como publico. False si no existe.</summary>
    bool SetPublic(string formId, bool isPublic);

    /// <summary>Nombres para mostrar de varios usuarios a la vez: id -> nombre.</summary>
    IReadOnlyDictionary<string, string> GetDisplayNames(IEnumerable<string> userIds);
}
