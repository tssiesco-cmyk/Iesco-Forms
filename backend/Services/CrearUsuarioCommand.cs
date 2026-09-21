using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Comando de consola para dar de alta un usuario a mano:
///
///     dotnet run -- crear-usuario
///
/// No toca la base. Pide los datos, cifra la contrasena y escribe el INSERT para
/// ejecutarlo en SQL Server. Asi ninguna contrasena tiene que vivir en un
/// archivo del repositorio, y quien crea el usuario ve exactamente que se inserta.
/// </summary>
public static class CrearUsuarioCommand
{
    public const string Name = "crear-usuario";

    public static void Run()
    {
        var email = Preguntar("Correo: ").Trim().ToLowerInvariant();
        if (email.Length == 0 || !email.Contains('@'))
        {
            Console.Error.WriteLine("Correo no valido.");
            return;
        }

        var nombre = Preguntar("Nombre visible: ").Trim();
        if (nombre.Length == 0) nombre = email;

        var rol = Preguntar($"Rol ({UserRole.Admin}/{UserRole.Editor}) [{UserRole.Editor}]: ").Trim();
        if (rol.Length == 0) rol = UserRole.Editor;
        if (!UserRole.IsValid(rol))
        {
            Console.Error.WriteLine($"Rol no valido: tiene que ser {UserRole.Admin} o {UserRole.Editor}.");
            return;
        }

        var clave = PreguntarOculto("Contrasena: ");
        if (clave.Length < PasswordHasher.MinLength)
        {
            Console.Error.WriteLine($"La contrasena debe tener al menos {PasswordHasher.MinLength} caracteres.");
            return;
        }

        if (PreguntarOculto("Repite la contrasena: ") != clave)
        {
            Console.Error.WriteLine("Las contrasenas no coinciden.");
            return;
        }

        // El id sale del correo, igual que en el seeder: asi un usuario creado a
        // mano y uno sembrado con el mismo correo son el mismo usuario.
        var id = UserIdentity.ForEmail(email);
        var hash = PasswordHasher.Hash(clave);

        Console.WriteLine();
        Console.WriteLine("-- Ejecuta esto en la base de la aplicacion (la de la cadena de conexion):");
        Console.WriteLine("INSERT INTO dbo.Users (Id, Email, DisplayName, Role, PasswordHash, IsActive)");
        Console.WriteLine($"VALUES ('{id}', N'{Sql(email)}', N'{Sql(nombre)}', N'{rol}', N'{hash}', 1);");
        Console.WriteLine();
        Console.WriteLine("-- O, si el usuario ya existe y solo quieres cambiarle la contrasena:");
        Console.WriteLine($"UPDATE dbo.Users SET PasswordHash = N'{hash}' WHERE Email = N'{Sql(email)}';");
    }

    private static string Sql(string texto) => texto.Replace("'", "''");

    private static string Preguntar(string etiqueta)
    {
        Console.Write(etiqueta);
        return Console.ReadLine() ?? string.Empty;
    }

    /// <summary>Lee mostrando asteriscos en lugar de lo que se escribe.</summary>
    private static string PreguntarOculto(string etiqueta)
    {
        Console.Write(etiqueta);

        // Con la entrada redirigida (una tuberia) no hay teclas que interceptar.
        if (Console.IsInputRedirected) return Console.ReadLine() ?? string.Empty;

        var texto = new System.Text.StringBuilder();
        while (true)
        {
            var tecla = Console.ReadKey(intercept: true);
            if (tecla.Key == ConsoleKey.Enter) break;

            if (tecla.Key == ConsoleKey.Backspace)
            {
                if (texto.Length == 0) continue;
                texto.Length--;
                // Borra el ultimo asterisco de la pantalla.
                Console.Write("\b \b");
            }
            else if (!char.IsControl(tecla.KeyChar))
            {
                texto.Append(tecla.KeyChar);
                // Un asterisco por caracter: no se ve la clave, pero si que se
                // esta escribiendo.
                Console.Write('*');
            }
        }

        Console.WriteLine();
        return texto.ToString();
    }
}
