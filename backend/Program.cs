using System.Text.Json.Serialization;
using IescoForms.Api.Services;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);

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
    });

builder.Services.AddAuthorization();

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
builder.Services.AddSingleton<IFormStore, InMemoryFormStore>();
builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<INotificationStore, InMemoryNotificationStore>();
builder.Services.AddSingleton<ImageStorage>();

var app = builder.Build();

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

app.MapControllers();

// Comprobacion rapida de que la API esta viva. Abierta a proposito.
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    storage = "in-memory",
    time = DateTimeOffset.UtcNow,
})).AllowAnonymous();

app.Run();
