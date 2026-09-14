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
    Form? CreateFormFromTemplate(string templateId, string ownerId);
    Form? UpdateForm(string id, string? title, string? description, string? status);

    /// <summary>
    /// Cambia la imagen de fondo. Devuelve la ruta de la anterior (o null) para
    /// que quien llama pueda borrar el archivo que queda sin usar.
    /// </summary>
    string? SetBackground(string formId, string? imagePath, bool? overlay, bool? perQuestion);

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
    Question? UpdateQuestion(string formId, string questionId, string? title, string? description, bool? required);
    bool DeleteQuestion(string formId, string questionId);
    bool ReorderQuestions(string formId, int fromIndex, int toIndex);

    // --- Opciones ---
    QuestionOption? AddOption(string formId, string questionId);
    bool UpdateOption(string formId, string questionId, string optionId, string? text);
    bool DeleteOption(string formId, string questionId, string optionId);

    // --- Campos del respondedor ---
    IntroField? AddIntroField(string formId, string? type);
    bool UpdateIntroField(string formId, string fieldId, string? label, string? placeholder, bool? required, bool? enabled);
    bool RemoveIntroField(string formId, string fieldId);

    // --- Respuestas ---
    IReadOnlyList<FormResponse> GetResponses(string formId);
    FormResponse? AddResponse(string formId, Dictionary<string, JsonNode?>? answers, Dictionary<string, string>? respondent);

    // --- Plantillas (solo lectura) ---
    IReadOnlyList<Template> GetTemplates();
}
