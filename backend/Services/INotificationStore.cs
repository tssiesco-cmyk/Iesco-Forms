using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

public interface INotificationStore
{
    /// <summary>Avisos de un usuario, del mas reciente al mas antiguo.</summary>
    IReadOnlyList<Notification> GetForUser(string userId, int limit);

    /// <summary>Solo el numero. La campana lo pide seguido y no necesita la lista.</summary>
    int CountUnread(string userId);

    bool MarkRead(string userId, string notificationId);

    /// <summary>Devuelve cuantos avisos se marcaron.</summary>
    int MarkAllRead(string userId);

    /// <summary>
    /// Registra un evento. Si el usuario ya tiene un aviso sin leer del mismo
    /// tipo, formulario y autor, suma; si no, crea uno nuevo. El autor entra en
    /// la agrupacion para que cada aviso tenga un solo nombre: si editan Juan y
    /// Ana, llegan dos avisos, uno de cada uno.
    /// </summary>
    /// <param name="actorId">
    /// Quien lo hizo. Null si fue alguien sin sesion (una respuesta por enlace)
    /// o si no aplica.
    /// </param>
    /// <param name="formId">
    /// Null en los avisos que no son de un formulario (cuenta y usuarios) y en
    /// el de borrado definitivo, cuyo formulario ya no existe. Esos se agrupan
    /// solo por tipo.
    /// </param>
    /// <param name="subject">
    /// De que trata: el titulo del formulario, o el nombre de la persona
    /// afectada en los avisos de usuarios.
    /// </param>
    void Record(string userId, string type, string? formId, string subject, string? actorId);

    /// <summary>Al borrar un formulario definitivamente, sus avisos sobran.</summary>
    void RemoveForForms(IEnumerable<string> formIds);
}
