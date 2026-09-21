namespace IescoForms.Api.Data;

/// <summary>
/// Filas tal como viven en SQL Server.
///
/// Son distintas de las clases de <c>Models</c> a proposito. Aquellas son el
/// contrato que ve el frontend y no deben cargar con cosas de la base (Position,
/// DeletedAt, RowVersion). Estas son lo contrario: copian la tabla exactamente.
/// El almacen traduce de unas a otras, y por eso se pudo cambiar el motor sin
/// tocar ni un archivo del frontend.
///
/// El sufijo Row es lo unico que las separa por nombre de sus gemelas de Models.
/// </summary>
public class UserRow
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Solicitud pendiente de "Olvide mi contrasena", o null.</summary>
    public DateTimeOffset? PasswordResetRequestedAt { get; set; }
}

public class FormRow
{
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// NULL es "sin dueno". En Modelsviaja como cadena vacia, que es lo que
    /// espera el frontend; la conversion la hace el almacen.
    /// </summary>
    public string? OwnerId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Guarda fecha y hora aunque Models solo exponga 'yyyy-MM-dd': sin la hora
    /// los formularios creados el mismo dia no tendrian un orden estable.
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? TrashedAt { get; set; }

    public string BackgroundImage { get; set; } = string.Empty;
    public bool BackgroundOverlay { get; set; } = true;
    public bool BackgroundPerQuestion { get; set; }
    public string IntroBackgroundImage { get; set; } = string.Empty;

    /// <summary>Visible para todos en Compartidos &gt; Publicos.</summary>
    public bool IsPublic { get; set; }

    /// <summary>Control de concurrencia. Lo maneja SQL Server, nunca se asigna.</summary>
    public byte[]? RowVersion { get; set; }

    public List<QuestionRow> Questions { get; set; } = [];
    public List<IntroFieldRow> IntroFields { get; set; } = [];
}

public class QuestionRow
{
    public string Id { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;

    /// <summary>Reemplaza al orden de la lista que usaba el almacen en memoria.</summary>
    public int Position { get; set; }

    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Required { get; set; }
    public string TextCase { get; set; } = string.Empty;
    public string BackgroundImage { get; set; } = string.Empty;

    /// <summary>
    /// Borrado logico. Una pregunta con respuestas no se puede borrar de verdad:
    /// ResponseAnswers la referencia y SQL Server no permite cascada por ese
    /// camino. El filtro global del contexto la esconde de todas las consultas.
    /// </summary>
    public DateTimeOffset? DeletedAt { get; set; }

    public byte[]? RowVersion { get; set; }

    public FormRow? Form { get; set; }
    public List<QuestionOptionRow> Options { get; set; } = [];
}

public class QuestionOptionRow
{
    public string Id { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset? DeletedAt { get; set; }

    public QuestionRow? Question { get; set; }
}

public class IntroFieldRow
{
    public string Id { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Placeholder { get; set; } = string.Empty;
    public bool Required { get; set; }
    public bool Enabled { get; set; } = true;
    public DateTimeOffset? DeletedAt { get; set; }

    public FormRow? Form { get; set; }
}

public class ResponseRow
{
    public string Id { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }

    public List<ResponseAnswerRow> Answers { get; set; } = [];
    public List<ResponseRespondentValueRow> RespondentValues { get; set; } = [];
}

public class ResponseRespondentValueRow
{
    public string ResponseId { get; set; } = string.Empty;
    public string IntroFieldId { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ResponseAnswerRow
{
    public string Id { get; set; } = string.Empty;
    public string ResponseId { get; set; } = string.Empty;
    public string QuestionId { get; set; } = string.Empty;

    /// <summary>
    /// Solo en preguntas de texto. En las de opciones queda NULL y lo elegido
    /// vive en <see cref="SelectedOptions"/>.
    /// </summary>
    public string? TextValue { get; set; }

    public List<ResponseAnswerOptionRow> SelectedOptions { get; set; } = [];
}

public class ResponseAnswerOptionRow
{
    public string AnswerId { get; set; } = string.Empty;
    public string OptionId { get; set; } = string.Empty;
}

public class NotificationRow
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;

    /// <summary>El titulo del momento, no el actual. Ver Models.Notification.</summary>
    public string FormTitle { get; set; } = string.Empty;

    public int Count { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}

public class TemplateRow
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public List<TemplateQuestionRow> Questions { get; set; } = [];
}

public class TemplateQuestionRow
{
    public string Id { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool Required { get; set; }

    public List<TemplateQuestionOptionRow> Options { get; set; } = [];
}

public class TemplateQuestionOptionRow
{
    public string Id { get; set; } = string.Empty;
    public string TemplateQuestionId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Un formulario compartido con un usuario. La clave es el par (FormId, UserId):
/// compartir otra vez con la misma persona cambia el permiso, no duplica.
/// </summary>
public class FormShareRow
{
    public string FormId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    /// <summary>edit o view. Ver Models.SharePermission.</summary>
    public string Permission { get; set; } = string.Empty;

    public string? SharedBy { get; set; }
    public DateTimeOffset SharedAt { get; set; }
}

/// <summary>Enlace para responder un formulario sin sesion, hasta que vence.</summary>
public class FormLinkRow
{
    public string Id { get; set; } = string.Empty;
    public string FormId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
