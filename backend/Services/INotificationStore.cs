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
    /// tipo y formulario, suma; si no, crea uno nuevo.
    /// </summary>
    void Record(string userId, string type, string formId, string formTitle);

    /// <summary>Al borrar un formulario definitivamente, sus avisos sobran.</summary>
    void RemoveForForms(IEnumerable<string> formIds);
}
