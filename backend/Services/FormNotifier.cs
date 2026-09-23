using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Decide a quien llega cada aviso de un formulario.
///
/// Antes se avisaba solo al dueno, asi que quien colaboraba en un formulario
/// compartido no se enteraba de nada: ni de una edicion, ni de una respuesta
/// nueva, ni de que lo habian publicado. Aqui se avisa al dueno y a todas las
/// personas con las que esta compartido, que son exactamente las que lo ven.
///
/// Se avisa tambien a quien hizo el cambio: la campana sirve de registro de
/// actividad. Como los avisos del mismo tipo se agrupan mientras no se lean,
/// teclear un titulo no genera un aviso por pulsacion.
///
/// Esta clase existe para no repetir la consulta de compartidos en cada uno de
/// los controladores que avisan (formularios, respuestas, papelera, enlaces).
///
/// Tambien lleva el historial del formulario: todo lo que avisa queda anotado
/// ahi con quien lo hizo, asi ningun controlador tiene que acordarse de las dos
/// cosas por separado.
/// </summary>
public class FormNotifier(
    INotificationStore notifications,
    IFormShareStore shares,
    IFormActivityStore activity,
    FormAccess access)
{
    /// <summary>Avisa al dueno y a los colaboradores, y lo anota en el historial.</summary>
    public void Notify(Form form, string type) => Notify(form, type, except: null);

    /// <param name="except">
    /// Alguien a quien no avisar de este cambio. Se usa al compartir: a esa
    /// persona le toca su propio aviso ("compartido contigo"), no el del resto
    /// del equipo.
    /// </param>
    /// <param name="log">
    /// False cuando quien llama anota el historial por su cuenta con mas
    /// detalle (por ejemplo, a quien se compartio).
    /// </param>
    public void Notify(Form form, string type, string? except, bool log = true)
    {
        foreach (var userId in Recipients(form))
        {
            if (userId == except) continue;
            notifications.Record(userId, type, form.Id, form.Title, access.CurrentUserId);
        }

        if (log) Log(form, type);
    }

    /// <summary>
    /// Solo el historial, sin aviso. Para lo que interesa consultar despues pero
    /// no merece una notificacion (borrar una respuesta, cambiar el cierre).
    /// </summary>
    public void Log(Form form, string action, string detail = "") =>
        activity.Record(form.Id, access.CurrentUserId, action, detail);

    /// <summary>Un aviso sobre el formulario dirigido a una sola persona.</summary>
    public void NotifyUser(string userId, string type, Form form) =>
        notifications.Record(userId, type, form.Id, form.Title, access.CurrentUserId);

    /// <summary>
    /// Quienes ven el formulario: el dueno y los compartidos, sin repetidos.
    ///
    /// Se expone porque al borrar definitivamente hay que quedarse con la lista
    /// ANTES del borrado: al irse el formulario se van tambien sus compartidos,
    /// y despues ya no habria a quien avisar.
    /// </summary>
    public IReadOnlyList<string> Recipients(Form form)
    {
        var destinatarios = new List<string>();

        if (!string.IsNullOrEmpty(form.OwnerId)) destinatarios.Add(form.OwnerId);

        foreach (var compartido in shares.GetShares(form.Id))
        {
            if (!destinatarios.Contains(compartido.UserId)) destinatarios.Add(compartido.UserId);
        }

        return destinatarios;
    }

    /// <summary>
    /// Avisa del borrado definitivo. Va sin id de formulario porque la fila ya
    /// no existe: del formulario solo queda su titulo, dentro del aviso.
    /// </summary>
    public void NotifyDeleted(IEnumerable<string> userIds, string formTitle)
    {
        foreach (var userId in userIds)
        {
            notifications.Record(userId, NotificationType.FormDeleted, formId: null, formTitle, access.CurrentUserId);
        }
    }
}
