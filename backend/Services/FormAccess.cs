using System.Security.Claims;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Unico sitio que decide que puede hacer el usuario conectado con un
/// formulario. Lo usan los controladores de formularios, respuestas y papelera,
/// para que la regla no quede escrita (y desalineada) en tres lugares.
///
/// - Dueno, formulario sin dueno o Administrador: todo, incluido compartir y borrar.
/// - Compartido con esa persona: editar, publicar y ver resultados.
///
/// Que un formulario sea publico no da ningun nivel: solo lo lista para
/// responderlo, y responder ya estaba abierto a cualquiera con el enlace.
/// (El nivel View queda por compatibilidad con filas antiguas.)
/// </summary>
public class FormAccess(IHttpContextAccessor http, IFormShareStore shares)
{
    private ClaimsPrincipal User => http.HttpContext?.User ?? new ClaimsPrincipal();

    public string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

    public bool IsAdmin => User.IsInRole(UserRole.Admin);

    public FormAccessLevel LevelFor(Form form)
    {
        if (User.Identity?.IsAuthenticated != true) return FormAccessLevel.None;
        if (IsOwnerLevel(form)) return FormAccessLevel.Owner;

        return ToLevel(shares.GetPermission(form.Id, CurrentUserId));
    }

    /// <summary>
    /// Filtra una lista a lo que el usuario puede ver y le pone Access,
    /// SharedPermission y OwnerName. Hace dos consultas en total, no dos por
    /// formulario.
    /// </summary>
    public List<Form> VisibleWithAccess(IEnumerable<Form> forms)
    {
        var mine = shares.GetPermissionsForUser(CurrentUserId);

        var visible = forms
            .Select(form =>
            {
                mine.TryGetValue(form.Id, out var shared);
                var level = IsOwnerLevel(form) ? FormAccessLevel.Owner : ToLevel(shared);
                return (form, level, shared);
            })
            .Where(x => x.level != FormAccessLevel.None)
            .ToList();

        var names = shares.GetDisplayNames(visible.Select(x => x.form.OwnerId));

        foreach (var (form, level, shared) in visible)
        {
            form.Access = ToText(level);
            form.SharedPermission = shared;
            form.OwnerName = names.GetValueOrDefault(form.OwnerId);
        }

        return [.. visible.Select(x => x.form)];
    }

    /// <summary>Solo el nombre del dueno, para listados donde no hay acceso que calcular.</summary>
    public List<Form> WithOwnerNames(List<Form> forms)
    {
        var names = shares.GetDisplayNames(forms.Select(f => f.OwnerId));
        foreach (var form in forms) form.OwnerName = names.GetValueOrDefault(form.OwnerId);
        return forms;
    }

    /// <summary>Pone Access en un formulario suelto (el que devuelven las ediciones).</summary>
    public Form WithAccess(Form form)
    {
        var level = LevelFor(form);
        form.Access = ToText(level);
        // Igual que en la lista: aunque un administrador llegue al nivel de dueno,
        // si se lo compartieron explicitamente cuenta como compartido.
        form.SharedPermission = shares.GetPermission(form.Id, CurrentUserId);
        form.OwnerName = shares.GetDisplayNames([form.OwnerId]).GetValueOrDefault(form.OwnerId);
        return form;
    }

    private bool IsOwnerLevel(Form form) =>
        IsAdmin || string.IsNullOrEmpty(form.OwnerId) || form.OwnerId == CurrentUserId;

    private static FormAccessLevel ToLevel(string? permission) => permission switch
    {
        SharePermission.Edit => FormAccessLevel.Edit,
        SharePermission.View => FormAccessLevel.View,
        _ => FormAccessLevel.None,
    };

    private static string? ToText(FormAccessLevel level) => level switch
    {
        FormAccessLevel.Owner => "owner",
        FormAccessLevel.Edit => SharePermission.Edit,
        FormAccessLevel.View => SharePermission.View,
        _ => null,
    };
}
