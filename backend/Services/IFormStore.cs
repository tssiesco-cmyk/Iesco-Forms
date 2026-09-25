using System.Text.Json.Nodes;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Toda la persistencia pasa por aqui. Hoy la implementa <see cref="InMemoryFormStore"/>,
/// que guarda los datos en memoria y los pierde al reiniciar. Cuando entre SQL Server
/// solo hay que escribir una implementacion nueva con Entity Framework y cambiar el
/// registro en Program.cs: ni los controladores ni el frontend se enteran.
/// </summary>
public interface IFormStore
{
    // --- Formularios ---
    IReadOnlyList<Form> GetForms();
    Form? GetForm(string id);
    Form CreateForm(string? title, string? description, string ownerId);

    /// <summary>
    /// Crea un formulario a partir de una plantilla: del catalogo, de un usuario
    /// o la copia de otro formulario (duplicar). Las rutas de imagen se usan tal
    /// cual: si hay que copiar archivos, lo hace quien llama antes.
    /// </summary>
    /// <param name="title">Titulo del nuevo; null usa el nombre de la plantilla.</param>
    Form CreateFormFrom(Template template, string ownerId, string? title = null);

    /// <summary>
    /// Copia completa de un formulario como plantilla: preguntas, opciones,
    /// campos, portada, fondos y mensaje final. Sin respuestas, ni compartidos,
    /// ni cierre. Null si no existe.
    /// </summary>
    Template? ToTemplate(string formId);

    Form? UpdateForm(string id, string? title, string? description, string? status);

    /// <summary>
    /// Cierre y mensaje final. Los nulos no se tocan; para quitar la fecha va
    /// <paramref name="clearClosesAt"/>, y un cupo de 0 quita el limite.
    /// </summary>
    Form? UpdateSettings(string formId, DateTimeOffset? closesAt, bool clearClosesAt, int? maxResponses, string? confirmationMessage);

    /// <summary>
    /// Cambia la imagen de fondo. Devuelve la ruta de la anterior (o null) para
    /// que quien llama pueda borrar el archivo que queda sin usar.
    /// </summary>
    string? SetBackground(string formId, string? imagePath, bool? overlay, bool? perQuestion);

    /// <summary>Portada del formulario. Los nulos se dejan como estan.</summary>
    Form? SetCover(string formId, bool? enabled, string? title, string? subtitle, string? welcome);

    /// <summary>
    /// Cambia la imagen de una pregunta. Devuelve la anterior para poder borrar
    /// su archivo, igual que SetBackground.
    /// </summary>
    string? SetQuestionBackground(string formId, string questionId, string? imagePath);

    /// <summary>Cambia la imagen de la pantalla de datos. Devuelve la anterior.</summary>
    string? SetIntroBackground(string formId, string? imagePath);

    /// <summary>Todas las imagenes de un formulario: la suya y las de sus preguntas.</summary>
    IReadOnlyList<string> GetImagePaths(string formId, bool includeTrashed = false);

    // --- Papelera ---
    IReadOnlyList<Form> GetTrashedForms();
    bool TrashForm(string id);
    bool RestoreForm(string id);
    bool PermanentDeleteForm(string id);
    /// <summary>Devuelve los ids borrados, para limpiar lo que dependa de ellos.</summary>
    IReadOnlyList<string> EmptyTrash();

    // --- Preguntas ---
    Question? AddQuestion(string formId, string type);

    /// <summary>
    /// Copia una pregunta con ids nuevos (el suyo y los de sus opciones) y la
    /// inserta justo despues de la original. La imagen de fondo no se copia a
    /// proposito: el archivo seria el mismo en disco y al borrar una de las dos
    /// copias la otra se quedaria apuntando a una ruta que ya no existe.
    /// </summary>
    Question? DuplicateQuestion(string formId, string questionId);
    /// <param name="jumpTo">Salto de la pregunta: null no lo toca, vacio lo quita.</param>
    /// <param name="scaleMax">Estrellas; solo se aplica a las preguntas rating.</param>
    Question? UpdateQuestion(string formId, string questionId, string? title, string? description, bool? required, string? textCase, string? jumpTo, int? scaleMax);

    /// <summary>
    /// Al borrar una pregunta, los saltos que llevaban a ella se quitan: quien
    /// responda seguira a la siguiente.
    /// </summary>
    bool DeleteQuestion(string formId, string questionId);
    bool ReorderQuestions(string formId, int fromIndex, int toIndex);

    // --- Opciones ---
    QuestionOption? AddOption(string formId, string questionId);
    /// <param name="jumpTo">Salto al elegir la opcion: null no lo toca, vacio lo quita.</param>
    bool UpdateOption(string formId, string questionId, string optionId, string? text, string? jumpTo);
    bool DeleteOption(string formId, string questionId, string optionId);

    // --- Campos del respondedor ---
    IntroField? AddIntroField(string formId, string? type);
    bool UpdateIntroField(string formId, string fieldId, string? label, string? placeholder, bool? required, bool? enabled);
    bool RemoveIntroField(string formId, string fieldId);

    // --- Respuestas ---
    IReadOnlyList<FormResponse> GetResponses(string formId);
    FormResponse? AddResponse(string formId, Dictionary<string, JsonNode?>? answers, Dictionary<string, string>? respondent);

    /// <summary>Borra una respuesta para siempre. False si no es de ese formulario.</summary>
    bool DeleteResponse(string formId, string responseId);

    // --- Plantillas del catalogo (solo lectura) ---
    IReadOnlyList<Template> GetTemplates();
}
