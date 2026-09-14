using System.Text.Json.Nodes;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Datos de ejemplo, los mismos que el frontend trae hoy en FormContext.
/// Cuando entre la base de datos, esto se convierte en el seed de la migracion.
/// </summary>
public static class SeedData
{
    /// <summary>
    /// Dueno de los formularios de ejemplo. Coincide con el administrador de
    /// appsettings; el id se deriva del correo, asi que es el mismo en cada arranque.
    /// </summary>
    public static readonly string DemoOwnerId = UserIdentity.ForEmail("admin@iescogroup.com");

    public static List<Form> CreateForms() =>
    [
        new Form
        {
            Id = "demo-1",
            Title = "Encuesta de satisfaccion",
            Description = "Ayudanos a mejorar nuestro servicio",
            Status = FormStatus.Active,
            OwnerId = DemoOwnerId,
            CreatedAt = "2026-09-09",
            IntroFields = [],
            Questions =
            [
                new Question
                {
                    Id = "q1",
                    Type = QuestionType.SingleChoice,
                    Title = "Como calificarias nuestro servicio?",
                    Required = true,
                    Options =
                    [
                        new QuestionOption { Id = "o1", Text = "Excelente" },
                        new QuestionOption { Id = "o2", Text = "Bueno" },
                        new QuestionOption { Id = "o3", Text = "Regular" },
                        new QuestionOption { Id = "o4", Text = "Malo" },
                    ],
                },
                new Question
                {
                    Id = "q2",
                    Type = QuestionType.MultipleChoice,
                    Title = "Que aspectos te gustaron? (puedes elegir varios)",
                    Required = false,
                    Options =
                    [
                        new QuestionOption { Id = "o5", Text = "Atencion al cliente" },
                        new QuestionOption { Id = "o6", Text = "Calidad del producto" },
                        new QuestionOption { Id = "o7", Text = "Tiempo de entrega" },
                        new QuestionOption { Id = "o8", Text = "Precio" },
                    ],
                },
                new Question
                {
                    Id = "q3",
                    Type = QuestionType.ShortText,
                    Title = "Como te llamas?",
                    Required = true,
                },
                new Question
                {
                    Id = "q4",
                    Type = QuestionType.LongText,
                    Title = "Tienes algun comentario adicional?",
                    Description = "Cuentanos lo que quieras, toda opinion es valiosa.",
                    Required = false,
                },
            ],
        },
        new Form
        {
            Id = "demo-2",
            Title = "Registro de clientes",
            Description = "Formulario de registro",
            Status = FormStatus.Active,
            OwnerId = DemoOwnerId,
            CreatedAt = "2026-09-08",
            IntroFields = [],
            Questions =
            [
                new Question { Id = "q5", Type = QuestionType.ShortText, Title = "Nombre completo", Required = true },
                new Question { Id = "q6", Type = QuestionType.ShortText, Title = "Correo electronico", Required = true },
                new Question
                {
                    Id = "q7",
                    Type = QuestionType.SingleChoice,
                    Title = "Como nos conociste?",
                    Required = false,
                    Options =
                    [
                        new QuestionOption { Id = "o9", Text = "Redes sociales" },
                        new QuestionOption { Id = "o10", Text = "Recomendacion" },
                        new QuestionOption { Id = "o11", Text = "Google" },
                        new QuestionOption { Id = "o12", Text = "Otro" },
                    ],
                },
            ],
        },
    ];

    public static List<FormResponse> CreateResponses() =>
    [
        Survey("r1", "2026-09-09T10:30:00", "Carlos Martinez", "carlos@email.com", "o1", ["o5", "o6"], "Excelente servicio, muy recomendado."),
        Survey("r2", "2026-09-09T09:15:00", "Maria Lopez", "maria@email.com", "o2", ["o6", "o7"], "Todo bien, podrian mejorar los tiempos."),
        Survey("r3", "2026-09-08T16:45:00", "Ana Garcia", "ana@email.com", "o1", ["o5", "o6", "o8"], ""),
        Survey("r4", "2026-09-08T14:20:00", "Pedro Ruiz", "pedro@email.com", "o3", ["o7"], "La entrega tardo mas de lo esperado."),
        Survey("r5", "2026-09-08T11:00:00", "Laura Diaz", "laura@email.com", "o2", ["o5", "o8"], "Buen precio y atencion amable."),
        Survey("r6", "2026-09-07T18:30:00", "Diego Torres", "diego@email.com", "o1", ["o5", "o6", "o7", "o8"], "Todo perfecto, 10/10."),
        Survey("r7", "2026-09-07T15:10:00", "Sofia Herrera", "sofia@email.com", "o2", ["o6"], ""),
        Survey("r8", "2026-09-07T10:05:00", "Miguel Sanchez", "miguel@email.com", "o4", [], "No quede satisfecho con la compra."),
        Survey("r9", "2026-09-06T14:50:00", "Valentina Mora", "valentina@email.com", "o1", ["o5", "o7"], "Rapido y eficiente."),
        Survey("r10", "2026-09-06T09:30:00", "Andres Jimenez", "andres@email.com", "o2", ["o5", "o6"], ""),
        Survey("r11", "2026-09-05T17:20:00", "Camila Rojas", "camila@email.com", "o1", ["o6", "o8"], "Productos de calidad."),
        Survey("r12", "2026-09-05T12:00:00", "Ricardo Vargas", "ricardo@email.com", "o3", ["o7"], "Podrian mejorar el empaque."),

        Registration("r13", "2026-09-09T08:00:00", "Elena Castillo", "elena@email.com", "o9"),
        Registration("r14", "2026-09-08T10:30:00", "Fernando Ortiz", "fernando@email.com", "o10"),
        Registration("r15", "2026-09-07T14:00:00", "Isabella Mendez", "isabella@email.com", "o11"),
        Registration("r16", "2026-09-06T16:45:00", "Gabriel Pena", "gabriel@email.com", "o9"),
        Registration("r17", "2026-09-05T09:15:00", "Natalia Cruz", "natalia@email.com", "o10"),
        Registration("r18", "2026-09-04T11:30:00", "Sebastian Luna", "sebastian@email.com", "o11"),
    ];

