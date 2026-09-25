using System.Text.Json.Nodes;
using IescoForms.Api.Models;

namespace IescoForms.Api.Services;

/// <summary>
/// Datos de ejemplo, los mismos que el frontend trae hoy en FormContext.
///
/// El catalogo de plantillas de <see cref="Templates"/> no es un ejemplo: es la
/// version que usa la aplicacion. Las plantillas son solo lectura, iguales para
/// todos y no dependen de quien este conectado, asi que viven aqui y no en la
/// base. Se editan en este archivo y el cambio viaja en el repositorio.
/// </summary>
public static class SeedData
{
    /// <summary>
    /// Catalogo de plantillas. Se construye una vez y se reparte a todas las
    /// peticiones: es inmutable en la practica, nadie lo escribe en caliente.
    ///
    /// Lazy y no un inicializador directo: los campos estaticos se inicializan
    /// en orden de declaracion, y las escalas que usan las plantillas
    /// (Escala0A10, LineasDeServicio, Desempeno...) estan al final del
    /// archivo. Construir aqui las dejaria en null.
    /// </summary>
    private static readonly Lazy<IReadOnlyList<Template>> _templates =
        new(() => CreateTemplates());

    public static IReadOnlyList<Template> Templates => _templates.Value;

    public static Template? FindTemplate(string id) =>
        Templates.FirstOrDefault(t => t.Id == id);

    /// <summary>
    /// Los formularios de ejemplo no tienen dueno: ya no hay usuarios fijos en el
    /// codigo a los que asignarlos.
    /// </summary>
    public const string DemoOwnerId = "";

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

