namespace IescoForms.Api.Models;

/// <summary>
/// Estados posibles de un formulario. Coinciden con los textos que muestra el
/// frontend, por eso se serializan tal cual como cadena.
/// </summary>
public static class FormStatus
{
    public const string Draft = "Borrador";
    public const string Active = "Activo";
}

/// <summary>Permisos al compartir un formulario con otro usuario.</summary>
public static class SharePermission
{
    /// <summary>Puede cambiar el formulario y publicarlo.</summary>
    public const string Edit = "edit";

    /// <summary>Solo vista previa y resultados.</summary>
    public const string View = "view";

    public static bool IsValid(string? value) => value is Edit or View;
}

/// <summary>
/// Lo que el usuario conectado puede hacer con un formulario. Va de menos a mas:
/// cada nivel incluye lo que permite el anterior.
/// </summary>
public enum FormAccessLevel
{
    None = 0,
    View = 1,
    Edit = 2,

    /// <summary>Dueno, formulario sin dueno o administrador: ademas puede compartir y borrar.</summary>
    Owner = 3,
}

/// <summary>Tipos de pregunta soportados por el editor.</summary>
public static class QuestionType
{
    public const string ShortText = "short_text";
    public const string LongText = "long_text";
    public const string SingleChoice = "single_choice";
    public const string MultipleChoice = "multiple_choice";

    /// <summary>Opcion unica en una lista desplegable. Se guarda igual que SingleChoice.</summary>
    public const string Dropdown = "dropdown";

    /// <summary>Si / No. Nace con esas dos opciones y se guarda igual que SingleChoice.</summary>
    public const string YesNo = "yes_no";

    /// <summary>Estrellas de 1 a <see cref="Question.ScaleMax"/>.</summary>
    public const string Rating = "rating";

    /// <summary>Net Promoter Score: de 0 a 10.</summary>
    public const string Nps = "nps";

    public const string Number = "number";

    /// <summary>Fecha en formato yyyy-MM-dd.</summary>
    public const string Date = "date";

    public static bool IsValid(string? type) =>
        type is ShortText or LongText or SingleChoice or MultipleChoice
            or Dropdown or YesNo or Rating or Nps or Number or Date;

    public static bool HasOptions(string type) =>
        type is SingleChoice or MultipleChoice or Dropdown or YesNo;

    /// <summary>Se elige una sola opcion. Son las que admiten saltos por opcion.</summary>
    public static bool IsSingleOption(string type) =>
        type is SingleChoice or Dropdown or YesNo;

    /// <summary>Tipos donde quien responde escribe libremente.</summary>
    public static bool IsText(string type) =>
        type is ShortText or LongText;

    public const int MinScale = 3;
    public const int MaxScale = 10;
    public const int DefaultScale = 5;
}

/// <summary>
/// A donde lleva un salto de logica: vacio es "a la siguiente", <see cref="End"/>
/// termina el formulario y cualquier otro valor es el id de una pregunta posterior.
/// </summary>
public static class QuestionJump
{
    public const string End = "end";
}

/// <summary>
/// Como se guarda lo que escribe quien responde. Manda sobre el teclado: da
/// igual como tenga el Bloq Mayus, el texto se convierte al enviarse.
/// Solo tiene efecto en las preguntas de texto.
/// </summary>
public static class QuestionTextCase
{
    public const string Normal = "normal";
    public const string Upper = "upper";
    public const string Lower = "lower";

    public static bool IsValid(string? value) =>
        value is Normal or Upper or Lower;
}

