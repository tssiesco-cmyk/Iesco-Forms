namespace IescoForms.Api.Models;

/// <summary>
/// Todo lo que puede acabar en la campana.
///
/// Los de arriba hablan de un formulario y llevan su id; los de abajo son de la
/// cuenta o de la gestion de usuarios y no tienen formulario ninguno, asi que
/// viajan con <c>FormId</c> en null y el <c>Subject</c> dice de quien tratan.
///
/// Cada tipo nuevo hay que anadirlo tambien al CHECK de la tabla (ver
/// Database/09_avisos_generales.sql) y darle texto en el panel del frontend.
/// </summary>
public static class NotificationType
{
    // --- Sobre un formulario ---

    /// <summary>Alguien respondio un formulario tuyo.</summary>
    public const string NewResponses = "new_responses";

    /// <summary>Se creo el formulario, en blanco o desde una plantilla.</summary>
    public const string FormCreated = "form_created";

    /// <summary>Se publico: pasa a aceptar respuestas.</summary>
    public const string FormPublished = "form_published";

    /// <summary>Se volvio a borrador: deja de aceptar respuestas.</summary>
    public const string FormUnpublished = "form_unpublished";

    /// <summary>Se edito el contenido (titulo, preguntas, opciones, campos).</summary>
    public const string FormUpdated = "form_updated";

    public const string FormTrashed = "form_trashed";
    public const string FormRestored = "form_restored";

    /// <summary>Alguien compartio un formulario contigo.</summary>
    public const string FormShared = "form_shared";

    /// <summary>Te quitaron de un formulario compartido.</summary>
    public const string FormUnshared = "form_unshared";

    /// <summary>Paso a ser visible para todos los usuarios.</summary>
    public const string FormPublic = "form_public";

    /// <summary>Dejo de ser publico.</summary>
    public const string FormPrivate = "form_private";

    /// <summary>Se creo o se cambio un enlace para responder.</summary>
    public const string FormLink = "form_link";

    /// <summary>
    /// Se borro definitivamente. Es el unico aviso de formulario que se guarda
    /// sin FormId: la fila del formulario ya no existe cuando se registra.
    /// </summary>
    public const string FormDeleted = "form_deleted";

    // --- Sobre tu cuenta ---

    /// <summary>Cambiaste tu nombre o tu foto de perfil.</summary>
    public const string AccountUpdated = "account_updated";

    /// <summary>Cambiaste tu contrasena tu mismo.</summary>
    public const string PasswordChanged = "password_changed";

    /// <summary>Un administrador te restablecio la contrasena.</summary>
    public const string PasswordReset = "password_reset";

    /// <summary>
    /// Se descarto tu solicitud de "Olvide mi contrasena": no va a llegar
    /// ninguna contrasena nueva.
    /// </summary>
    public const string PasswordRequestDismissed = "password_request_dismissed";

    // --- Gestion de usuarios (administradores) ---

    public const string UserCreated = "user_created";
    public const string UserRoleChanged = "user_role_changed";
    public const string UserActivated = "user_activated";
    public const string UserDeactivated = "user_deactivated";

    /// <summary>
    /// Alguien pulso "Olvide mi contrasena". Llega a todos los administradores
    /// activos, que son quienes pueden restablecerla.
    /// </summary>
    public const string PasswordRequested = "password_requested";

    /// <summary>
    /// Tipos cuyo texto en el panel incluye cuantas veces ocurrio. En los demas
    /// el numero no aporta: "publicado" ya lo dice todo.
    /// </summary>
    public static bool ShowsCount(string type) => type is NewResponses or FormUpdated;

    /// <summary>
    /// Los que no hablan de un formulario. Se usa para no exigirles un FormId y
    /// para que el panel no intente llevarte a un formulario que no existe.
    /// </summary>
    public static bool IsAboutForm(string type) => type is not (
        AccountUpdated or PasswordChanged or PasswordReset or PasswordRequestDismissed or
        UserCreated or UserRoleChanged or UserActivated or UserDeactivated or PasswordRequested);
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

    /// <summary>
    /// El formulario del que habla, o null si el aviso no es de un formulario
    /// (los de cuenta y usuarios) o si ya se borro (<see cref="NotificationType.FormDeleted"/>).
    /// </summary>
    public string? FormId { get; set; }

    /// <summary>
    /// De que trata el aviso, en texto: el titulo del formulario, o el nombre de
    /// la persona afectada en los de usuarios.
    ///
    /// Se guarda el texto del momento: si luego se renombra el formulario, el
    /// aviso sigue diciendo lo que el usuario vio entonces.
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// Quien lo hizo. Null si fue alguien sin sesion (una respuesta por enlace)
    /// o en avisos anteriores a guardar el autor.
    /// </summary>
    public string? ActorId { get; set; }

    /// <summary>Nombre actual de quien lo hizo. Se resuelve al leer, no se guarda.</summary>
    public string? ActorName { get; set; }

    /// <summary>Cuantos eventos se han agrupado en este aviso.</summary>
    public int Count { get; set; } = 1;

    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Cuando llego el ultimo evento agrupado. Ordena la lista.</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }
}
