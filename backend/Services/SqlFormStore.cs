using System.Text.Json;
using System.Text.Json.Nodes;
using IescoForms.Api.Data;
using IescoForms.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IescoForms.Api.Services;

/// <summary>
/// Formularios, preguntas y respuestas en SQL Server. Reemplaza a
/// <see cref="InMemoryFormStore"/> respetando su comportamiento visible: los
/// controladores y el frontend no notan el cambio.
///
/// Tres diferencias con el almacen en memoria que conviene tener presentes:
///
/// 1. El orden ya no es el de una lista, sino la columna Position. Al insertar,
///    mover o borrar hay que renumerar para que no queden huecos.
/// 2. Borrar una pregunta, opcion o campo es marcar DeletedAt, no quitar la
///    fila. El filtro global del DbContext los esconde de todas las consultas.
/// 3. La papelera no es otra lista: es TrashedAt distinto de NULL.
/// </summary>
public class SqlFormStore(IescoFormsDbContext db) : IFormStore
{
    private static string NewId() => Guid.NewGuid().ToString("N")[..8];

    // ---------------------------------------------------------------- lecturas

    /// <summary>
    /// Trae el formulario con sus preguntas, opciones y campos ya ordenados.
    /// Se usa en todas las lecturas para no repetir los Include.
    /// </summary>
    private IQueryable<FormRow> FormsConTodo() => db.Forms
        .Include(f => f.Questions.OrderBy(q => q.Position))
            .ThenInclude(q => q.Options.OrderBy(o => o.Position))
        .Include(f => f.IntroFields.OrderBy(i => i.Position));

    public IReadOnlyList<Form> GetForms()
    {
        var filas = FormsConTodo()
            .AsNoTracking()
            .Where(f => f.TrashedAt == null)
            .OrderByDescending(f => f.CreatedAt)
            .ToList();

        return MapearConContadores(filas);
    }

    public IReadOnlyList<Form> GetTrashedForms()
    {
        var filas = FormsConTodo()
            .AsNoTracking()
            .Where(f => f.TrashedAt != null)
            .OrderByDescending(f => f.TrashedAt)
            .ToList();

        return MapearConContadores(filas);
    }

    public Form? GetForm(string id)
    {
        var fila = FormsConTodo().AsNoTracking().FirstOrDefault(f => f.Id == id);
        if (fila is null) return null;

        var modelo = ToModel(fila);
        modelo.ResponseCount = db.Responses.Count(r => r.FormId == id);
        return modelo;
    }

    /// <summary>
    /// ResponseCount es derivado: no se guarda. Se resuelve con una sola
    /// consulta agrupada en vez de una por formulario.
    /// </summary>
    private List<Form> MapearConContadores(List<FormRow> filas)
    {
        var ids = filas.Select(f => f.Id).ToList();

        var conteos = db.Responses
            .Where(r => ids.Contains(r.FormId))
            .GroupBy(r => r.FormId)
            .Select(g => new { FormId = g.Key, Total = g.Count() })
            .ToDictionary(x => x.FormId, x => x.Total);

        return [.. filas.Select(fila =>
        {
            var modelo = ToModel(fila);
            modelo.ResponseCount = conteos.GetValueOrDefault(fila.Id);
            return modelo;
        })];
    }

    // ------------------------------------------------------------ formularios