    public static List<Template> CreateTemplates() => ResolverSaltos(
    [
        new Template
        {
            Id = "tpl-satisfaction",
            Name = "Encuesta de satisfacción",
            Description = "Mide la satisfacción de tus clientes con el servicio, el equipo asignado y el cumplimiento de plazos.",
            Category = "Feedback",
            BackgroundImage = FondoSatisfaccion,
            CoverEnabled = true,
            CoverTitle = "Encuesta de satisfacción del cliente IESCO Group",
            CoverSubtitle = "¡Nos encantaría conocer su opinión sobre nuestra empresa!",
            // Datos de ejemplo del servicio: se editan en cada formulario nuevo.
            CoverWelcome =
                "Empresa: IMI Del Perú S.A.C.\n" +
                "Proyecto: P251140\n" +
                "Servicio:\n" +
                "Capacitación y certificación en operación segura de grúa articulada",
            Questions =
            [
                Choice("¿Qué tan satisfecho está con el servicio?", true, Escala0A10),
                Choice("¿Cuál es su nivel de satisfacción con el equipo profesional asignado para el servicio?", true, Escala0A10),
                YesNo("¿El servicio fue ejecutado dentro del plazo acordado?", true),
                ShortText("¿Alguna recomendación para la mejora continua de nuestros servicios?", false),
                ShortText("¿En qué otra línea de servicio de IESCO se encuentra interesado?", false),
                ShortText("Nos gustaría mucho recibir cualquier comentario específico sobre nuestro servicio que podamos utilizar en el futuro como testimonios de nuestros clientes en nuestra página web o documentos comerciales (“what our customers say”).", false),
                Choice("¿Cuál es la probabilidad que contrate nuevamente nuestros servicios?", true, "Muy probable", "Probable", "No estoy seguro", "Poco probable", "Nada probable"),
                MultiChoice("¿En qué otra línea de servicio de IESCO se encuentra interesado?", false, LineasDeServicio),
                ShortText("Agradecemos sinceramente tu dedicación al compartir tu tiempo con nosotros. Es posible que nos pongamos en contacto contigo para ampliar y profundizar en tus comentarios. Si deseas mantener una comunicación con nosotros en el futuro, por favor, déjanos tu información de contacto a continuación.", false),
            ],
        },
        new Template
        {
            Id = "tpl-nps",
            Name = "Encuesta NPS",
            Description = "Net Promoter Score: mide la lealtad de tus clientes y las razones detras de su puntuacion.",
            Category = "Feedback",
            BackgroundImage = FondoNps,
            CoverEnabled = true,
            CoverTitle = "¿Nos recomendaría a un colega del sector?",
            CoverSubtitle = "Una sola pregunta define todo lo demás",
            CoverWelcome =
                "Son preguntas cortas y toma menos de tres minutos.\n" +
                "Su respuesta nos dice qué estamos haciendo bien y qué tenemos que corregir.",
            Questions =
            [
                Nps("Del 0 al 10, que tan probable es que nos recomiendes a un amigo o colega?", true),
                Choice("Cual es la razon principal de tu puntuacion?", true, "Calidad del producto o servicio", "Atencion al cliente", "Precio", "Facilidad de uso", "Cumplimiento de lo prometido", "Otro"),
                LongText("Que tendriamos que cambiar para que nos des una puntuacion mas alta?", false),
                Dropdown("Hace cuanto eres cliente nuestro?", true, "Menos de 3 meses", "De 3 a 12 meses", "De 1 a 3 anos", "Mas de 3 anos"),
                Dropdown("Con que frecuencia usas nuestro producto o servicio?", true, Frecuencia),
                Rating("Que tan facil es trabajar con nosotros? (1 = muy dificil, 5 = muy facil)", true),
                Choice("Cumplimos con lo que esperabas al contratarnos?", true, "Superamos lo esperado", "Cumplimos", "Cumplimos en parte", "No cumplimos"),
                Choice("Has considerado cambiarte a otro proveedor en el ultimo ano?", true, "No", "Lo he pensado", "Si, estoy evaluando opciones")
                    .SaltaSi("No", "En que deberiamos enfocarnos primero?"),
                LongText("Que te haria quedarte con nosotros?", false),
                MultiChoice("En que deberiamos enfocarnos primero?", false, "Mejorar la calidad", "Responder mas rapido", "Bajar precios", "Nuevas funcionalidades", "Mejor comunicacion", "Capacitacion"),
                LongText("Hay algo mas que quieras contarnos?", false),
            ],
        },
        new Template
        {
            Id = "tpl-event-feedback",
            Name = "Feedback de evento",
            Description = "Recopila opiniones despues de un evento, conferencia o capacitacion.",
            Category = "Feedback",
            BackgroundImage = FondoEventoFeedback,
            CoverEnabled = true,
            CoverTitle = "¿Qué le pareció la jornada?",
            CoverSubtitle = "Su opinión define la próxima capacitación",
            CoverWelcome =
                "Evento:\n" +
                "Fecha:\n" +
                "Expositor:\n\n" +
                "Cuéntenos qué se llevó y qué le faltó. Leemos todas las respuestas.",
            Questions =
            [
                Choice("En que calidad participaste?", true, "Asistente", "Ponente", "Patrocinador", "Organizador", "Prensa"),
                Rating("Como calificarias el evento en general?", true),
                Choice("El contenido cumplio con tus expectativas?", true, "Supero mis expectativas", "Las cumplio", "Las cumplio en parte", "No las cumplio"),
                Rating("Como calificas la calidad de los ponentes?", true),
                Choice("El contenido fue relevante para tu trabajo?", true, Acuerdo),
                MultiChoice("Que actividades te parecieron mas utiles?", false, "Conferencia principal", "Talleres practicos", "Paneles de expertos", "Networking", "Demostraciones", "Stands"),
                Rating("Como calificas la organizacion y logistica?", true),
                Rating("Como calificas el lugar y las instalaciones?", true),
                Choice("La duracion del evento fue adecuada?", true, "Demasiado corto", "Adecuada", "Demasiado largo"),
                Dropdown("Como te enteraste del evento?", true, "Correo electronico", "Redes sociales", "Sitio web", "Recomendacion", "Mi empresa", "Otro"),
                Nps("Del 0 al 10, que tan probable es que recomiendes este evento a un colega?", true),
                Choice("Asistirias a una proxima edicion?", true, Probabilidad),
                MultiChoice("Sobre que temas te gustaria aprender en proximos eventos?", false, "Tecnologia", "Gestion de proyectos", "Seguridad", "Liderazgo", "Innovacion", "Normativa"),
                LongText("Que fue lo mejor del evento?", false),
                LongText("Que deberiamos mejorar para la proxima edicion?", false),
            ],
        },
        new Template
        {
            Id = "tpl-contact",
            Name = "Formulario de contacto",
            Description = "Recibe consultas con los datos necesarios para darles seguimiento.",
            BackgroundImage = FondoContacto,
            CoverEnabled = true,
            CoverTitle = "Hablemos de su proyecto",
            CoverSubtitle = "Cuéntenos en qué podemos ayudarle",
            CoverWelcome =
                "Déjenos sus datos y el motivo de su consulta.\n" +
                "Un asesor de la línea de servicio que corresponda le responderá dentro de las 24 horas hábiles.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Correo electronico", true),
                ShortText("Telefono", false),
                ShortText("Empresa u organizacion", false),
                ShortText("Cargo", false),
                ShortText("Pais y ciudad", false),
                Choice("Motivo del contacto", true, "Solicitar cotizacion", "Informacion de servicios", "Soporte tecnico", "Reclamo o queja", "Alianzas", "Otro"),
                Choice("Que tan urgente es tu solicitud?", true, "Alta: necesito respuesta hoy", "Media: en los proximos dias", "Baja: solo informativa"),
                ShortText("Asunto", true),
                LongText("Describe tu consulta con el mayor detalle posible", true),
                Choice("Como prefieres que te contactemos?", true, "Correo electronico", "Llamada telefonica", "WhatsApp", "Reunion virtual")
                    .SaltaSi("Correo electronico", "Como nos conociste?"),
                Choice("En que horario prefieres que te contactemos?", false, "Manana (8:00 - 12:00)", "Tarde (12:00 - 18:00)", "Cualquier horario"),
                Dropdown("Como nos conociste?", false, "Buscador (Google)", "Redes sociales", "Recomendacion", "Evento", "Ya soy cliente", "Otro"),
                Choice("Aceptas que usemos tus datos para responder a esta consulta?", true, "Si, acepto"),
            ],
        },
        new Template
        {
            Id = "tpl-registration",
            Name = "Registro de evento",
            Description = "Registra asistentes con sus datos, preferencias y requerimientos.",
            BackgroundImage = FondoRegistro,
            CoverEnabled = true,
            CoverTitle = "Reserve su lugar",
            CoverSubtitle = "Inscripción a la próxima jornada IESCO Group",
            CoverWelcome =
                "Evento:\n" +
                "Fecha:\n" +
                "Lugar:\n\n" +
                "Complete sus datos para confirmar la inscripción. Le enviaremos la confirmación por correo.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Documento de identidad", true),
                ShortText("Correo electronico", true),
                ShortText("Telefono", true),
                ShortText("Empresa u organizacion", false),
                ShortText("Cargo", false),
                Dropdown("Sector de tu organizacion", false, "Energia", "Construccion", "Industria", "Servicios", "Sector publico", "Educacion", "Otro"),
                Choice("Tipo de entrada", true, "General", "VIP", "Estudiante", "Invitado", "Prensa"),
                MultiChoice("Sesiones a las que asistiras", false, "Conferencia principal", "Taller A", "Taller B", "Panel de expertos", "Networking", "Visita tecnica"),
                // Quien asiste en linea no come, no se traslada ni recibe polo: se
                // salta todo lo que solo aplica en el lugar.
                Choice("Modalidad de asistencia", true, "Presencial", "Virtual")
                    .SaltaSi("Virtual", "Como te enteraste del evento?"),
                Choice("Tienes alguna restriccion alimentaria?", true, "Ninguna", "Vegetariano", "Vegano", "Sin gluten", "Otra"),
                Choice("Necesitas algun requerimiento de accesibilidad?", true, "No", "Movilidad reducida", "Interprete", "Otro"),
                Dropdown("Talla de polo (si aplica)", false, "S", "M", "L", "XL", "XXL"),
                ShortText("Contacto de emergencia (nombre y telefono)", false),
                Dropdown("Como te enteraste del evento?", false, "Correo electronico", "Redes sociales", "Sitio web", "Recomendacion", "Mi empresa", "Otro"),
                YesNo("Autorizas el uso de fotos y videos del evento en los que aparezcas?", true),
            ],
        },
        new Template
        {
            Id = "tpl-job",
            Name = "Solicitud de empleo",
            Description = "Recibe postulaciones completas: datos, formacion, experiencia y disponibilidad.",
            BackgroundImage = FondoEmpleo,
            CoverEnabled = true,
            CoverTitle = "Súmese al equipo de IESCO Group",
            CoverSubtitle = "Su experiencia en campo tiene un lugar aquí",
            CoverWelcome =
                "Puesto:\n" +
                "Área:\n" +
                "Ubicación:\n\n" +
                "Complete sus datos, formación y experiencia. Revisamos cada postulación y le escribimos si su perfil avanza.",
            Category = "Contacto",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Documento de identidad", true),
                Date("Fecha de nacimiento", false),
                ShortText("Correo electronico", true),
                ShortText("Telefono", true),
                ShortText("Ciudad de residencia", true),
                ShortText("Puesto al que postulas", true),
                Dropdown("Area de interes", true, "Ingenieria", "Operaciones", "Administracion y finanzas", "Recursos humanos", "Comercial", "Tecnologia", "Otro"),
                Dropdown("Nivel de estudios alcanzado", true, "Secundaria", "Tecnico", "Universitario en curso", "Bachiller", "Titulado", "Maestria o superior")
                    .SaltaSi("Secundaria", "Anos de experiencia en el puesto"),
                ShortText("Carrera o especialidad", false),
                Choice("Anos de experiencia en el puesto", true, "Sin experiencia", "Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "5 a 10 anos", "Mas de 10 anos")
                    .SaltaSi("Sin experiencia", "Idiomas que manejas a nivel intermedio o superior"),
                ShortText("Ultimo empleador y cargo", false),
                MultiChoice("Idiomas que manejas a nivel intermedio o superior", false, "Espanol", "Ingles", "Portugues", "Frances", "Otro"),
                MultiChoice("Herramientas que dominas", false, "Excel avanzado", "AutoCAD", "ERP / SAP", "Power BI", "MS Project", "Ninguna de estas"),
                Choice("Disponibilidad para empezar", true, "Inmediata", "En 15 dias", "En 1 mes", "Mas de 1 mes"),
                Choice("Tipo de jornada que buscas", true, "Tiempo completo", "Medio tiempo", "Por proyecto", "Practicas"),
                Choice("Tienes disponibilidad para viajar?", true, "Si", "Ocasionalmente", "No"),
                Number("Expectativa salarial mensual (solo el monto)", false),
                ShortText("Enlace a tu CV o perfil de LinkedIn", true),
                LongText("Por que te interesa trabajar con nosotros?", true),
                Choice("Declaro que la informacion proporcionada es veraz", true, "Si, lo declaro"),
            ],
        },
        new Template
        {
            Id = "tpl-quiz",
            Name = "Quiz de conocimiento",
            Description = "Evalua lo aprendido en una induccion de seguridad y politicas internas.",
            BackgroundImage = FondoQuiz,
            CoverEnabled = true,
            CoverTitle = "Evaluación de inducción",
            CoverSubtitle = "Seguridad y políticas internas",
            CoverWelcome =
                "Curso:\n" +
                "Fecha:\n" +
                "Participante:\n\n" +
                "Responda según lo visto en la inducción. Hay que contestar todas las preguntas para terminar.",
            Category = "Evaluacion",
            Questions =
            [
                ShortText("Nombre completo", true),
                ShortText("Area o departamento", true),
                Choice("1. Que debes hacer primero al detectar una condicion insegura?", true, "Ignorarla si no te afecta", "Reportarla a tu supervisor", "Arreglarla tu mismo sin avisar", "Esperar a la siguiente reunion"),
                Choice("2. Que significa EPP?", true, "Equipo de Proteccion Personal", "Evaluacion Previa de Procesos", "Estandar de Prevencion Primaria", "Equipo de Primeros Pasos"),
                MultiChoice("3. Cuales son equipos de proteccion personal? (elige todos los correctos)", true, "Casco", "Lentes de seguridad", "Guantes", "Telefono celular", "Zapatos de seguridad"),
                Choice("4. Ante una alarma de evacuacion debes:", true, "Terminar lo que estas haciendo", "Dirigirte a la zona segura por la ruta senalizada", "Usar el ascensor", "Volver por tus pertenencias"),
                Choice("5. Cada cuanto se debe inspeccionar un extintor, como minimo?", true, "Cada semana", "Cada mes", "Cada ano", "Solo cuando se usa"),
                Choice("6. Si sufres un accidente leve en el trabajo, que debes hacer?", true, "No decir nada", "Reportarlo el mismo dia", "Reportarlo a fin de mes", "Contarlo solo a un companero"),
                Choice("7. Compartir tu contrasena de la empresa con un companero es:", true, "Aceptable si es de confianza", "Aceptable en emergencias", "No permitido", "Obligatorio"),
                Choice("8. Recibes un correo sospechoso que pide tus credenciales. Que haces?", true, "Respondo con mis datos", "Hago clic para verificar", "Lo reporto a TI y no abro enlaces", "Lo reenvio a mis companeros"),
                MultiChoice("9. Que informacion se considera confidencial? (elige todas)", true, "Datos personales de clientes", "Contratos", "El menu del comedor", "Informacion financiera", "Planos de proyectos"),
                Choice("10. A quien debes acudir ante un conflicto de intereses?", true, "A nadie", "A tu jefe directo o al area de cumplimiento", "Solo a un companero", "Al cliente"),
                Rating("Que tan claro fue el contenido de la induccion?", true),
                LongText("Que tema te gustaria reforzar?", false),
            ],
        },
        new Template
        {
            Id = "tpl-performance",
            Name = "Evaluacion de desempeno",
            Description = "Evalua competencias, resultados y plan de desarrollo de los colaboradores.",
            BackgroundImage = FondoDesempeno,
            CoverEnabled = true,
            CoverTitle = "Evaluación de desempeño",
            CoverSubtitle = "Competencias, resultados y plan de desarrollo",
            CoverWelcome =
                "Colaborador:\n" +
                "Área:\n" +
                "Periodo evaluado:\n\n" +
                "Evalúe cada aspecto con ejemplos concretos en mente. Los resultados se conversan en la reunión de retroalimentación.",
            Category = "Evaluacion",
            Questions =
            [
                ShortText("Nombre del colaborador evaluado", true),
                ShortText("Cargo", true),
                ShortText("Area o departamento", true),
                ShortText("Nombre del evaluador", true),
                Date("Fecha de la evaluacion", true),
                Dropdown("Periodo evaluado", true, "Primer semestre", "Segundo semestre", "Anual", "Fin de periodo de prueba"),
                Choice("Cumplimiento de objetivos del periodo", true, Desempeno),
                Choice("Calidad del trabajo entregado", true, Desempeno),
                Choice("Productividad y cumplimiento de plazos", true, Desempeno),
                Choice("Conocimiento tecnico del puesto", true, Desempeno),
                Choice("Trabajo en equipo y colaboracion", true, Desempeno),
                Choice("Comunicacion", true, Desempeno),
                Choice("Iniciativa y proactividad", true, Desempeno),
                Choice("Resolucion de problemas", true, Desempeno),
                Choice("Cumplimiento de normas de seguridad", true, Desempeno),
                Choice("Puntualidad y asistencia", true, Desempeno),
                MultiChoice("Principales fortalezas", false, "Liderazgo", "Orientacion a resultados", "Creatividad", "Organizacion", "Aprendizaje rapido", "Atencion al detalle", "Servicio al cliente"),
                MultiChoice("Areas de mejora", false, "Gestion del tiempo", "Comunicacion", "Conocimiento tecnico", "Trabajo en equipo", "Toma de decisiones", "Manejo de herramientas"),
                Choice("Calificacion global del desempeno", true, Desempeno),
                LongText("Logros destacados del periodo", false),
                LongText("Plan de desarrollo: objetivos y capacitaciones para el proximo periodo", true),
                // Sin conversacion todavia no hay comentarios del colaborador que anotar.
                YesNo("El colaborador reviso y converso esta evaluacion con el evaluador?", true)
                    .SaltaSi("No", Terminar),
                LongText("Comentarios del colaborador", false),
            ],
        },
        new Template
        {
            Id = "tpl-market",
            Name = "Investigacion de mercado",
            Description = "Conoce el perfil, habitos, necesidades y disposicion de compra de tu mercado.",
            BackgroundImage = FondoMercado,
            CoverEnabled = true,
            CoverTitle = "Queremos entender mejor su operación",
            CoverSubtitle = "Estudio de mercado IESCO Group",
            CoverWelcome =
                "Sus respuestas nos ayudan a diseñar servicios que resuelvan problemas reales del sector.\n" +
                "La información es confidencial y se usa solo con fines estadísticos.",
            Category = "Evaluacion",
            Questions =
            [
                Dropdown("Cual es tu rango de edad?", true, "18-24", "25-34", "35-44", "45-54", "55-64", "65 o mas"),
                Choice("Genero", false, "Femenino", "Masculino", "Otro", "Prefiero no decirlo"),
                ShortText("Ciudad de residencia", true),
                Choice("Nivel de estudios", false, "Secundaria", "Tecnico", "Universitario", "Posgrado"),
                Dropdown("Situacion laboral", true, "Empleado", "Independiente", "Empresario", "Estudiante", "Sin empleo", "Jubilado"),
                Choice("Tamano de la empresa donde trabajas", false, "1 a 10 personas", "11 a 50", "51 a 250", "Mas de 250", "No aplica"),
                Dropdown("Con que frecuencia usas productos o servicios como el nuestro?", true, Frecuencia),
                // Quien no tiene proveedor no puede calificarlo.
                YesNo("Trabajas actualmente con algun proveedor de este tipo de servicio?", true)
                    .SaltaSi("No", "Que factores consideras al elegir un proveedor?"),
                MultiChoice("Que marcas o proveedores usas actualmente?", false, "Proveedor A", "Proveedor B", "Proveedor C", "Otro"),
                Rating("Que tan satisfecho estas con tu proveedor actual?", true),
                MultiChoice("Que factores consideras al elegir un proveedor?", true, "Precio", "Calidad", "Marca", "Recomendaciones", "Rapidez de entrega", "Soporte postventa", "Garantia"),
                Choice("Cual es el factor MAS importante para ti?", true, "Precio", "Calidad", "Marca", "Recomendaciones", "Rapidez de entrega", "Soporte postventa", "Garantia"),
                MultiChoice("Por que medios buscas informacion antes de comprar?", false, "Buscadores", "Redes sociales", "Recomendaciones", "Ferias y eventos", "Vendedores", "Sitios de comparacion"),
                Choice("Cuanto estarias dispuesto a invertir al mes en una solucion como esta?", true, "Menos de $50", "$50 a $200", "$200 a $500", "$500 a $1,000", "Mas de $1,000"),
                Choice("Quien toma la decision de compra en tu organizacion?", false, "Yo", "Mi jefe directo", "Gerencia general", "Area de compras", "Un comite"),
                Choice("Que tan probable es que pruebes un nuevo proveedor en los proximos 6 meses?", true, Probabilidad),
                LongText("Que problema te gustaria que resolviera un producto o servicio ideal?", false),
                LongText("Que caracteristicas no pueden faltar?", false),
                YesNo("Podemos contactarte para una entrevista breve?", true)
                    .SaltaSi("No", Terminar),
                ShortText("Dejanos tu correo o telefono para coordinar la entrevista", true),
            ],
        },
    ]);

    // Escalas repetidas. Van en un solo sitio para que todas las plantillas
    // usen exactamente las mismas palabras y los resultados se puedan comparar.
    // Fondos de las portadas. Viven en frontend/public, asi que el frontend los
    // sirve en esa ruta tal cual, en desarrollo y compilado. No pasan por
    // uploads/backgrounds, de modo que cambiar el fondo de un formulario nunca
    // borra el archivo que comparten todos los demas.
    //
    // Una imagen por plantilla, sin repetir, elegidas por lo que muestran.
    private const string FondoSatisfaccion = "/AdobeStock_518323798.jpeg";
    private const string FondoNps = "/AdobeStock_2007793277.jpeg";          // bomba al atardecer
    private const string FondoEventoFeedback = "/AdobeStock_2080966257.jpeg"; // emergencia atendida
    private const string FondoContacto = "/AdobeStock_202041790.jpeg";      // refineria de noche
    private const string FondoRegistro = "/AdobeStock_2023732488.jpeg";     // antorcha, vista aerea
    private const string FondoEmpleo = "/AdobeStock_1195486359.jpeg";       // bomba a pleno dia
    private const string FondoQuiz = "/AdobeStock_2164906378.jpeg";         // incendio de tanques
    private const string FondoDesempeno = "/AdobeStock_137417730.jpeg";     // camion minero
    private const string FondoMercado = "/AdobeStock_377799248.jpeg";       // puerto con datos

    // Escala 0-10 de la encuesta de satisfaccion: once opciones, estilo NPS.
    private static readonly string[] Escala0A10 = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    // Lineas de servicio de IESCO, en el orden que usa el area comercial.
    private static readonly string[] LineasDeServicio =
    [
        "Entrenamientos (TRN)",
        "Gestión de Riesgos y Seguridad (PSM)",
        "Supervisión de Proyectos y Gestión de la Calidad en Proyectos (PQM)",
        "Gestión de Integridad de Activos (AIM)",
        "Ingeniería Avanzada (AE)",
        "Transformación Digital (TSS)",
        "Otros",
    ];

    private static readonly string[] Acuerdo = ["Totalmente de acuerdo", "De acuerdo", "Ni de acuerdo ni en desacuerdo", "En desacuerdo", "Totalmente en desacuerdo"];
    private static readonly string[] Probabilidad = ["Muy probable", "Probable", "No estoy seguro", "Poco probable", "Nada probable"];
    private static readonly string[] Frecuencia = ["Diariamente", "Varias veces por semana", "Semanalmente", "Mensualmente", "Rara vez", "Nunca"];
    private static readonly string[] Desempeno = ["Supera expectativas", "Cumple expectativas", "Cumple parcialmente", "No cumple", "No aplica"];

    private static TemplateQuestion ShortText(string title, bool required) =>
        new() { Type = QuestionType.ShortText, Title = title, Required = required };

    private static TemplateQuestion LongText(string title, bool required) =>
        new() { Type = QuestionType.LongText, Title = title, Required = required };

    private static TemplateQuestion Choice(string title, bool required, params string[] options) =>
        new() { Type = QuestionType.SingleChoice, Title = title, Required = required, Options = [.. options] };

    private static TemplateQuestion MultiChoice(string title, bool required, params string[] options) =>
        new() { Type = QuestionType.MultipleChoice, Title = title, Required = required, Options = [.. options] };

    private static TemplateQuestion Nps(string title, bool required) =>
        new() { Type = QuestionType.Nps, Title = title, Required = required };

    private static TemplateQuestion Dropdown(string title, bool required, params string[] options) =>
        new() { Type = QuestionType.Dropdown, Title = title, Required = required, Options = [.. options] };

    private static TemplateQuestion YesNo(string title, bool required) =>
        new() { Type = QuestionType.YesNo, Title = title, Required = required, Options = ["Sí", "No"] };

    private static TemplateQuestion Rating(string title, bool required, int stars = QuestionType.DefaultScale) =>
        new() { Type = QuestionType.Rating, Title = title, Required = required, ScaleMax = stars };

    private static TemplateQuestion Number(string title, bool required) =>
        new() { Type = QuestionType.Number, Title = title, Required = required };

    private static TemplateQuestion Date(string title, bool required) =>
        new() { Type = QuestionType.Date, Title = title, Required = required };

    // --- Logica condicional ---

    /// <summary>Destino de <see cref="SaltaSi"/> que termina el formulario.</summary>
    private const string Terminar = QuestionJump.End;

    /// <summary>
    /// Si se elige <paramref name="opcion"/>, saltar a la pregunta cuyo titulo es
    /// <paramref name="destino"/> (o <see cref="Terminar"/>). Se apunta por titulo
    /// y no por posicion para que agregar o mover preguntas no desvie el salto;
    /// <see cref="ResolverSaltos"/> lo convierte en posicion al final.
    /// </summary>
    private static TemplateQuestion SaltaSi(this TemplateQuestion pregunta, string opcion, string destino)
    {
        var indice = pregunta.Options.IndexOf(opcion);
        if (indice < 0)
            throw new InvalidOperationException($"'{pregunta.Title}' no tiene la opcion '{opcion}'.");

        while (pregunta.OptionJumps.Count < pregunta.Options.Count) pregunta.OptionJumps.Add(string.Empty);
        pregunta.OptionJumps[indice] = destino == Terminar ? Terminar : "@" + destino;
        return pregunta;
    }

    /// <summary>
    /// Pasa los saltos por titulo al formato de plantilla (la posicion de la
    /// pregunta destino). Si un titulo no existe o queda hacia atras, falla al
    /// arrancar en vez de dejar una plantilla que no salta.
    /// </summary>
    private static List<Template> ResolverSaltos(List<Template> plantillas)
    {
        foreach (var plantilla in plantillas)
        {
            for (var origen = 0; origen < plantilla.Questions.Count; origen++)
            {
                var pregunta = plantilla.Questions[origen];
                pregunta.OptionJumps = [.. pregunta.OptionJumps.Select(salto =>
                {
                    if (!salto.StartsWith('@')) return salto;

                    var destino = plantilla.Questions.FindIndex(q => q.Title == salto[1..]);
                    if (destino <= origen)
                        throw new InvalidOperationException(
                            $"Plantilla '{plantilla.Id}': el salto de '{pregunta.Title}' apunta a '{salto[1..]}', que no existe o esta antes.");

                    return destino.ToString(System.Globalization.CultureInfo.InvariantCulture);
                })];
            }
        }

        return plantillas;
    }
}
