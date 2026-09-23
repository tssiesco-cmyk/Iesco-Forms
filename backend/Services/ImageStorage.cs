namespace IescoForms.Api.Services;

/// <summary>
/// Guarda en disco las imagenes que sube la aplicacion y las valida.
///
/// La subida de archivos es el punto clasico por donde se cuela un ataque, asi
/// que aqui no se confia en nada de lo que manda el cliente: ni el nombre del
/// archivo, ni su extension, ni el tipo que declara. Lo unico que decide es el
/// contenido real de los primeros bytes.
/// </summary>
public class ImageStorage(IWebHostEnvironment environment, ILogger<ImageStorage> logger)
{
    public const long MaxBytes = 5 * 1024 * 1024;

    /// <summary>Carpetas publicas donde acaban los archivos, relativas a wwwroot.</summary>
    public const string Backgrounds = "uploads/backgrounds";
    public const string Avatars = "uploads/avatars";

    /// <summary>
    /// Las unicas carpetas que esta clase toca. Delete mira aqui antes de
    /// borrar nada: una ruta que no salga de estas no se toca.
    /// </summary>
    private static readonly string[] Folders = [Backgrounds, Avatars];

    public record Result(bool Ok, string? PublicPath = null, string? Error = null);

    /// <summary>
    /// Firmas de archivo. Una imagen de verdad empieza siempre por estos bytes;
    /// un script disfrazado de .png, no.
    /// </summary>
    private static readonly (string Extension, byte[] Signature, int Offset)[] Signatures =
    [
        (".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0),
        (".jpg", [0xFF, 0xD8, 0xFF], 0),
        (".webp", [0x57, 0x45, 0x42, 0x50], 8), // "WEBP", tras "RIFF" y el tamano
    ];

    /// <param name="folder">
    /// <see cref="Backgrounds"/> o <see cref="Avatars"/>. Van separadas para que
    /// vaciar la papelera no pueda llevarse por delante la foto de nadie.
    /// </param>
    public async Task<Result> SaveAsync(IFormFile file, string folder, CancellationToken cancellationToken)
    {
        if (file.Length == 0) return new Result(false, Error: "El archivo esta vacio.");

        if (file.Length > MaxBytes)
        {
            return new Result(false,
                Error: $"La imagen pesa {file.Length / 1024 / 1024.0:0.#} MB y el maximo son 5 MB.");
        }

        await using var stream = file.OpenReadStream();

        var header = new byte[12];
        var read = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        if (read < header.Length) return new Result(false, Error: "El archivo no es una imagen valida.");

        var extension = DetectExtension(header);
        if (extension is null)
        {
            return new Result(false, Error: "Formato no admitido. Usa PNG, JPG o WebP.");
        }

        // El nombre lo ponemos nosotros: el del cliente podria traer rutas
        // ("../../appsettings.json") o caracteres que rompan el sistema de archivos.
        var fileName = $"{Guid.NewGuid():N}{extension}";

        var root = environment.WebRootPath;
        if (string.IsNullOrEmpty(root))
        {
            root = Path.Combine(environment.ContentRootPath, "wwwroot");
        }

        var directory = Path.Combine(root, folder.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(directory);

        var fullPath = Path.Combine(directory, fileName);

        stream.Position = 0;
        await using (var destination = File.Create(fullPath))
        {
            await stream.CopyToAsync(destination, cancellationToken);
        }

        logger.LogInformation("Imagen guardada: {Folder}/{File} ({Bytes} bytes).", folder, fileName, file.Length);
        return new Result(true, PublicPath: $"/{folder}/{fileName}");
    }

    /// <summary>
    /// Copia una imagen subida a un archivo nuevo y devuelve su ruta. Al duplicar
    /// un formulario o guardarlo como plantilla cada copia necesita el suyo: si
    /// compartieran archivo, borrar una se llevaria la imagen de la otra.
    ///
    /// Las rutas que no son de uploads (los fondos del catalogo, servidos por el
    /// frontend) se devuelven tal cual: nadie las borra. Si el archivo ya no
    /// existe se devuelve vacio, para no copiar una ruta muerta.
    /// </summary>
    public string Copy(string publicPath)
    {
        if (string.IsNullOrWhiteSpace(publicPath)) return string.Empty;

        var folder = Array.Find(Folders, f => publicPath.StartsWith($"/{f}/", StringComparison.Ordinal));
        if (folder is null) return publicPath;

        var fileName = Path.GetFileName(publicPath);
        if (string.IsNullOrEmpty(fileName)) return string.Empty;

        var root = environment.WebRootPath;
        if (string.IsNullOrEmpty(root)) root = Path.Combine(environment.ContentRootPath, "wwwroot");

        var directory = Path.Combine(root, folder.Replace('/', Path.DirectorySeparatorChar));
        var source = Path.Combine(directory, fileName);
        if (!File.Exists(source)) return string.Empty;

        var newName = $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}";

        try
        {
            File.Copy(source, Path.Combine(directory, newName));
        }
        catch (IOException ex)
        {
            // Sin imagen es mejor que sin formulario: la copia sigue adelante.
            logger.LogWarning(ex, "No se pudo copiar la imagen {Path}.", source);
            return string.Empty;
        }

        return $"/{folder}/{newName}";
    }

    /// <summary>Borra el archivo de una imagen que ya no usa nadie.</summary>
    public void Delete(string? publicPath)
    {
        if (string.IsNullOrWhiteSpace(publicPath)) return;

        // La carpeta sale de la propia ruta, pero solo si es una de las
        // nuestras: asi una ruta manipulada no puede llevarnos a borrar algo
        // fuera de ellas. La firma no lleva la carpeta aparte a proposito,
        // porque quien llama solo guarda la ruta publica.
        var folder = Array.Find(Folders, f => publicPath.StartsWith($"/{f}/", StringComparison.Ordinal));
        if (folder is null) return;

        var fileName = Path.GetFileName(publicPath);
        if (string.IsNullOrEmpty(fileName)) return;

        var root = environment.WebRootPath;
        if (string.IsNullOrEmpty(root)) root = Path.Combine(environment.ContentRootPath, "wwwroot");

        var fullPath = Path.Combine(root, folder.Replace('/', Path.DirectorySeparatorChar), fileName);

        try
        {
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (IOException ex)
        {
            // Que no se pueda borrar el archivo no debe tumbar la operacion:
            // queda un archivo huerfano, nada mas.
            logger.LogWarning(ex, "No se pudo borrar la imagen {Path}.", fullPath);
        }
    }

    private static string? DetectExtension(byte[] header)
    {
        foreach (var (extension, signature, offset) in Signatures)
        {
            if (header.Length < offset + signature.Length) continue;

            var matches = true;
            for (var i = 0; i < signature.Length; i++)
            {
                if (header[offset + i] != signature[i]) { matches = false; break; }
            }

            if (matches) return extension;
        }

        return null;
    }
}
