namespace IescoForms.Api.Models;

/// <summary>
/// Plantilla de formulario. Es solo lectura: sirve de molde para crear
/// formularios nuevos, no se edita desde la aplicacion.
///
/// El catalogo vive en el codigo, en <c>Services/SeedData.cs</c>, no en la base.
/// Para cambiar una plantilla se edita ese archivo.
/// </summary>
public class Template
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Fondo con el que nace el formulario. Es una ruta publica servida por el
    /// frontend (carpeta public), no una imagen subida: no vive en
    /// uploads/backgrounds y por tanto nadie la borra al cambiar un fondo.
    /// Vacio: el formulario nace sin fondo.
    /// </summary>
    public string BackgroundImage { get; set; } = string.Empty;

    /// <summary>Portada con la que nace el formulario. Ver Form.CoverEnabled.</summary>
    public bool CoverEnabled { get; set; }
    public string CoverTitle { get; set; } = string.Empty;
    public string CoverSubtitle { get; set; } = string.Empty;
    public string CoverWelcome { get; set; } = string.Empty;

    public List<TemplateQuestion> Questions { get; set; } = [];
}

public class TemplateQuestion
{
    public string Type { get; set; } = QuestionType.ShortText;
    public string Title { get; set; } = string.Empty;
    public bool Required { get; set; }

    /// <summary>Textos de las opciones. Los ids se generan al crear el formulario.</summary>
    public List<string> Options { get; set; } = [];
}
