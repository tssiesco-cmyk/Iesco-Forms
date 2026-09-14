using System.Security.Claims;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController(INotificationStore store) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

    [HttpGet]
    public ActionResult<IReadOnlyList<Notification>> GetAll([FromQuery] int limit = 20) =>
        Ok(store.GetForUser(UserId, limit));

    /// <summary>
    /// Solo el numero de avisos sin leer. La campana lo consulta cada poco, y
    /// traerse la lista entera para pintar un numero seria desperdicio.
    /// </summary>
    [HttpGet("unread-count")]
    public ActionResult<object> UnreadCount() => Ok(new { count = store.CountUnread(UserId) });

    [HttpPost("{id}/read")]
    public IActionResult MarkRead(string id) =>
        store.MarkRead(UserId, id)
            ? NoContent()
            : Problem($"No existe el aviso '{id}'.", statusCode: StatusCodes.Status404NotFound);

    [HttpPost("read-all")]
    public ActionResult<object> MarkAllRead() => Ok(new { updated = store.MarkAllRead(UserId) });
}