public class Form
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = FormStatus.Draft;

    /// <summary>
    /// Quien lo creo. Un Editor solo ve y toca los suyos; un Administrador los ve
    /// todos. Vacio significa "sin dueno" y lo ve cualquiera con sesion.
    /// </summary>
    public string OwnerId { get; set; } = string.Empty;

    /// <summary>Fecha de creacion en formato yyyy-MM-dd, como la espera el frontend.</summary>
    public string CreatedAt { get; set; } = string.Empty;

    /// <summary>
    /// Ruta publica de la imagen de fondo para quien responde, o vacio si no tiene.
    /// </summary>
    public string BackgroundImage { get; set; } = string.Empty;

    /// <summary>
    /// Velo oscuro sobre la imagen. Va activado por defecto: sin el, el texto de
    /// las preguntas se pierde sobre casi cualquier foto.
    /// </summary>
    public bool BackgroundOverlay { get; set; } = true;

    /// <summary>
    /// Si cada pregunta puede tener su propia imagen. Cuando esta apagado, todas
    /// usan la del formulario; cuando esta encendido, la de la pregunta manda y
    /// la del formulario queda como reserva para las que no tengan.
    /// </summary>
    public bool BackgroundPerQuestion { get; set; }

    /// <summary>
    /// Imagen propia de la pantalla de datos del respondedor. Como las de las
    /// preguntas, solo se usa con BackgroundPerQuestion activado.
    /// </summary>
    public string IntroBackgroundImage { get; set; } = string.Empty;

    /// <summary>
    /// Portada: la primera pantalla que ve quien responde, antes de las
    /// preguntas. Apagada, se entra directo (o a los datos del respondedor, si
    /// los hay). El fondo es el mismo IntroBackgroundImage, que ya cubre esa
    /// pantalla.
    /// </summary>
    public bool CoverEnabled { get; set; }

    /// <summary>Vacio: se usa el titulo del formulario.</summary>
    public string CoverTitle { get; set; } = string.Empty;

    public string CoverSubtitle { get; set; } = string.Empty;

    /// <summary>Vacio: se usa la descripcion del formulario.</summary>
    public string CoverWelcome { get; set; } = string.Empty;

    /// <summary>
    /// Publico: todos los usuarios lo ven en Compartidos &gt; Publicos y pueden
    /// responderlo. Solo se lista mientras esta publicado. No da acceso al
    /// editor ni a los resultados.
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Desde cuando deja de aceptar respuestas, aunque siga publicado. Null: no
    /// cierra solo. A diferencia de los enlaces, vale para todos, tambien para
    /// quien responde con sesion.
    /// </summary>
    public DateTimeOffset? ClosesAt { get; set; }

    /// <summary>Maximo de respuestas. Null: sin limite.</summary>
    public int? MaxResponses { get; set; }

    /// <summary>Mensaje al terminar de responder. Vacio: el de siempre.</summary>
    public string ConfirmationMessage { get; set; } = string.Empty;

    /// <summary>
    /// Si ya no acepta respuestas por fecha o por cupo. Se calcula al leer, para
    /// que quien abre el formulario lo sepa antes de llenarlo y no al enviar.
    /// No mira el estado: un borrador tiene su propio mensaje.
    /// </summary>
    public bool IsClosed =>
        (ClosesAt is not null && ClosesAt <= DateTimeOffset.UtcNow) ||
        (MaxResponses is not null && ResponseCount >= MaxResponses);

    /// <summary>Datos que se piden antes de empezar a responder. Puede ir vacio.</summary>
    public List<IntroField> IntroFields { get; set; } = [];

    public List<Question> Questions { get; set; } = [];

    /// <summary>Solo tiene valor mientras el formulario esta en la papelera.</summary>
    public DateTimeOffset? TrashedAt { get; set; }

    /// <summary>
    /// Cuantas respuestas lleva. Es un valor derivado que el almacen recalcula al
    /// leer, no algo que se guarde: evita que el listado tenga que pedir las
    /// respuestas de cada formulario por separado.
    /// </summary>
    public int ResponseCount { get; set; }

    // --- Calculados para quien pregunta; no se guardan ---

    /// <summary>owner, edit o view: lo que puede hacer el usuario conectado.</summary>
    public string? Access { get; set; }

    /// <summary>edit o view si se lo compartieron a este usuario; null si no.</summary>
    public string? SharedPermission { get; set; }

    /// <summary>Nombre del dueno, para mostrar "Compartido por".</summary>
    public string? OwnerName { get; set; }
}

/// <summary>Una persona con la que se compartio un formulario.</summary>
public record FormShare(
    string UserId,
    string Email,
    string DisplayName,
    string AvatarUrl,
    string Permission,
    DateTimeOffset SharedAt);

public class Question
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = QuestionType.ShortText;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Required { get; set; }

    /// <summary>normal, upper o lower. Ver <see cref="QuestionTextCase"/>.</summary>
    public string TextCase { get; set; } = QuestionTextCase.Normal;

    /// <summary>
    /// Imagen propia de esta pregunta. Solo se usa si el formulario tiene
    /// activado BackgroundPerQuestion.
    /// </summary>
    public string BackgroundImage { get; set; } = string.Empty;

    /// <summary>
    /// A donde ir despues de esta pregunta. Ver <see cref="QuestionJump"/>. Un
    /// salto de la opcion elegida manda sobre este.
    /// </summary>
    public string JumpTo { get; set; } = string.Empty;

    /// <summary>Cuantas estrellas tiene una pregunta de tipo rating. Null en los demas tipos.</summary>
    public int? ScaleMax { get; set; }

    public List<QuestionOption> Options { get; set; } = [];
}

public class QuestionOption
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;

    /// <summary>A donde lleva elegir esta opcion. Solo en preguntas de opcion unica.</summary>
    public string JumpTo { get; set; } = string.Empty;
}

public class IntroField
{
    public string Id { get; set; } = string.Empty;

    /// <summary>name | phone | email | text</summary>
    public string Type { get; set; } = "text";

    public string Label { get; set; } = string.Empty;
    public string Placeholder { get; set; } = string.Empty;
    public bool Required { get; set; }
    public bool Enabled { get; set; } = true;
}

/// <summary>
/// Enlace para responder sin iniciar sesion. Vence en ExpiresAt: a partir de
/// ahi ese enlace ya no abre el formulario, aunque el formulario siga abierto.
/// </summary>
public record FormLink(
    string Id,
    string Token,
    DateTimeOffset ExpiresAt,
    DateTimeOffset CreatedAt);
