using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Logica condicional y validacion de valores de las respuestas.
///
/// El recorrido tiene que calcularse igual aqui y en el frontend
/// (frontend/src/services/questionTypes.js): el navegador decide que pregunta
/// mostrar y el servidor decide cuales eran obligatorias. Si los dos no
/// coinciden, una pregunta saltada podria exigirse al enviar.
/// </summary>
public static class FormLogic
{
    /// <summary>
    /// Ids de las preguntas por las que pasa quien responde con estas
    /// respuestas, en orden. Las que se saltan no se exigen ni se guardan.
    /// </summary>
    public static List<string> VisitedQuestionIds(IReadOnlyList<Question> questions, Dictionary<string, JsonNode?>? answers)
    {
        var visitadas = new List<string>();
        var indice = questions.Count > 0 ? 0 : -1;

        while (indice >= 0)
        {
            var pregunta = questions[indice];
            visitadas.Add(pregunta.Id);

            JsonNode? valor = null;
            answers?.TryGetValue(pregunta.Id, out valor);
            indice = NextIndex(questions, indice, OptionOf(valor));
        }

        return visitadas;
    }

    /// <summary>
    /// Indice de la siguiente pregunta, o -1 si ahi termina. Un salto solo vale
    /// hacia adelante: uno que apunte atras (por un reordenamiento) o a una
    /// pregunta que ya no existe se ignora, asi nunca hay ciclos.
    /// </summary>
    public static int NextIndex(IReadOnlyList<Question> questions, int index, string? chosenOptionId)
    {
        var pregunta = questions[index];
        var salto = pregunta.JumpTo;

        if (QuestionType.IsSingleOption(pregunta.Type) && chosenOptionId is not null)
        {
            var opcion = pregunta.Options.FirstOrDefault(o => o.Id == chosenOptionId);
            if (!string.IsNullOrEmpty(opcion?.JumpTo)) salto = opcion.JumpTo;
        }

        if (salto == QuestionJump.End) return -1;

        if (!string.IsNullOrEmpty(salto))
        {
            var destino = questions.ToList().FindIndex(q => q.Id == salto);
            if (destino > index) return destino;
        }

        return index + 1 < questions.Count ? index + 1 : -1;
    }

    /// <summary>
    /// Pasa un salto a formato de plantilla: el id de la pregunta destino se
    /// cambia por su posicion, porque la copia tendra ids nuevos.
    /// </summary>
    public static string JumpToTemplate(string? jumpTo, IReadOnlyList<string> questionIds)
    {
        if (string.IsNullOrEmpty(jumpTo)) return string.Empty;
        if (jumpTo == QuestionJump.End) return QuestionJump.End;

        var indice = questionIds.ToList().IndexOf(jumpTo);
        return indice >= 0 ? indice.ToString(CultureInfo.InvariantCulture) : string.Empty;
    }

    /// <summary>Lo contrario de <see cref="JumpToTemplate"/>, ya con los ids nuevos.</summary>
    public static string? JumpFromTemplate(string? jumpTo, IReadOnlyList<string> newQuestionIds)
    {
        if (string.IsNullOrEmpty(jumpTo)) return null;
        if (jumpTo == QuestionJump.End) return QuestionJump.End;

        return int.TryParse(jumpTo, NumberStyles.None, CultureInfo.InvariantCulture, out var indice)
            && indice < newQuestionIds.Count
                ? newQuestionIds[indice]
                : null;
    }

    private static string? OptionOf(JsonNode? valor) =>
        valor is not null && valor.GetValueKind() == JsonValueKind.String ? valor.GetValue<string>() : null;

    /// <summary>
    /// Null si el valor sirve para ese tipo de pregunta; si no, por que no.
    /// Solo mira los tipos con formato fijo: el texto libre y las opciones ya
    /// se filtran al guardar.
    /// </summary>
    public static string? InvalidValueReason(Question question, JsonNode? valor)
    {
        if (valor is null || valor is JsonArray) return null;

        var texto = valor.GetValueKind() == JsonValueKind.String ? valor.GetValue<string>() : valor.ToString();
        if (string.IsNullOrWhiteSpace(texto)) return null;

        switch (question.Type)
        {
            case QuestionType.Rating:
                var maximo = question.ScaleMax ?? QuestionType.DefaultScale;
                return int.TryParse(texto, out var estrellas) && estrellas >= 1 && estrellas <= maximo
                    ? null
                    : $"la calificacion debe ir de 1 a {maximo}";

            case QuestionType.Nps:
                return int.TryParse(texto, out var nota) && nota >= 0 && nota <= 10
                    ? null
                    : "la puntuacion debe ir de 0 a 10";

            case QuestionType.Number:
                // Sin separador de miles: "1,5" no puede convertirse en 15. El
                // navegador ya manda la coma decimal como punto.
                return decimal.TryParse(texto.Trim(), NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                        CultureInfo.InvariantCulture, out _)
                    ? null
                    : "debe ser un numero";

            case QuestionType.Date:
                return DateOnly.TryParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _)
                    ? null
                    : "debe ser una fecha valida";

            default:
                return null;
        }
    }
}