    private static FormResponse Survey(
        string id, string submittedAt, string name, string email,
        string rating, string[] aspects, string comment) => new()
    {
        Id = id,
        FormId = "demo-1",
        SubmittedAt = DateTimeOffset.Parse(submittedAt),
        Respondent = new Dictionary<string, string> { ["name"] = name, ["email"] = email },
        Answers = new Dictionary<string, JsonNode?>
        {
            ["q1"] = JsonValue.Create(rating),
            ["q2"] = new JsonArray([.. aspects.Select(a => (JsonNode?)JsonValue.Create(a))]),
            ["q3"] = JsonValue.Create(name),
            ["q4"] = JsonValue.Create(comment),
        },
    };

    private static FormResponse Registration(
        string id, string submittedAt, string name, string email, string source) => new()
    {
        Id = id,
        FormId = "demo-2",
        SubmittedAt = DateTimeOffset.Parse(submittedAt),
        Respondent = new Dictionary<string, string> { ["name"] = name, ["email"] = email },
        Answers = new Dictionary<string, JsonNode?>
        {
            ["q5"] = JsonValue.Create(name),
            ["q6"] = JsonValue.Create(email),
            ["q7"] = JsonValue.Create(source),
        },
    };

    public static List<Template> CreateTemplates() =>
    [
        new Template
        {
            Id = "tpl-satisfaction",
            Name = "Encuesta de satisfaccion",
            Description = "Mide la satisfaccion de tus clientes con tu producto o servicio.",
            Category = "Feedback",
            Questions =
            [
                Choice("En general, que tan satisfecho estas con nuestro servicio?", true, "Muy satisfecho", "Satisfecho", "Neutral", "Insatisfecho", "Muy insatisfecho"),
                Choice("Recomendarias nuestro servicio a un amigo o colega?", true, "Definitivamente si", "Probablemente si", "No estoy seguro", "Probablemente no", "Definitivamente no"),
                MultiChoice("Que aspectos valoras mas? (elige todos los que apliquen)", false, "Calidad", "Precio", "Atencion al cliente", "Rapidez", "Facilidad de uso"),
                LongText("Que podriamos mejorar?", false),
            ],
        },
        new Template
        {
            Id = "tpl-nps",
            Name = "Encuesta NPS",
            Description = "Net Promoter Score: mide la lealtad de tus clientes.",
            Category = "Feedback",
            Questions =
            [
                Choice("Del 1 al 10, que tan probable es que nos recomiendes?", true, "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"),
                Choice("Cual es la razon principal de tu puntuacion?", true, "Calidad del producto", "Servicio al cliente", "Precio", "Experiencia general", "Otro"),
                LongText("Cuentanos mas sobre tu experiencia", false),
            ],
        },
        new Template
        {
            Id = "tpl-event-feedback",
            Name = "Feedback de evento",
            Description = "Recopila opiniones despues de un evento o conferencia.",
            Category = "Feedback",
            Questions =
            [
                Choice("Como calificarias el evento en general?", true, "Excelente", "Muy bueno", "Bueno", "Regular", "Malo"),
                MultiChoice("Que sesiones te parecieron mas utiles?", false, "Conferencia principal", "Talleres", "Networking", "Panel de expertos", "Demostraciones"),
                Choice("Asistiras a futuros eventos?", true, "Definitivamente", "Probablemente", "No estoy seguro", "Probablemente no"),
                LongText("Sugerencias para mejorar futuros eventos", false),
            ],
        },
        new Template
        {
            Id = "tpl-contact",
            Name = "Formulario de contacto",
            Description = "Permite que tus visitantes se comuniquen contigo.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Correo electronico", true),
                ShortText("Telefono (opcional)", false),
                Choice("Motivo del contacto", true, "Consulta general", "Soporte tecnico", "Ventas", "Alianzas", "Otro"),
                LongText("Tu mensaje", true),
            ],
        },
        new Template
        {
            Id = "tpl-registration",
            Name = "Registro de evento",
            Description = "Registra asistentes para tu proximo evento.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Correo electronico", true),
                ShortText("Empresa / Organizacion", false),
                Choice("Tipo de entrada", true, "General", "VIP", "Estudiante", "Prensa"),
                MultiChoice("Sesiones de interes", false, "Conferencia principal", "Taller A", "Taller B", "Networking", "Demo en vivo"),
                Choice("Necesitas algun requerimiento especial?", false, "No", "Accesibilidad", "Dieta especial", "Otro"),
            ],
        },
        new Template
        {
            Id = "tpl-job",
            Name = "Solicitud de empleo",
            Description = "Recibe postulaciones de candidatos interesados.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Correo electronico", true),
                ShortText("Telefono", true),
                Choice("Puesto al que aplicas", true, "Desarrollador", "Disenador", "Marketing", "Ventas", "Administracion", "Otro"),
                Choice("Anos de experiencia", true, "Sin experiencia", "1-2 anos", "3-5 anos", "5-10 anos", "Mas de 10 anos"),
                LongText("Cuentanos sobre ti y por que te interesa esta posicion", true),
            ],
        },
        new Template
        {
            Id = "tpl-quiz",
            Name = "Quiz de conocimiento",
            Description = "Evalua el conocimiento de tu audiencia sobre un tema.",
            Category = "Evaluacion",
            Questions =
            [
                Choice("Pregunta 1: Cual es la capital de Francia?", true, "Londres", "Paris", "Berlin", "Madrid"),
                Choice("Pregunta 2: En que ano llego el hombre a la luna?", true, "1965", "1969", "1972", "1975"),
                MultiChoice("Pregunta 3: Cuales son lenguajes de programacion? (elige todos)", true, "Python", "HTML", "JavaScript", "Photoshop", "Rust"),
                ShortText("Pregunta 4: Cuantos planetas tiene el sistema solar?", true),
            ],
        },
        new Template
        {
            Id = "tpl-performance",
            Name = "Evaluacion de desempeno",
            Description = "Evalua el rendimiento de los miembros de tu equipo.",
            Category = "Evaluacion",
            Questions =
            [
                ShortText("Nombre del evaluado", true),
                Choice("Cumplimiento de objetivos", true, "Supera expectativas", "Cumple expectativas", "Parcialmente", "No cumple"),
                Choice("Trabajo en equipo", true, "Excelente", "Bueno", "Aceptable", "Necesita mejorar"),
                Choice("Comunicacion", true, "Excelente", "Bueno", "Aceptable", "Necesita mejorar"),
                MultiChoice("Areas de fortaleza", false, "Liderazgo", "Creatividad", "Resolucion de problemas", "Puntualidad", "Proactividad"),
                LongText("Comentarios adicionales y plan de mejora", false),
            ],
        },
        new Template
        {
            Id = "tpl-market",
            Name = "Investigacion de mercado",
            Description = "Conoce las preferencias y necesidades de tu mercado.",
            Category = "Evaluacion",
            Questions =
            [
                Choice("Cual es tu rango de edad?", true, "18-24", "25-34", "35-44", "45-54", "55+"),
                Choice("Con que frecuencia usas productos como el nuestro?", true, "Diariamente", "Semanalmente", "Mensualmente", "Raramente", "Nunca"),
                MultiChoice("Que factores consideras al elegir un producto?", true, "Precio", "Calidad", "Marca", "Recomendaciones", "Diseno", "Funcionalidad"),
                Choice("Cuanto estarias dispuesto a pagar?", true, "Menos de $10", "$10-$25", "$25-$50", "$50-$100", "Mas de $100"),
                LongText("Que caracteristicas te gustaria ver en un producto ideal?", false),
            ],
        },
    ];

    private static TemplateQuestion ShortText(string title, bool required) =>
        new() { Type = QuestionType.ShortText, Title = title, Required = required };

    private static TemplateQuestion LongText(string title, bool required) =>
        new() { Type = QuestionType.LongText, Title = title, Required = required };

    private static TemplateQuestion Choice(string title, bool required, params string[] options) =>
        new() { Type = QuestionType.SingleChoice, Title = title, Required = required, Options = [.. options] };

    private static TemplateQuestion MultiChoice(string title, bool required, params string[] options) =>
        new() { Type = QuestionType.MultipleChoice, Title = title, Required = required, Options = [.. options] };
}
