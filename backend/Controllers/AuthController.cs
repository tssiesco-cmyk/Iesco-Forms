using System.Security.Claims;
using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IescoForms.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IUserStore users, ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>
    /// Valida las credenciales y deja la sesion abierta en una cookie HttpOnly.
    /// El navegador la manda sola en cada peticion; el JavaScript no puede leerla,
    /// asi que un XSS no puede robarla.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<UserProfile>> Login([FromBody] LoginRequest request)
    {
        var user = users.ValidateCredentials(request.Email, request.Password);

        if (user is null)
        {
            // Mismo mensaje para correo inexistente y contrasena incorrecta: decir
            // cual de los dos fallo confirmaria que esa cuenta existe.
            logger.LogWarning("Intento de acceso fallido para {Email}.", request.Email);
            return Problem("Correo o contrasena incorrectos.", statusCode: StatusCodes.Status401Unauthorized);
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role),
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                // "Recuerdame": sin esto la sesion muere al cerrar el navegador.
                IsPersistent = request.RememberMe,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8),
            });

        logger.LogInformation("{Email} inicio sesion.", user.Email);
        return Ok(user.ToProfile());
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    /// <summary>
    /// Quien esta conectado. El frontend lo llama al arrancar para saber si hay
    /// sesion viva sin tener que guardar nada por su cuenta.
    /// </summary>
    [HttpGet("me")]
    public ActionResult<UserProfile> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = id is null ? null : users.FindById(id);

        // La cookie puede seguir siendo valida aunque el usuario ya no exista
        // (por ejemplo tras reiniciar el backend, que vuelve a generar los ids).
        if (user is null) return Problem("La sesion ya no es valida.", statusCode: StatusCodes.Status401Unauthorized);

        return Ok(user.ToProfile());
    }
}
