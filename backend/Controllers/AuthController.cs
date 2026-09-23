using System.Security.Claims;
using IescoForms.Api.Contracts;
using IescoForms.Api.Models;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IescoForms.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IUserStore users,
    INotificationStore notifications,
    LoginThrottle throttle,
    ILogger<AuthController> logger) : ControllerBase
{
    /// <summary>Nombre de la politica de limite de peticiones; se registra en Program.cs.</summary>
    public const string ForgotPasswordPolicy = "forgot-password";

    /// <summary>
    /// Limite de intentos de login por IP; se registra en Program.cs. El bloqueo
    /// fino es por cuenta (<see cref="LoginThrottle"/>); este solo frena scripts.
    /// </summary>
    public const string LoginPolicy = "login";

    /// <summary>
    /// Valida las credenciales y deja la sesion abierta en una cookie HttpOnly.
    /// El navegador la manda sola en cada peticion; el JavaScript no puede leerla,
    /// asi que un XSS no puede robarla.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting(LoginPolicy)]
    [HttpPost("login")]
    public async Task<ActionResult<UserProfile>> Login([FromBody] LoginRequest request)
    {
        // Cuenta bloqueada: ni se comprueba la contrasena. Si no, se podria
        // seguir probando y ver cual da 429 y cual 401.
        if (throttle.LockedUntil(request.Email) is { } hasta)
        {
            var minutos = Math.Max(1, (int)Math.Ceiling((hasta - DateTimeOffset.UtcNow).TotalMinutes));
            return Problem(
                $"Demasiados intentos fallidos para esta cuenta. Vuelve a intentarlo en {minutos} minuto{(minutos == 1 ? "" : "s")}.",
                statusCode: StatusCodes.Status429TooManyRequests);
        }

        var user = users.ValidateCredentials(request.Email, request.Password);

        if (user is null)
        {
            // Mismo mensaje para correo inexistente y contrasena incorrecta: decir
            // cual de los dos fallo confirmaria que esa cuenta existe.
            logger.LogWarning("Intento de acceso fallido para {Email}.", request.Email);

            if (throttle.RegisterFailure(request.Email))
            {
                logger.LogWarning("Cuenta {Email} bloqueada {Minutos} minutos por intentos fallidos desde {Ip}.",
                    request.Email, LoginThrottle.LockDuration.TotalMinutes, HttpContext.Connection.RemoteIpAddress);
            }

            return Problem("Correo o contrasena incorrectos.", statusCode: StatusCodes.Status401Unauthorized);
        }

        throttle.Reset(request.Email);

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

    /// <summary>
    /// "Olvide mi contrasena". Mientras no haya servidor de correo, deja una
    /// solicitud que los administradores ven en Configuracion &gt; Usuarios.
    ///
    /// Responde siempre lo mismo, exista o no el correo: otra respuesta
    /// permitiria averiguar que cuentas hay. El limite por IP evita que alguien
    /// la use para llenar la lista de solicitudes.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting(ForgotPasswordPolicy)]
    [HttpPost("forgot-password")]
    public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var solicitante = users.RequestPasswordReset(request.Email);

        // Se avisa a los administradores activos, que son quienes pueden darle
        // una contrasena nueva. La respuesta no cambia: sigue sin delatar si el
        // correo existe.
        //
        // Si el aviso falla, la solicitud ya quedo guardada y se ve en
        // Configuracion > Usuarios. Se registra en el log y se responde igual:
        // un 500 solo para correos existentes delataria que la cuenta existe.
        if (solicitante is not null)
        {
            try
            {
                foreach (var admin in users.List().Where(u => u.IsActive && u.Role == UserRole.Admin))
                {
                    notifications.Record(admin.Id, NotificationType.PasswordRequested,
                        formId: null, solicitante.DisplayName, actorId: solicitante.Id);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "No se pudo avisar a los administradores de la solicitud de {Email}.", request.Email);
            }
        }

        logger.LogInformation("Solicitud de contrasena olvidada para {Email}.", request.Email);
        return Accepted();
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
