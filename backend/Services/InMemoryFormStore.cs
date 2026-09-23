using System.Text.Json;
using System.Text.Json.Nodes;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Almacen en memoria. Se registra como singleton, asi que varias peticiones lo
/// tocan a la vez: por eso cada operacion entra en un lock.
///
/// Los datos viven mientras corre el proceso. Al reiniciar vuelve a los de ejemplo.
/// </summary>
public class InMemoryFormStore : IFormStore
{
    private readonly Lock _gate = new();
    private readonly List<Form> _forms;
    private readonly List<Form> _trashed = [];
    private readonly List<FormResponse> _responses;
    private readonly List<Template> _templates;

    public InMemoryFormStore()
    {
        _forms = SeedData.CreateForms();
        _responses = SeedData.CreateResponses();
        _templates = SeedData.CreateTemplates();
    }

    private static string NewId() => Guid.NewGuid().ToString("N")[..8];

    private static string Today() => DateTime.UtcNow.ToString("yyyy-MM-dd");

    // --- Formularios ---

    public IReadOnlyList<Form> GetForms()
    {
        lock (_gate)
        {
            foreach (var form in _forms) RefreshResponseCount(form);
            return [.. _forms];
        }
    }

    public Form? GetForm(string id)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == id);
            if (form is not null) RefreshResponseCount(form);
            return form;
        }
    }

    /// <summary>Recalcula el contador derivado. Siempre se llama dentro del lock.</summary>
    private void RefreshResponseCount(Form form) =>
        form.ResponseCount = _responses.Count(r => r.FormId == form.Id);

    public Form CreateForm(string? title, string? description, string ownerId)
    {
        var form = new Form
        {
            Id = NewId(),
            Title = string.IsNullOrWhiteSpace(title) ? "Formulario sin titulo" : title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Status = FormStatus.Draft,
            OwnerId = ownerId,
            CreatedAt = Today(),
            IntroFields = [],
            Questions = [],
        };

        lock (_gate) _forms.Insert(0, form);
        return form;
    }

    public Form CreateFormFrom(Template template, string ownerId, string? title = null)
    {
        var form = new Form
        {
            Id = NewId(),
            Title = string.IsNullOrWhiteSpace(title) ? template.Name : title.Trim(),
            Description = template.Description,
            Status = FormStatus.Draft,
            OwnerId = ownerId,
            CreatedAt = Today(),
            BackgroundImage = template.BackgroundImage,
            BackgroundOverlay = template.BackgroundOverlay,
            BackgroundPerQuestion = template.BackgroundPerQuestion,
            IntroBackgroundImage = template.IntroBackgroundImage,
            CoverEnabled = template.CoverEnabled,
            CoverTitle = template.CoverTitle,
            CoverSubtitle = template.CoverSubtitle,
            CoverWelcome = template.CoverWelcome,
            ConfirmationMessage = template.ConfirmationMessage,
            IntroFields = [.. template.IntroFields.Select(i => new IntroField
            {
                Id = NewId(),
                Type = i.Type,
                Label = i.Label,
                Placeholder = i.Placeholder,
                Required = i.Required,
                Enabled = i.Enabled,
            })],
            Questions = [.. template.Questions.Select(q => new Question
            {
                Id = NewId(),
                Type = q.Type,
                Title = q.Title,
                Description = q.Description,
                Required = q.Required,
                TextCase = q.TextCase,
                BackgroundImage = q.BackgroundImage,
                Options = [.. q.Options.Select(text => new QuestionOption { Id = NewId(), Text = text })],
            })],
        };

        lock (_gate) _forms.Insert(0, form);
        return form;
    }

    public Template? ToTemplate(string formId)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            return new Template
            {
                Name = form.Title,
                Description = form.Description,
                BackgroundImage = form.BackgroundImage,
                BackgroundOverlay = form.BackgroundOverlay,
                BackgroundPerQuestion = form.BackgroundPerQuestion,
                IntroBackgroundImage = form.IntroBackgroundImage,
                CoverEnabled = form.CoverEnabled,
                CoverTitle = form.CoverTitle,
                CoverSubtitle = form.CoverSubtitle,
                CoverWelcome = form.CoverWelcome,
                ConfirmationMessage = form.ConfirmationMessage,
                IntroFields = [.. form.IntroFields.Select(i => new TemplateIntroField
                {
                    Type = i.Type, Label = i.Label, Placeholder = i.Placeholder, Required = i.Required, Enabled = i.Enabled,
                })],
                Questions = [.. form.Questions.Select(q => new TemplateQuestion
                {
                    Type = q.Type, Title = q.Title, Description = q.Description, Required = q.Required,
                    TextCase = q.TextCase, BackgroundImage = q.BackgroundImage,
                    Options = [.. q.Options.Select(o => o.Text)],
                })],
            };
        }
    }

    public Form? UpdateSettings(string formId, DateTimeOffset? closesAt, bool clearClosesAt, int? maxResponses, string? confirmationMessage)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            if (clearClosesAt) form.ClosesAt = null;
            else if (closesAt is not null) form.ClosesAt = closesAt;
            if (maxResponses is not null) form.MaxResponses = maxResponses > 0 ? maxResponses : null;
            if (confirmationMessage is not null) form.ConfirmationMessage = confirmationMessage;

            RefreshResponseCount(form);
            return form;
        }
    }

    public Form? UpdateForm(string id, string? title, string? description, string? status)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == id);
            if (form is null) return null;

            if (title is not null) form.Title = title;
            if (description is not null) form.Description = description;
            if (status is not null) form.Status = status;

            return form;
        }
    }

    public Form? SetCover(string formId, bool? enabled, string? title, string? subtitle, string? welcome)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            // Null es "no lo toques": el panel manda solo el campo que cambio.
            if (enabled.HasValue) form.CoverEnabled = enabled.Value;
            if (title is not null) form.CoverTitle = title;
            if (subtitle is not null) form.CoverSubtitle = subtitle;
            if (welcome is not null) form.CoverWelcome = welcome;

            return form;
        }
    }

    public string? SetBackground(string formId, string? imagePath, bool? overlay, bool? perQuestion)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var previous = form.BackgroundImage;

            if (imagePath is not null) form.BackgroundImage = imagePath;
            if (overlay.HasValue) form.BackgroundOverlay = overlay.Value;
            if (perQuestion.HasValue) form.BackgroundPerQuestion = perQuestion.Value;

            // Solo hay archivo huerfano si de verdad cambio la imagen.
            return imagePath is not null && previous != imagePath && !string.IsNullOrEmpty(previous)
                ? previous
                : null;
        }
    }

    public string? SetQuestionBackground(string formId, string questionId, string? imagePath)
    {
        lock (_gate)
        {
            var question = FindQuestion(formId, questionId);
            if (question is null) return null;

            var previous = question.BackgroundImage;
            if (imagePath is not null) question.BackgroundImage = imagePath;

            return imagePath is not null && previous != imagePath && !string.IsNullOrEmpty(previous)
                ? previous
                : null;
        }
    }

    public string? SetIntroBackground(string formId, string? imagePath)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var previous = form.IntroBackgroundImage;
            if (imagePath is not null) form.IntroBackgroundImage = imagePath;

            return imagePath is not null && previous != imagePath && !string.IsNullOrEmpty(previous)
                ? previous
                : null;
        }
    }

    public IReadOnlyList<string> GetImagePaths(string formId, bool includeTrashed = false)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId)
                ?? (includeTrashed ? _trashed.FirstOrDefault(f => f.Id == formId) : null);

            if (form is null) return [];

            return [.. form.Questions
                .Select(q => q.BackgroundImage)
                .Prepend(form.IntroBackgroundImage)
                .Prepend(form.BackgroundImage)
                .Where(path => !string.IsNullOrEmpty(path))];
        }
    }

    // --- Papelera ---

    public IReadOnlyList<Form> GetTrashedForms()
    {
        lock (_gate) return [.. _trashed];
    }

    public bool TrashForm(string id)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == id);
            if (form is null) return false;

            form.TrashedAt = DateTimeOffset.UtcNow;
            _forms.Remove(form);
            _trashed.Insert(0, form);
            return true;
        }
    }

    public bool RestoreForm(string id)
    {
        lock (_gate)
        {
            var form = _trashed.FirstOrDefault(f => f.Id == id);
            if (form is null) return false;

            form.TrashedAt = null;
            _trashed.Remove(form);
            _forms.Insert(0, form);
            return true;
        }
    }

    public bool PermanentDeleteForm(string id)
    {
        lock (_gate)
        {
            var form = _trashed.FirstOrDefault(f => f.Id == id);
            if (form is null) return false;

            _trashed.Remove(form);
            // Al borrar de verdad se van tambien sus respuestas.
            _responses.RemoveAll(r => r.FormId == id);
            return true;
        }
    }

    public IReadOnlyList<string> EmptyTrash()
    {
        lock (_gate)
        {
            var ids = _trashed.Select(f => f.Id).ToList();

            _trashed.Clear();
            _responses.RemoveAll(r => ids.Contains(r.FormId));
            return ids;
        }
    }

    // --- Preguntas ---

    public Question? AddQuestion(string formId, string type)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var question = new Question
            {
                Id = NewId(),
                Type = type,
                Title = string.Empty,
                Description = string.Empty,
                Required = false,
                Options = QuestionType.HasOptions(type)
                    ?
                    [
                        new QuestionOption { Id = NewId(), Text = "Opcion 1" },
                        new QuestionOption { Id = NewId(), Text = "Opcion 2" },
                    ]
                    : [],
            };

            form.Questions.Add(question);
            return question;
        }
    }

    public Question? DuplicateQuestion(string formId, string questionId)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var index = form.Questions.FindIndex(q => q.Id == questionId);
            if (index < 0) return null;

            var original = form.Questions[index];
            var copy = new Question
            {
                Id = NewId(),
                Type = original.Type,
                Title = original.Title,
                Description = original.Description,
                Required = original.Required,
                TextCase = original.TextCase,
                // BackgroundImage queda vacia a proposito: ver el porque en IFormStore.
                Options = original.Options
                    .Select(o => new QuestionOption { Id = NewId(), Text = o.Text })
                    .ToList(),
            };

            form.Questions.Insert(index + 1, copy);
            return copy;
        }
    }

    public Question? UpdateQuestion(string formId, string questionId, string? title, string? description, bool? required, string? textCase)
    {
        lock (_gate)
        {
            var question = FindQuestion(formId, questionId);
            if (question is null) return null;

            if (title is not null) question.Title = title;
            if (description is not null) question.Description = description;
            if (required.HasValue) question.Required = required.Value;
            if (textCase is not null) question.TextCase = textCase;

            return question;
        }
    }

    public bool DeleteQuestion(string formId, string questionId)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return false;

            var removed = form.Questions.RemoveAll(q => q.Id == questionId) > 0;
            if (removed)
            {
                // Las respuestas guardadas dejan de tener sentido para esa pregunta.
                foreach (var response in _responses.Where(r => r.FormId == formId))
                {
                    response.Answers.Remove(questionId);
                }
            }

            return removed;
        }
    }

    public bool ReorderQuestions(string formId, int fromIndex, int toIndex)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return false;

            var count = form.Questions.Count;
            if (fromIndex < 0 || fromIndex >= count || toIndex < 0 || toIndex >= count) return false;

            var moved = form.Questions[fromIndex];
            form.Questions.RemoveAt(fromIndex);
            form.Questions.Insert(toIndex, moved);
            return true;
        }
    }

    // --- Opciones ---

    public QuestionOption? AddOption(string formId, string questionId)
    {
        lock (_gate)
        {
            var question = FindQuestion(formId, questionId);
            if (question is null || !QuestionType.HasOptions(question.Type)) return null;

            var option = new QuestionOption { Id = NewId(), Text = string.Empty };
            question.Options.Add(option);
            return option;
        }
    }

    public bool UpdateOption(string formId, string questionId, string optionId, string? text)
    {
        lock (_gate)
        {
            var option = FindQuestion(formId, questionId)?.Options.FirstOrDefault(o => o.Id == optionId);
            if (option is null) return false;

            if (text is not null) option.Text = text;
            return true;
        }
    }

    public bool DeleteOption(string formId, string questionId, string optionId)
    {
        lock (_gate)
        {
            var question = FindQuestion(formId, questionId);
            if (question is null) return false;

            return question.Options.RemoveAll(o => o.Id == optionId) > 0;
        }
    }

    // --- Campos del respondedor ---

    private static readonly Dictionary<string, IntroField> IntroDefaults = new()
    {
        ["name"] = new IntroField { Type = "name", Label = "Nombre completo", Placeholder = "Escribe tu nombre", Required = true },
        ["phone"] = new IntroField { Type = "phone", Label = "Telefono", Placeholder = "Ej: 0412-1234567", Required = false },
        ["email"] = new IntroField { Type = "email", Label = "Correo electronico", Placeholder = "correo@ejemplo.com", Required = true },
        ["text"] = new IntroField { Type = "text", Label = "Nuevo campo", Placeholder = "Escribe aqui...", Required = false },
    };

    public IntroField? AddIntroField(string formId, string? type)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var key = type is not null && IntroDefaults.ContainsKey(type) ? type : "text";
            var preset = IntroDefaults[key];

            var field = new IntroField
            {
                Id = NewId(),
                Type = preset.Type,
                Label = preset.Label,
                Placeholder = preset.Placeholder,
                Required = preset.Required,
                Enabled = true,
            };

            form.IntroFields.Add(field);
            return field;
        }
    }

    public bool UpdateIntroField(string formId, string fieldId, string? label, string? placeholder, bool? required, bool? enabled)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            var field = form?.IntroFields.FirstOrDefault(f => f.Id == fieldId);
            if (field is null) return false;

            if (label is not null) field.Label = label;
            if (placeholder is not null) field.Placeholder = placeholder;
            if (required.HasValue) field.Required = required.Value;
            if (enabled.HasValue) field.Enabled = enabled.Value;

            return true;
        }
    }

    public bool RemoveIntroField(string formId, string fieldId)
    {
        lock (_gate)
        {
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return false;

            return form.IntroFields.RemoveAll(f => f.Id == fieldId) > 0;
        }
    }

    // --- Respuestas ---

    public IReadOnlyList<FormResponse> GetResponses(string formId)
    {
        lock (_gate)
        {
            return [.. _responses
                .Where(r => r.FormId == formId)
                .OrderByDescending(r => r.SubmittedAt)];
        }
    }

    public FormResponse? AddResponse(string formId, Dictionary<string, JsonNode?>? answers, Dictionary<string, string>? respondent)
    {
        lock (_gate)
        {
            // Solo se aceptan respuestas de formularios vivos; uno en la papelera no recibe.
            var form = _forms.FirstOrDefault(f => f.Id == formId);
            if (form is null) return null;

            var response = new FormResponse
            {
                Id = NewId(),
                FormId = formId,
                SubmittedAt = DateTimeOffset.UtcNow,
                Respondent = respondent ?? [],
                Answers = answers?.ToDictionary(kv => kv.Key, kv => NormalizeAnswer(form, kv.Key, kv.Value)) ?? [],
            };

            _responses.Insert(0, response);
            return response;
        }
    }

    public bool DeleteResponse(string formId, string responseId)
    {
        lock (_gate) return _responses.RemoveAll(r => r.Id == responseId && r.FormId == formId) > 0;
    }

    /// <summary>
    /// Aplica el formato de texto elegido para la pregunta. El navegador ya lo
    /// hace mientras se escribe, pero se repite aqui porque es lo unico que
    /// garantiza el formato venga la respuesta de donde venga.
    /// </summary>
    private static JsonNode? NormalizeAnswer(Form form, string questionId, JsonNode? value)
    {
        // Se clona siempre: el JsonNode que llega en la peticion pertenece al
        // arbol del cuerpo y no se puede reutilizar una vez cerrado.
        var clone = value?.DeepClone();
        if (clone is null) return null;

        var question = form.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question is null) return clone;
        if (!QuestionType.IsText(question.Type)) return clone;
        if (question.TextCase == QuestionTextCase.Normal) return clone;

        // Las respuestas de texto son cadenas; las de opciones son ids y no se
        // tocan aunque la pregunta arrastrase un formato de cuando era de texto.
        if (clone.GetValueKind() != JsonValueKind.String) return clone;

        var text = clone.GetValue<string>();
        return JsonValue.Create(question.TextCase == QuestionTextCase.Upper
            ? text.ToUpperInvariant()
            : text.ToLowerInvariant());
    }

    // --- Plantillas ---

    public IReadOnlyList<Template> GetTemplates()
    {
        lock (_gate) return [.. _templates];
    }

    // --- Ayudantes ---

    private Question? FindQuestion(string formId, string questionId) =>
        _forms.FirstOrDefault(f => f.Id == formId)?.Questions.FirstOrDefault(q => q.Id == questionId);
}
