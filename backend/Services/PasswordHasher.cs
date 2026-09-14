using System.Security.Cryptography;

namespace IescoForms.Api.Services;

/// <summary>
/// Cifrado de contrasenas con PBKDF2-SHA256.
///
/// Cada contrasena lleva su propia sal aleatoria, asi que dos usuarios con la
/// misma clave producen hashes distintos. El numero de iteraciones se guarda
/// junto al hash: subirlo mas adelante no invalida las contrasenas ya guardadas.
/// </summary>
public static class PasswordHasher
{
    // Recomendacion de OWASP para PBKDF2-SHA256.
    private const int Iterations = 210_000;
    private const int SaltSize = 16;
    private const int HashSize = 32;

    /// <summary>Devuelve "iteraciones.sal.hash", todo en base64.</summary>
    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Derive(password, salt, Iterations);

        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string stored)
    {
        var parts = stored.Split('.');
        if (parts.Length != 3) return false;

        if (!int.TryParse(parts[0], out var iterations)) return false;

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[1]);
            expected = Convert.FromBase64String(parts[2]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Derive(password, salt, iterations);

        // Comparacion de tiempo fijo: una comparacion normal se detiene en el
        // primer byte distinto y filtra informacion por el tiempo que tarda.
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static byte[] Derive(string password, byte[] salt, int iterations) =>
        Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, HashSize);
}
