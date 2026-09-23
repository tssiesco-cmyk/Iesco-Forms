namespace IescoForms.Api.Models;

/// <summary>
/// Una linea del historial de un formulario: quien hizo que y cuando.
///
/// A diferencia de la campana, que es de cada persona y se vacia al leerla, el
/// historial es del formulario y lo ven todos los que trabajan en el.
///
/// <c>Action</c> reutiliza los tipos de <see cref="NotificationType"/> (editado,
/// publicado, compartido...) y suma los de <see cref="FormActivityAction"/>, que
/// no tienen aviso.
/// </summary>
public class FormActivity
{
    public string Id { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;

    /// <summary>Quien lo hizo. Null si fue alguien sin sesion (una respuesta por enlace).</summary>
    public string? UserId { get; set; }
    public string? UserName { get; set; }

    /// <summary>Dato extra, por ejemplo a quien se compartio. Puede ir vacio.</summary>
    public string Detail { get; set; } = string.Empty;

    /// <summary>
    /// Cuantas veces seguidas lo hizo la misma persona. Sin esto, escribir un
    /// titulo llenaria el historial de "edito el formulario".
    /// </summary>
    public int Count { get; set; } = 1;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>Acciones del historial que no generan aviso en la campana.</summary>
public static class FormActivityAction
{
    public const string ResponseDeleted = "response_deleted";
    public const string SettingsUpdated = "settings_updated";
    public const string SavedAsTemplate = "saved_as_template";
}
