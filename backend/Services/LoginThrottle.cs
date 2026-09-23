using Microsoft.Extensions.Caching.Memory;

namespace IescoForms.Api.Services;

/// <summary>
/// Bloqueo temporal por cuenta tras varios intentos fallidos de login.
///
/// Por que por cuenta y no solo por IP: en la oficina todos salen a internet
/// por la misma IP, asi que un limite estricto por IP dejaba sin login a todo
/// el mundo cuando una persona se equivocaba varias veces. Y al reves, un
/// ataque desde muchas IPs contra una misma cuenta no lo frenaba.
///
/// Solo cuentan los fallos, y un login correcto pone el contador a cero: quien
/// entra bien nunca nota nada. Cuenta igual los correos que no existen, para
/// que la respuesta no delate que cuentas hay.
///
/// Vive en memoria: al reiniciar el backend se olvidan los bloqueos. Para esta
/// aplicacion es suficiente y no necesita tabla. Se registra como singleton.
/// </summary>
public class LoginThrottle
{
    /// <summary>
    /// Cache propia y no la compartida: el tope de entradas obliga a declarar
    /// Size en cada una, y no debe imponerse a otros usos de la cache. El tope
    /// impide llenar la memoria probando miles de correos inventados.
    /// </summary>
    private readonly MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 10_000 });

    /// <summary>Fallos seguidos que bloquean la cuenta.</summary>
    public const int MaxFailures = 5;

    /// <summary>Cuanto dura el bloqueo, y cuanto se recuerdan los fallos sueltos.</summary>
    public static readonly TimeSpan LockDuration = TimeSpan.FromMinutes(15);

    private sealed class Estado
    {
        public int Fallos;
        public DateTimeOffset? BloqueadaHasta;
    }

    private readonly Lock _gate = new();

    private static string Clave(string? email) =>
        "login:" + (email ?? string.Empty).Trim().ToLowerInvariant();

    /// <summary>Hasta cuando esta bloqueada la cuenta, o null si puede intentarlo.</summary>
    public DateTimeOffset? LockedUntil(string? email)
    {
        lock (_gate)
        {
            if (!cache.TryGetValue(Clave(email), out Estado? estado) || estado?.BloqueadaHasta is null)
                return null;

            return estado.BloqueadaHasta > DateTimeOffset.UtcNow ? estado.BloqueadaHasta : null;
        }
    }

    /// <summary>
    /// Anota un fallo. Devuelve true si con este la cuenta queda bloqueada,
    /// para dejarlo en el log.
    /// </summary>
    public bool RegisterFailure(string? email)
    {
        lock (_gate)
        {
            var clave = Clave(email);
            var estado = cache.Get<Estado>(clave) ?? new Estado();

            // Un bloqueo ya vencido empieza la cuenta de nuevo.
            if (estado.BloqueadaHasta is not null && estado.BloqueadaHasta <= DateTimeOffset.UtcNow)
            {
                estado = new Estado();
            }

            estado.Fallos++;
            var bloquea = estado.Fallos >= MaxFailures && estado.BloqueadaHasta is null;
            if (bloquea) estado.BloqueadaHasta = DateTimeOffset.UtcNow + LockDuration;

            // Los fallos sueltos caducan solos: tres errores hoy no suman con
            // dos de manana. Size 1 por entrada, para que el limite de la cache
            // impida llenar la memoria probando miles de correos inventados.
            cache.Set(clave, estado, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = LockDuration,
                Size = 1,
            });

            return bloquea;
        }
    }

    /// <summary>Login correcto: olvida los fallos anteriores.</summary>
    public void Reset(string? email)
    {
        lock (_gate) cache.Remove(Clave(email));
    }
}
