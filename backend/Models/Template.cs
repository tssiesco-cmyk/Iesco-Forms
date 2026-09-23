namespace IescoForms.Api.Models;

/// <summary>
/// Plantilla de formulario: el molde con el que nace uno nuevo.
///
/// Hay dos origenes:
/// - Las del catalogo, fijas, en el codigo (<c>Services/SeedData.cs</c>). Para
///   cambiar una se edita ese archivo.
/// - Las que guardan los usuarios desde un formulario suyo ("Guardar como
///   plantilla"). Viven en la tabla UserTemplates y las ve todo el equipo.
///
/// La misma clase sirve tambien de copia completa de un formulario: duplicar es
/// sacar la plantilla de un formulario y crear otro a partir de ella.
/// </summary>
public class Template
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Fondo con el que nace el formulario. En las del catalogo es una ruta
    /// publica servida por el frontend (carpeta public), no una imagen subida:
    /// nadie la borra al cambiar un fondo. En las de usuario es una copia propia
    /// en uploads, que se borra al borrar la plantilla.
    /// Vacio: el formulario nace sin fondo.
    /// </summary>
    public string BackgroundImage { get; set; } = string.Empty;
    public bool BackgroundOverlay { get; set; } = true;
    public bool BackgroundPerQuestion { get; set; }
    public string IntroBackgroundImage { get; set; } = string.Empty;

    /// <summary>Portada con la que nace el formulario. Ver Form.CoverEnabled.</summary>
    public bool CoverEnabled { get; set; }
    public string CoverTitle { get; set; } = string.Empty;
    public string CoverSubtitle { get; set; } = string.Empty;
    public string CoverWelcome { get; set; } = string.Empty;

    public string ConfirmationMessage { get; set; } = string.Empty;

    public List<TemplateIntroField> IntroFields { get; set; } = [];
    public List<TemplateQuestion> Questions { get; set; } = [];

    // --- Solo en las de usuario; no se guardan dentro del contenido ---

    /// <summary>True en las guardadas por un usuario; false en las del catalogo.</summary>
    public bool IsCustom { get; set; }

    public string? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public DateTimeOffset? CreatedAt { get; set; }

    /// <summary>Si el usuario conectado puede borrarla: su autor o un administrador.</summary>
    public bool CanDelete { get; set; }

    /// <summary>Copia profunda, para modificarla sin tocar la original.</summary>
    public Template Clone() =>
        System.Text.Json.JsonSerializer.Deserialize<Template>(System.Text.Json.JsonSerializer.Serialize(this))!;

    /// <summary>Todas las rutas de imagen, para copiarlas o borrarlas de una vez.</summary>
    public IEnumerable<string> ImagePaths() =>
        new[] { BackgroundImage, IntroBackgroundImage }
            .Concat(Questions.Select(q => q.BackgroundImage))
            .Where(ruta => !string.IsNullOrEmpty(ruta));

    /// <summary>
    /// Cambia cada ruta de imagen por lo que devuelva <paramref name="map"/>.
    /// Se usa para copiar los archivos: dos formularios no pueden compartir uno,
    /// porque al borrar uno se lo llevaria al otro.
    /// </summary>
    public void MapImages(Func<string, string> map)
    {
        BackgroundImage = MapUna(BackgroundImage, map);
        IntroBackgroundImage = MapUna(IntroBackgroundImage, map);
        foreach (var pregunta in Questions) pregunta.BackgroundImage = MapUna(pregunta.BackgroundImage, map);
    }

    private static string MapUna(string ruta, Func<string, string> map) =>
        string.IsNullOrEmpty(ruta) ? ruta : map(ruta);
}

public class TemplateQuestion
{
    public string Type { get; set; } = QuestionType.ShortText;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Required { get; set; }
    public string TextCase { get; set; } = QuestionTextCase.Normal;
    public string BackgroundImage { get; set; } = string.Empty;

    /// <summary>Textos de las opciones. Los ids se generan al crear el formulario.</summary>
    public List<string> Options { get; set; } = [];
}

public class TemplateIntroField
{
    public string Type { get; set; } = "text";
    public string Label { get; set; } = string.Empty;
    public string Placeholder { get; set; } = string.Empty;
    public bool Required { get; set; }
    public bool Enabled { get; set; } = true;
}
