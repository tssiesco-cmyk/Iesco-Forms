using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using IescoForms.Api.Controllers;
using IescoForms.Api.Data;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

// "dotnet run -- crear-usuario" genera el INSERT de un usuario y termina, sin
// levantar la API ni conectarse a la base.
if (args.Length > 0 && args[0] == CrearUsuarioCommand.Name)
{
    CrearUsuarioCommand.Run();
    return;
}

var builder = WebApplication.CreateBuilder(args);

// La cadena vive en appsettings.Development.json. Si falta conviene reventar al
// arrancar y no descubrirlo en la primera peticion que toque la base.
var connectionString = builder.Configuration.GetConnectionString("IescoForms")
    ?? throw new InvalidOperationException(
        "Falta la cadena de conexion 'IescoForms'. Revisa appsettings.Development.json.");

builder.Services.AddDbContext<IescoFormsDbContext>(options => options.UseSqlServer(connectionString));

// El frontend corre en su propio servidor durante el desarrollo, asi que el
// navegador necesita permiso explicito para llamar a esta API. AllowCredentials
// es lo que deja viajar la cookie de sesion; exige origenes explicitos, nunca "*".
const string FrontendCors = "frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "iesco.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        // En desarrollo se trabaja en http; en produccion la cookie solo debe
        // viajar por https, y ahi esto pasa a Always.
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        // Por defecto, al no haber sesion redirige a una pagina de login con un
        // 302 en HTML. Esto es una API: tiene que responder codigos.
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };

        // La cookie guarda el rol del momento en que se entro. Sin esta
        // comprobacion, un usuario desactivado o al que le quitaron el rol de
        // administrador seguiria entrando con su cookie hasta que caducara.
        // Cuesta una consulta por peticion contra la clave primaria.
        options.Events.OnValidatePrincipal = async context =>
        {
            var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var store = context.HttpContext.RequestServices.GetRequiredService<IUserStore>();
            var user = id is null ? null : store.FindById(id);

            if (user is null || !context.Principal!.IsInRole(user.Role))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });

builder.Services.AddAuthorization();

// "Olvide mi contrasena" no pide sesion: sin limite, cualquiera podria llenar
// la lista de solicitudes de los administradores. 5 cada 15 minutos por IP
// sobra para quien de verdad la olvido.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(AuthController.ForgotPasswordPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
            }));

    // Login por IP: holgado a proposito. En la oficina todos comparten IP, y el
    // bloqueo que importa es por cuenta (LoginThrottle: 5 fallos, 15 minutos).
    // Esto solo corta a un script que prueba contrasenas contra muchas cuentas.
    options.AddPolicy(AuthController.LoginPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 50,
                Window = TimeSpan.FromMinutes(5),
            }));

    // Enviar respuestas no pide sesion con un enlace. El limite es alto a
    // proposito: en una capacitacion toda la sala responde a la vez desde la
    // misma IP. Lo que corta es un script mandando miles.
    options.AddPolicy(ResponsesController.SubmitPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
            }));
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // El frontend trabaja en camelCase; es el valor por defecto, pero conviene
    // dejarlo escrito para que nadie lo cambie sin darse cuenta.
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    // Los campos nulos (por ejemplo trashedAt) no viajan.
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

// Unico punto donde se elige la implementacion de cada almacen. Al pasar a SQL
// Server estas dos lineas cambian y nada mas se toca.
builder.Services.AddScoped<IFormStore, SqlFormStore>();
// Scoped, no Singleton: el DbContext vive lo que dura la peticion y un
// singleton no puede quedarse con uno guardado.
builder.Services.AddScoped<IUserStore, SqlUserStore>();
builder.Services.AddScoped<INotificationStore, SqlNotificationStore>();
builder.Services.AddScoped<IFormShareStore, SqlFormShareStore>();
builder.Services.AddScoped<IFormLinkStore, SqlFormLinkStore>();
builder.Services.AddScoped<IFormActivityStore, SqlFormActivityStore>();
builder.Services.AddScoped<IUserTemplateStore, SqlUserTemplateStore>();

// Decide que puede hacer el usuario conectado con cada formulario. Lee el
// usuario de la peticion, por eso necesita el HttpContext.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<FormAccess>();
builder.Services.AddSingleton<ImageStorage>();

// Bloqueo por cuenta tras fallos de login. Singleton: el contador tiene que
// sobrevivir entre peticiones.
builder.Services.AddSingleton<LoginThrottle>();

// Reparte los avisos de un formulario entre su dueno y sus colaboradores.
builder.Services.AddScoped<FormNotifier>();

var app = builder.Build();

// Carga las plantillas que falten y avisa si no queda ningun administrador.
// Solo inserta lo que falta, asi que correrlo en cada arranque no pisa nada.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IescoFormsDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    DatabaseSeeder.Run(db, logger);
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Sirve las imagenes de fondo subidas. Van antes de la autenticacion porque
// quien responde un formulario publico tiene que poder verlas sin sesion.
app.UseStaticFiles();

app.UseCors(FrontendCors);

// El orden importa: primero se averigua quien es, despues si puede.
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

// Comprobacion rapida de que la API esta viva. Abierta a proposito.
// Tambien dice si la base responde: es la forma mas rapida de distinguir "la
// API esta caida" de "la API esta bien pero SQL Server no contesta".
app.MapGet("/api/health", async (IescoFormsDbContext db) =>
{
    var baseViva = await db.Database.CanConnectAsync();

    return Results.Ok(new
    {
        status = baseViva ? "ok" : "degraded",
        storage = "sqlserver",
        database = baseViva ? "conectada" : "sin conexion",
        time = DateTimeOffset.UtcNow,
    });
}).AllowAnonymous();

app.Run();