    public Form CreateForm(string? title, string? description, string ownerId)
    {
        var fila = new FormRow
        {
            Id = NewId(),
            Title = string.IsNullOrWhiteSpace(title) ? "Formulario sin titulo" : title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Status = FormStatus.Draft,
            // Cadena vacia significa "sin dueno"; en la tabla eso es NULL.
            OwnerId = string.IsNullOrWhiteSpace(ownerId) ? null : ownerId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Forms.Add(fila);
        db.SaveChanges();

        return ToModel(fila);
    }

    public Form? CreateFormFromTemplate(string templateId, string ownerId)
    {
        var plantilla = db.Templates
            .AsNoTracking()
            .Include(t => t.Questions.OrderBy(q => q.Position))
                .ThenInclude(q => q.Options.OrderBy(o => o.Position))
            .FirstOrDefault(t => t.Id == templateId);

        if (plantilla is null) return null;

        var fila = new FormRow
        {
            Id = NewId(),
            Title = plantilla.Name,
            Description = plantilla.Description,
            Status = FormStatus.Draft,
            OwnerId = string.IsNullOrWhiteSpace(ownerId) ? null : ownerId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var posicion = 0;
        foreach (var pregunta in plantilla.Questions)
        {
            var nueva = new QuestionRow
            {
                Id = NewId(),
                FormId = fila.Id,
                Position = posicion++,
                Type = pregunta.Type,
                Title = pregunta.Title,
                Description = string.Empty,
                Required = pregunta.Required,
                TextCase = QuestionTextCase.Normal,
            };

            var posicionOpcion = 0;
            foreach (var opcion in pregunta.Options)
            {
                nueva.Options.Add(new QuestionOptionRow
                {
                    Id = NewId(),
                    QuestionId = nueva.Id,
                    Position = posicionOpcion++,
                    Text = opcion.Text,
                });
            }

            fila.Questions.Add(nueva);
        }

        db.Forms.Add(fila);
        db.SaveChanges();

        return ToModel(fila);
    }

    public Form? UpdateForm(string id, string? title, string? description, string? status)
    {
        var fila = db.Forms.FirstOrDefault(f => f.Id == id);
        if (fila is null) return null;

        if (title is not null) fila.Title = title;
        if (description is not null) fila.Description = description;
        if (status is not null) fila.Status = status;

        db.SaveChanges();
        return GetForm(id);
    }

    // --------------------------------------------------------------- imagenes

    public string? SetBackground(string formId, string? imagePath, bool? overlay, bool? perQuestion)
    {
        var fila = db.Forms.FirstOrDefault(f => f.Id == formId);
        if (fila is null) return null;

        var anterior = fila.BackgroundImage;

        if (imagePath is not null) fila.BackgroundImage = imagePath;
        if (overlay.HasValue) fila.BackgroundOverlay = overlay.Value;
        if (perQuestion.HasValue) fila.BackgroundPerQuestion = perQuestion.Value;

        db.SaveChanges();

        return HuerfanaSiCambio(anterior, imagePath);
    }

    public string? SetQuestionBackground(string formId, string questionId, string? imagePath)
    {
        var fila = db.Questions.FirstOrDefault(q => q.Id == questionId && q.FormId == formId);
        if (fila is null) return null;

        var anterior = fila.BackgroundImage;
        if (imagePath is not null) fila.BackgroundImage = imagePath;

        db.SaveChanges();

        return HuerfanaSiCambio(anterior, imagePath);
    }

    public string? SetIntroBackground(string formId, string? imagePath)
    {
        var fila = db.Forms.FirstOrDefault(f => f.Id == formId);
        if (fila is null) return null;

        var anterior = fila.IntroBackgroundImage;
        if (imagePath is not null) fila.IntroBackgroundImage = imagePath;

        db.SaveChanges();

        return HuerfanaSiCambio(anterior, imagePath);
    }

    /// <summary>
    /// Solo queda un archivo sin usar si de verdad se reemplazo la imagen.
    /// Quien llama borra del disco lo que se devuelva aqui.
    /// </summary>
    private static string? HuerfanaSiCambio(string anterior, string? nueva) =>
        nueva is not null && anterior != nueva && !string.IsNullOrEmpty(anterior) ? anterior : null;

    public IReadOnlyList<string> GetImagePaths(string formId, bool includeTrashed = false)
    {
        var fila = db.Forms
            .AsNoTracking()
            .Include(f => f.Questions)
            .FirstOrDefault(f => f.Id == formId && (includeTrashed || f.TrashedAt == null));

        if (fila is null) return [];

        return [.. fila.Questions
            .Select(q => q.BackgroundImage)
            .Prepend(fila.IntroBackgroundImage)
            .Prepend(fila.BackgroundImage)
            .Where(ruta => !string.IsNullOrEmpty(ruta))];
    }

    // --------------------------------------------------------------- papelera

    public bool TrashForm(string id)
    {
        var fila = db.Forms.FirstOrDefault(f => f.Id == id && f.TrashedAt == null);
        if (fila is null) return false;

        fila.TrashedAt = DateTimeOffset.UtcNow;
        db.SaveChanges();
        return true;
    }

    public bool RestoreForm(string id)
    {
        var fila = db.Forms.FirstOrDefault(f => f.Id == id && f.TrashedAt != null);
        if (fila is null) return false;

        fila.TrashedAt = null;
        db.SaveChanges();
        return true;
    }

    public bool PermanentDeleteForm(string id)
    {
        if (!db.Forms.Any(f => f.Id == id && f.TrashedAt != null)) return false;

        BorrarDeVerdad([id]);
        return true;
    }

    public IReadOnlyList<string> EmptyTrash()
    {
        var ids = db.Forms.Where(f => f.TrashedAt != null).Select(f => f.Id).ToList();
        if (ids.Count == 0) return ids;

        BorrarDeVerdad(ids);
        return ids;
    }

    /// <summary>
    /// Borrado fisico, en orden explicito de dependencias.
    ///
    /// No se delega en las cascadas: ResponseAnswers apunta a Questions sin
    /// cascada (SQL Server no admite dos caminos hacia Forms), asi que dejar
    /// que el motor borre las preguntas fallaria mientras existan respuestas.
    /// Los avisos tambien van aqui porque el controlador los limpia despues de
    /// llamar a este metodo, y para entonces la clave foranea ya habria saltado.
    ///
    /// Todo dentro de una transaccion: o se va el formulario entero, o nada.
    /// </summary>
    private void BorrarDeVerdad(List<string> formIds)
    {
        using var tx = db.Database.BeginTransaction();

        var respuestaIds = db.Responses
            .Where(r => formIds.Contains(r.FormId))
            .Select(r => r.Id)
            .ToList();

        var respuestaDetalleIds = db.ResponseAnswers
            .Where(a => respuestaIds.Contains(a.ResponseId))
            .Select(a => a.Id)
            .ToList();

        // IgnoreQueryFilters: aqui hay que barrer tambien lo borrado logicamente.
        var preguntaIds = db.Questions
            .IgnoreQueryFilters()
            .Where(q => formIds.Contains(q.FormId))
            .Select(q => q.Id)
            .ToList();

        db.ResponseAnswerOptions.Where(o => respuestaDetalleIds.Contains(o.AnswerId)).ExecuteDelete();
        db.ResponseAnswers.Where(a => respuestaIds.Contains(a.ResponseId)).ExecuteDelete();
        db.ResponseRespondentValues.Where(v => respuestaIds.Contains(v.ResponseId)).ExecuteDelete();
        db.Responses.Where(r => formIds.Contains(r.FormId)).ExecuteDelete();

        db.QuestionOptions.IgnoreQueryFilters().Where(o => preguntaIds.Contains(o.QuestionId)).ExecuteDelete();
        db.Questions.IgnoreQueryFilters().Where(q => formIds.Contains(q.FormId)).ExecuteDelete();
        db.IntroFields.IgnoreQueryFilters().Where(i => formIds.Contains(i.FormId)).ExecuteDelete();

        db.Notifications.Where(n => formIds.Contains(n.FormId)).ExecuteDelete();
        db.Forms.Where(f => formIds.Contains(f.Id)).ExecuteDelete();

        tx.Commit();
    }

    // --------------------------------------------------------------- preguntas

    public Question? AddQuestion(string formId, string type)
    {
        if (!db.Forms.Any(f => f.Id == formId)) return null;

        var fila = new QuestionRow
        {
            Id = NewId(),
            FormId = formId,
            Position = SiguientePosicionPregunta(formId),
            Type = type,
            TextCase = QuestionTextCase.Normal,
        };

        if (QuestionType.HasOptions(type))
        {
            fila.Options.Add(new QuestionOptionRow { Id = NewId(), QuestionId = fila.Id, Position = 0, Text = "Opcion 1" });
            fila.Options.Add(new QuestionOptionRow { Id = NewId(), QuestionId = fila.Id, Position = 1, Text = "Opcion 2" });
        }

        db.Questions.Add(fila);
        db.SaveChanges();

        return ToModel(fila);
    }

    public Question? DuplicateQuestion(string formId, string questionId)
    {
        var original = db.Questions
            .AsNoTracking()
            .Include(q => q.Options.OrderBy(o => o.Position))
            .FirstOrDefault(q => q.Id == questionId && q.FormId == formId);

        if (original is null) return null;

        // La copia va justo detras de la original, asi que todo lo que venia
        // despues corre un lugar.
        var destino = original.Position + 1;

        foreach (var posterior in db.Questions.Where(q => q.FormId == formId && q.Position >= destino))
        {
            posterior.Position++;
        }

        var copia = new QuestionRow
        {
            Id = NewId(),
            FormId = formId,
            Position = destino,
            Type = original.Type,
            Title = original.Title,
            Description = original.Description,
            Required = original.Required,
            TextCase = original.TextCase,
            // BackgroundImage no se copia: seria el mismo archivo en disco y al
            // borrar una copia la otra quedaria apuntando a una ruta muerta.
        };

        var posicion = 0;
        foreach (var opcion in original.Options)
        {
            copia.Options.Add(new QuestionOptionRow
            {
                Id = NewId(),
                QuestionId = copia.Id,
                Position = posicion++,
                Text = opcion.Text,
            });
        }

        db.Questions.Add(copia);
        db.SaveChanges();

        return ToModel(copia);
    }

    public Question? UpdateQuestion(string formId, string questionId, string? title, string? description, bool? required, string? textCase)
    {
        var fila = db.Questions
            .Include(q => q.Options.OrderBy(o => o.Position))
            .FirstOrDefault(q => q.Id == questionId && q.FormId == formId);

        if (fila is null) return null;

        if (title is not null) fila.Title = title;
        if (description is not null) fila.Description = description;
        if (required.HasValue) fila.Required = required.Value;
        if (textCase is not null) fila.TextCase = textCase;

        db.SaveChanges();
        return ToModel(fila);
    }

    public bool DeleteQuestion(string formId, string questionId)
    {
        var fila = db.Questions.FirstOrDefault(q => q.Id == questionId && q.FormId == formId);
        if (fila is null) return false;

        // Borrado logico: puede haber respuestas apuntando a esta pregunta.
        var ahora = DateTimeOffset.UtcNow;
        fila.DeletedAt = ahora;

        foreach (var opcion in db.QuestionOptions.Where(o => o.QuestionId == questionId))
        {
            opcion.DeletedAt = ahora;
        }

        db.SaveChanges();

        // Sin renumerar quedaria un hueco y el siguiente AddQuestion reutilizaria
        // una posicion ya usada.
        RenumerarPreguntas(formId);
        return true;
    }

    public bool ReorderQuestions(string formId, int fromIndex, int toIndex)
    {
        var preguntas = db.Questions
            .Where(q => q.FormId == formId)
            .OrderBy(q => q.Position)
            .ToList();

        if (fromIndex < 0 || fromIndex >= preguntas.Count) return false;
        if (toIndex < 0 || toIndex >= preguntas.Count) return false;

        var movida = preguntas[fromIndex];
        preguntas.RemoveAt(fromIndex);
        preguntas.Insert(toIndex, movida);

        for (var i = 0; i < preguntas.Count; i++) preguntas[i].Position = i;

        db.SaveChanges();
        return true;
    }

    private int SiguientePosicionPregunta(string formId) =>
        db.Questions.Where(q => q.FormId == formId).Select(q => (int?)q.Position).Max() + 1 ?? 0;

    private void RenumerarPreguntas(string formId)
    {
        var preguntas = db.Questions
            .Where(q => q.FormId == formId)
            .OrderBy(q => q.Position)
            .ToList();

        for (var i = 0; i < preguntas.Count; i++) preguntas[i].Position = i;
        db.SaveChanges();
    }

    // ---------------------------------------------------------------- opciones

    public QuestionOption? AddOption(string formId, string questionId)
    {
        if (!db.Questions.Any(q => q.Id == questionId && q.FormId == formId)) return null;

        var siguiente = db.QuestionOptions
            .Where(o => o.QuestionId == questionId)
            .Select(o => (int?)o.Position).Max() + 1 ?? 0;

        var fila = new QuestionOptionRow
        {
            Id = NewId(),
            QuestionId = questionId,
            Position = siguiente,
            Text = $"Opcion {siguiente + 1}",
        };

        db.QuestionOptions.Add(fila);
        db.SaveChanges();

        return new QuestionOption { Id = fila.Id, Text = fila.Text };
    }

    public bool UpdateOption(string formId, string questionId, string optionId, string? text)
    {
        var fila = db.QuestionOptions.FirstOrDefault(o => o.Id == optionId && o.QuestionId == questionId);
        if (fila is null) return false;
        if (!db.Questions.Any(q => q.Id == questionId && q.FormId == formId)) return false;

        if (text is not null) fila.Text = text;

        db.SaveChanges();
        return true;
    }

    public bool DeleteOption(string formId, string questionId, string optionId)
    {
        var fila = db.QuestionOptions.FirstOrDefault(o => o.Id == optionId && o.QuestionId == questionId);
        if (fila is null) return false;
        if (!db.Questions.Any(q => q.Id == questionId && q.FormId == formId)) return false;

        // Logico igual que las preguntas: puede estar elegida en una respuesta.
        fila.DeletedAt = DateTimeOffset.UtcNow;
        db.SaveChanges();

        var restantes = db.QuestionOptions
            .Where(o => o.QuestionId == questionId)
            .OrderBy(o => o.Position)
            .ToList();

        for (var i = 0; i < restantes.Count; i++) restantes[i].Position = i;
        db.SaveChanges();

        return true;
    }

    // --------------------------------------------------- campos del usuario

    private static readonly Dictionary<string, IntroField> IntroDefaults = new()
    {
        ["name"] = new IntroField { Type = "name", Label = "Nombre completo", Placeholder = "Escribe tu nombre", Required = true },
        ["phone"] = new IntroField { Type = "phone", Label = "Telefono", Placeholder = "Ej: 0412-1234567", Required = false },
        ["email"] = new IntroField { Type = "email", Label = "Correo electronico", Placeholder = "correo@ejemplo.com", Required = true },
        ["text"] = new IntroField { Type = "text", Label = "Nuevo campo", Placeholder = "Escribe aqui...", Required = false },
    };

    public IntroField? AddIntroField(string formId, string? type)
    {
        if (!db.Forms.Any(f => f.Id == formId)) return null;

        var clave = type is not null && IntroDefaults.ContainsKey(type) ? type : "text";
        var preset = IntroDefaults[clave];

        var siguiente = db.IntroFields
            .Where(i => i.FormId == formId)
            .Select(i => (int?)i.Position).Max() + 1 ?? 0;

        var fila = new IntroFieldRow
        {
            Id = NewId(),
            FormId = formId,
            Position = siguiente,
            Type = preset.Type,
            Label = preset.Label,
            Placeholder = preset.Placeholder,
            Required = preset.Required,
            Enabled = true,
        };

        db.IntroFields.Add(fila);
        db.SaveChanges();

        return ToModel(fila);
    }

    public bool UpdateIntroField(string formId, string fieldId, string? label, string? placeholder, bool? required, bool? enabled)
    {
        var fila = db.IntroFields.FirstOrDefault(i => i.Id == fieldId && i.FormId == formId);
        if (fila is null) return false;

        if (label is not null) fila.Label = label;
        if (placeholder is not null) fila.Placeholder = placeholder;
        if (required.HasValue) fila.Required = required.Value;
        if (enabled.HasValue) fila.Enabled = enabled.Value;

        db.SaveChanges();
        return true;
    }

    public bool RemoveIntroField(string formId, string fieldId)
    {
        var fila = db.IntroFields.FirstOrDefault(i => i.Id == fieldId && i.FormId == formId);
        if (fila is null) return false;

        // Logico: las respuestas ya enviadas guardan el valor de este campo.
        fila.DeletedAt = DateTimeOffset.UtcNow;
        db.SaveChanges();

        var restantes = db.IntroFields
            .Where(i => i.FormId == formId)
            .OrderBy(i => i.Position)
            .ToList();

        for (var i = 0; i < restantes.Count; i++) restantes[i].Position = i;
        db.SaveChanges();

        return true;
    }

    // -------------------------------------------------------------- respuestas

    public IReadOnlyList<FormResponse> GetResponses(string formId)
    {
        var filas = db.Responses
            .AsNoTracking()
            .Include(r => r.Answers).ThenInclude(a => a.SelectedOptions)
            .Include(r => r.RespondentValues)
            .Where(r => r.FormId == formId)
            .OrderByDescending(r => r.SubmittedAt)
            .ToList();

        // Para saber si una respuesta de texto o de opciones hay que mirar el
        // tipo de la pregunta, incluso si despues se borro logicamente.
        var tipos = db.Questions
            .IgnoreQueryFilters()
            .Where(q => q.FormId == formId)
            .ToDictionary(q => q.Id, q => q.Type);

        return [.. filas.Select(fila => ToModel(fila, tipos))];
    }

    public FormResponse? AddResponse(string formId, Dictionary<string, JsonNode?>? answers, Dictionary<string, string>? respondent)
    {
        // Un formulario en la papelera no recibe respuestas.
        var form = db.Forms
            .AsNoTracking()
            .Include(f => f.Questions)
            .FirstOrDefault(f => f.Id == formId && f.TrashedAt == null);

        if (form is null) return null;

        var fila = new ResponseRow
        {
            Id = NewId(),
            FormId = formId,
            SubmittedAt = DateTimeOffset.UtcNow,
        };

        // Solo se guardan los datos de campos que existen: la tabla tiene una
        // clave foranea contra IntroFields y cualquier otra clave la violaria.
        var camposValidos = db.IntroFields
            .IgnoreQueryFilters()
            .Where(i => i.FormId == formId)
            .Select(i => i.Id)
            .ToHashSet();

        foreach (var (campoId, valor) in respondent ?? [])
        {
            if (!camposValidos.Contains(campoId)) continue;

            fila.RespondentValues.Add(new ResponseRespondentValueRow
            {
                ResponseId = fila.Id,
                IntroFieldId = campoId,
                Value = valor ?? string.Empty,
            });
        }

        var opcionesValidas = db.QuestionOptions
            .IgnoreQueryFilters()
            .Where(o => db.Questions.IgnoreQueryFilters()
                .Any(q => q.Id == o.QuestionId && q.FormId == formId))
            .Select(o => o.Id)
            .ToHashSet();

        foreach (var (preguntaId, valor) in answers ?? [])
        {
            var pregunta = form.Questions.FirstOrDefault(q => q.Id == preguntaId);
            if (pregunta is null || valor is null) continue;

            var detalle = new ResponseAnswerRow
            {
                Id = NewId(),
                ResponseId = fila.Id,
                QuestionId = preguntaId,
            };

            if (QuestionType.IsText(pregunta.Type))
            {
                detalle.TextValue = AplicarFormato(TextoDe(valor), pregunta.TextCase);
            }
            else
            {
                foreach (var opcionId in OpcionesDe(valor))
                {
                    if (!opcionesValidas.Contains(opcionId)) continue;

                    detalle.SelectedOptions.Add(new ResponseAnswerOptionRow
                    {
                        AnswerId = detalle.Id,
                        OptionId = opcionId,
                    });
                }
            }

            fila.Answers.Add(detalle);
        }

        db.Responses.Add(fila);
        db.SaveChanges();

        var tipos = form.Questions.ToDictionary(q => q.Id, q => q.Type);
        return ToModel(fila, tipos);
    }

    private static string TextoDe(JsonNode valor) =>
        valor.GetValueKind() == JsonValueKind.String ? valor.GetValue<string>() : valor.ToString();

    /// <summary>
    /// Opcion unica llega como una cadena con el id; multiple, como un arreglo.
    /// </summary>
    private static IEnumerable<string> OpcionesDe(JsonNode valor)
    {
        if (valor is JsonArray arreglo)
        {
            return arreglo
                .Where(n => n is not null && n.GetValueKind() == JsonValueKind.String)
                .Select(n => n!.GetValue<string>());
        }

        return valor.GetValueKind() == JsonValueKind.String ? [valor.GetValue<string>()] : [];
    }

    /// <summary>
    /// El formato elegido para la pregunta manda sobre el teclado. El navegador
    /// ya lo aplica al escribir; repetirlo aqui es lo unico que lo garantiza
    /// venga la respuesta de donde venga.
    /// </summary>
    private static string AplicarFormato(string texto, string textCase) => textCase switch
    {
        QuestionTextCase.Upper => texto.ToUpperInvariant(),
        QuestionTextCase.Lower => texto.ToLowerInvariant(),
        _ => texto,
    };

    // -------------------------------------------------------------- plantillas

    public IReadOnlyList<Template> GetTemplates()
    {
        var filas = db.Templates
            .AsNoTracking()
            .Include(t => t.Questions.OrderBy(q => q.Position))
                .ThenInclude(q => q.Options.OrderBy(o => o.Position))
            .ToList();

        return [.. filas.Select(t => new Template
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            Category = t.Category,
            Questions = [.. t.Questions.Select(q => new TemplateQuestion
            {
                Type = q.Type,
                Title = q.Title,
                Required = q.Required,
                Options = [.. q.Options.Select(o => o.Text)],
            })],
        })];
    }

    // ------------------------------------------------------------------ mapeo

    private static Form ToModel(FormRow fila) => new()
    {
        Id = fila.Id,
        Title = fila.Title,
        Description = fila.Description,
        Status = fila.Status,
        // NULL en la tabla es "sin dueno"; el frontend espera cadena vacia.
        OwnerId = fila.OwnerId ?? string.Empty,
        CreatedAt = fila.CreatedAt.ToString("yyyy-MM-dd"),
        BackgroundImage = fila.BackgroundImage,
        BackgroundOverlay = fila.BackgroundOverlay,
        BackgroundPerQuestion = fila.BackgroundPerQuestion,
        IntroBackgroundImage = fila.IntroBackgroundImage,
        TrashedAt = fila.TrashedAt,
        IntroFields = [.. fila.IntroFields.OrderBy(i => i.Position).Select(ToModel)],
        Questions = [.. fila.Questions.OrderBy(q => q.Position).Select(ToModel)],
    };

    private static Question ToModel(QuestionRow fila) => new()
    {
        Id = fila.Id,
        Type = fila.Type,
        Title = fila.Title,
        Description = fila.Description,
        Required = fila.Required,
        TextCase = fila.TextCase,
        BackgroundImage = fila.BackgroundImage,
        Options = [.. fila.Options.OrderBy(o => o.Position)
            .Select(o => new QuestionOption { Id = o.Id, Text = o.Text })],
    };

    private static IntroField ToModel(IntroFieldRow fila) => new()
    {
        Id = fila.Id,
        Type = fila.Type,
        Label = fila.Label,
        Placeholder = fila.Placeholder,
        Required = fila.Required,
        Enabled = fila.Enabled,
    };

    /// <summary>
    /// Rearma el diccionario que espera el frontend: cadena para texto y para
    /// opcion unica, arreglo de ids para opcion multiple.
    /// </summary>
    private static FormResponse ToModel(ResponseRow fila, Dictionary<string, string> tiposPorPregunta)
    {
        var respuesta = new FormResponse
        {
            Id = fila.Id,
            FormId = fila.FormId,
            SubmittedAt = fila.SubmittedAt,
            Respondent = fila.RespondentValues.ToDictionary(v => v.IntroFieldId, v => v.Value),
        };

        foreach (var detalle in fila.Answers)
        {
            var tipo = tiposPorPregunta.GetValueOrDefault(detalle.QuestionId, QuestionType.ShortText);

            respuesta.Answers[detalle.QuestionId] = tipo switch
            {
                QuestionType.MultipleChoice =>
                    new JsonArray([.. detalle.SelectedOptions.Select(o => (JsonNode?)JsonValue.Create(o.OptionId))]),

                QuestionType.SingleChoice =>
                    JsonValue.Create(detalle.SelectedOptions.FirstOrDefault()?.OptionId ?? string.Empty),

                _ => JsonValue.Create(detalle.TextValue ?? string.Empty),
            };
        }

        return respuesta;
    }
}
