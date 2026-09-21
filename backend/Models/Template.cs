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
