namespace IescoForms.Api.Models;

public static class NotificationType
{
    /// <summary>Alguien respondio un formulario tuyo.</summary>
    public const string NewResponses = "new_responses";

    /// <summary>Se publico: pasa a aceptar respuestas.</summary>
    public const string FormPublished = "form_published";

    /// <summary>Se volvio a borrador: deja de aceptar respuestas.</summary>
    public const string FormUnpublished = "form_unpublished";

    /// <summary>Se edito el contenido (titulo, preguntas, opciones, campos).</summary>
    public const string FormUpdated = "form_updated";

    public const string FormTrashed = "form_trashed";
    public const string FormRestored = "form_restored";

    /// <summary>
    /// Tipos cuyo texto en el panel incluye cuantas veces ocurrio. En los demas
    /// el numero no aporta: "publicado" ya lo dice todo.
    /// </summary>
    public static bool ShowsCount(string type) => type is NewResponses or FormUpdated;
}

/// <summary>
/// Un aviso dirigido a un usuario.
///
/// Los eventos repetidos se agrupan: mientras el aviso siga sin leer, otro
/// evento del mismo tipo sobre el mismo formulario suma en vez de crear uno
/// nuevo. Sin esto, escribir un titulo generaria un aviso por cada pausa al
/// teclear, y un formulario con 200 respuestas daria 200 avisos.
/// </summary>
public class Notification
{
    public string Id { get; set; } = string.Empty;

    /// <summary>A quien va dirigido.</summary>
    public string UserId { get; set; } = string.Empty;

    public string Type { get; set; } = NotificationType.NewResponses;

    public string FormId { get; set; } = string.Empty;

    /// <summary>
    /// Se guarda el titulo del momento: si luego se renombra el formulario, el
    /// aviso sigue diciendo lo que el usuario vio entonces.
    /// </summary>
    public string FormTitle { get; set; } = string.Empty;

    /// <summary>Cuantos eventos se han agrupado en este aviso.</summary>
    public int Count { get; set; } = 1;

    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Cuando llego el ultimo evento agrupado. Ordena la lista.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }
}
