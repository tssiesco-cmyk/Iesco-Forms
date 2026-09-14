using System.Text.Json.Nodes;

namespace IescoForms.Api.Models;

/// <summary>
/// Una respuesta enviada por alguien que llena el formulario.
/// </summary>
public class FormResponse
{
    public string Id { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }

    /// <summary>
    /// Datos de quien responde, tomados de los campos de intro.
    /// La clave es el id del campo (o "name"/"email" en los datos de ejemplo).
    /// </summary>
    public Dictionary<string, string> Respondent { get; set; } = [];

    /// <summary>
    /// Respuestas indexadas por id de pregunta. El valor es una cadena para las
    /// preguntas de texto y de opcion unica (ahi guarda el id de la opcion), y un
    /// arreglo de ids para las de opcion multiple. Se usa JsonNode porque el tipo
    /// depende de la pregunta y debe viajar tal cual hacia y desde el frontend.
    /// </summary>
    public Dictionary<string, JsonNode?> Answers { get; set; } = [];
}
