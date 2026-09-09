import { createContext, useContext, useState } from "react";

const FormContext = createContext();

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultIntroFields = [
  { id: "name", type: "name", label: "Nombre completo", placeholder: "Escribe tu nombre", required: true, enabled: true },
  { id: "phone", type: "phone", label: "Telefono", placeholder: "Ej: 0412-1234567", required: false, enabled: true },
  { id: "email", type: "email", label: "Correo electronico", placeholder: "correo@ejemplo.com", required: true, enabled: true },
];

const defaultForms = [
  {
    id: "demo-1",
    title: "Encuesta de satisfaccion",
    description: "Ayudanos a mejorar nuestro servicio",
    status: "Activo",
    createdAt: "2026-09-09",
    introFields: defaultIntroFields.map((f) => ({ ...f })),
    questions: [
      {
        id: "q1",
        type: "single_choice",
        title: "Como calificarias nuestro servicio?",
        description: "",
        required: true,
        options: [
          { id: "o1", text: "Excelente" },
          { id: "o2", text: "Bueno" },
          { id: "o3", text: "Regular" },
          { id: "o4", text: "Malo" },
        ],
      },
      {
        id: "q2",
        type: "multiple_choice",
        title: "Que aspectos te gustaron? (puedes elegir varios)",
        description: "",
        required: false,
        options: [
          { id: "o5", text: "Atencion al cliente" },
          { id: "o6", text: "Calidad del producto" },
          { id: "o7", text: "Tiempo de entrega" },
          { id: "o8", text: "Precio" },
        ],
      },
      {
        id: "q3",
        type: "short_text",
        title: "Como te llamas?",
        description: "",
        required: true,
        options: [],
      },
      {
        id: "q4",
        type: "long_text",
        title: "Tienes algun comentario adicional?",
        description: "Cuentanos lo que quieras, toda opinion es valiosa.",
        required: false,
        options: [],
      },
    ],
  },
  {
    id: "demo-2",
    title: "Registro de clientes",
    description: "Formulario de registro",
    status: "Activo",
    createdAt: "2026-09-08",
    introFields: defaultIntroFields.map((f) => ({ ...f })),
    questions: [
      {
        id: "q5",
        type: "short_text",
        title: "Nombre completo",
        description: "",
        required: true,
        options: [],
      },
      {
        id: "q6",
        type: "short_text",
        title: "Correo electronico",
        description: "",
        required: true,
        options: [],
      },
      {
        id: "q7",
        type: "single_choice",
        title: "Como nos conociste?",
        description: "",
        required: false,
        options: [
          { id: "o9", text: "Redes sociales" },
          { id: "o10", text: "Recomendacion" },
          { id: "o11", text: "Google" },
          { id: "o12", text: "Otro" },
        ],
      },
    ],
  },
];

const defaultResponses = [
  { id: "r1", formId: "demo-1", submittedAt: "2026-09-09T10:30:00", respondent: { name: "Carlos Martinez", email: "carlos@email.com" }, answers: { q1: "o1", q2: ["o5", "o6"], q3: "Carlos Martinez", q4: "Excelente servicio, muy recomendado." } },
  { id: "r2", formId: "demo-1", submittedAt: "2026-09-09T09:15:00", respondent: { name: "Maria Lopez", email: "maria@email.com" }, answers: { q1: "o2", q2: ["o6", "o7"], q3: "Maria Lopez", q4: "Todo bien, podrian mejorar los tiempos." } },
  { id: "r3", formId: "demo-1", submittedAt: "2026-09-08T16:45:00", respondent: { name: "Ana Garcia", email: "ana@email.com" }, answers: { q1: "o1", q2: ["o5", "o6", "o8"], q3: "Ana Garcia", q4: "" } },
  { id: "r4", formId: "demo-1", submittedAt: "2026-09-08T14:20:00", respondent: { name: "Pedro Ruiz", email: "pedro@email.com" }, answers: { q1: "o3", q2: ["o7"], q3: "Pedro Ruiz", q4: "La entrega tardo mas de lo esperado." } },
  { id: "r5", formId: "demo-1", submittedAt: "2026-09-08T11:00:00", respondent: { name: "Laura Diaz", email: "laura@email.com" }, answers: { q1: "o2", q2: ["o5", "o8"], q3: "Laura Diaz", q4: "Buen precio y atencion amable." } },
  { id: "r6", formId: "demo-1", submittedAt: "2026-09-07T18:30:00", respondent: { name: "Diego Torres", email: "diego@email.com" }, answers: { q1: "o1", q2: ["o5", "o6", "o7", "o8"], q3: "Diego Torres", q4: "Todo perfecto, 10/10." } },
  { id: "r7", formId: "demo-1", submittedAt: "2026-09-07T15:10:00", respondent: { name: "Sofia Herrera", email: "sofia@email.com" }, answers: { q1: "o2", q2: ["o6"], q3: "Sofia Herrera", q4: "" } },
  { id: "r8", formId: "demo-1", submittedAt: "2026-09-07T10:05:00", respondent: { name: "Miguel Sanchez", email: "miguel@email.com" }, answers: { q1: "o4", q2: [], q3: "Miguel Sanchez", q4: "No quede satisfecho con la compra." } },
  { id: "r9", formId: "demo-1", submittedAt: "2026-09-06T14:50:00", respondent: { name: "Valentina Mora", email: "valentina@email.com" }, answers: { q1: "o1", q2: ["o5", "o7"], q3: "Valentina Mora", q4: "Rapido y eficiente." } },
  { id: "r10", formId: "demo-1", submittedAt: "2026-09-06T09:30:00", respondent: { name: "Andres Jimenez", email: "andres@email.com" }, answers: { q1: "o2", q2: ["o5", "o6"], q3: "Andres Jimenez", q4: "" } },
  { id: "r11", formId: "demo-1", submittedAt: "2026-09-05T17:20:00", respondent: { name: "Camila Rojas", email: "camila@email.com" }, answers: { q1: "o1", q2: ["o6", "o8"], q3: "Camila Rojas", q4: "Productos de calidad." } },
  { id: "r12", formId: "demo-1", submittedAt: "2026-09-05T12:00:00", respondent: { name: "Ricardo Vargas", email: "ricardo@email.com" }, answers: { q1: "o3", q2: ["o7"], q3: "Ricardo Vargas", q4: "Podrian mejorar el empaque." } },
  { id: "r13", formId: "demo-2", submittedAt: "2026-09-09T08:00:00", respondent: { name: "Elena Castillo", email: "elena@email.com" }, answers: { q5: "Elena Castillo", q6: "elena@email.com", q7: "o9" } },
  { id: "r14", formId: "demo-2", submittedAt: "2026-09-08T10:30:00", respondent: { name: "Fernando Ortiz", email: "fernando@email.com" }, answers: { q5: "Fernando Ortiz", q6: "fernando@email.com", q7: "o10" } },
  { id: "r15", formId: "demo-2", submittedAt: "2026-09-07T14:00:00", respondent: { name: "Isabella Mendez", email: "isabella@email.com" }, answers: { q5: "Isabella Mendez", q6: "isabella@email.com", q7: "o11" } },
  { id: "r16", formId: "demo-2", submittedAt: "2026-09-06T16:45:00", respondent: { name: "Gabriel Pena", email: "gabriel@email.com" }, answers: { q5: "Gabriel Pena", q6: "gabriel@email.com", q7: "o9" } },
  { id: "r17", formId: "demo-2", submittedAt: "2026-09-05T09:15:00", respondent: { name: "Natalia Cruz", email: "natalia@email.com" }, answers: { q5: "Natalia Cruz", q6: "natalia@email.com", q7: "o10" } },
  { id: "r18", formId: "demo-2", submittedAt: "2026-09-04T11:30:00", respondent: { name: "Sebastian Luna", email: "sebastian@email.com" }, answers: { q5: "Sebastian Luna", q6: "sebastian@email.com", q7: "o11" } },
];

const templates = [
  {
    id: "tpl-satisfaction",
    name: "Encuesta de satisfaccion",
    description: "Mide la satisfaccion de tus clientes con tu producto o servicio.",
    category: "Feedback",
    questions: [
      { type: "single_choice", title: "En general, que tan satisfecho estas con nuestro servicio?", required: true, options: ["Muy satisfecho", "Satisfecho", "Neutral", "Insatisfecho", "Muy insatisfecho"] },
      { type: "single_choice", title: "Recomendarias nuestro servicio a un amigo o colega?", required: true, options: ["Definitivamente si", "Probablemente si", "No estoy seguro", "Probablemente no", "Definitivamente no"] },
      { type: "multiple_choice", title: "Que aspectos valoras mas? (elige todos los que apliquen)", required: false, options: ["Calidad", "Precio", "Atencion al cliente", "Rapidez", "Facilidad de uso"] },
      { type: "long_text", title: "Que podriamos mejorar?", required: false, options: [] },
    ],
  },
  {
    id: "tpl-nps",
    name: "Encuesta NPS",
    description: "Net Promoter Score: mide la lealtad de tus clientes.",
    category: "Feedback",
    questions: [
      { type: "single_choice", title: "Del 1 al 10, que tan probable es que nos recomiendes?", required: true, options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
      { type: "single_choice", title: "Cual es la razon principal de tu puntuacion?", required: true, options: ["Calidad del producto", "Servicio al cliente", "Precio", "Experiencia general", "Otro"] },
      { type: "long_text", title: "Cuentanos mas sobre tu experiencia", required: false, options: [] },
    ],
  },
  {
    id: "tpl-event-feedback",
    name: "Feedback de evento",
    description: "Recopila opiniones despues de un evento o conferencia.",
    category: "Feedback",
    questions: [
      { type: "single_choice", title: "Como calificarias el evento en general?", required: true, options: ["Excelente", "Muy bueno", "Bueno", "Regular", "Malo"] },
      { type: "multiple_choice", title: "Que sesiones te parecieron mas utiles?", required: false, options: ["Conferencia principal", "Talleres", "Networking", "Panel de expertos", "Demostraciones"] },
      { type: "single_choice", title: "Asistiras a futuros eventos?", required: true, options: ["Definitivamente", "Probablemente", "No estoy seguro", "Probablemente no"] },
      { type: "long_text", title: "Sugerencias para mejorar futuros eventos", required: false, options: [] },
    ],
  },
  {
    id: "tpl-contact",
    name: "Formulario de contacto",
    description: "Permite que tus visitantes se comuniquen contigo.",
    category: "Contacto",
    questions: [
      { type: "short_text", title: "Nombre completo", required: true, options: [] },
      { type: "short_text", title: "Correo electronico", required: true, options: [] },
      { type: "short_text", title: "Telefono (opcional)", required: false, options: [] },
      { type: "single_choice", title: "Motivo del contacto", required: true, options: ["Consulta general", "Soporte tecnico", "Ventas", "Alianzas", "Otro"] },
      { type: "long_text", title: "Tu mensaje", required: true, options: [] },
    ],
  },
  {
    id: "tpl-registration",
    name: "Registro de evento",
    description: "Registra asistentes para tu proximo evento.",
    category: "Contacto",
    questions: [
      { type: "short_text", title: "Nombre completo", required: true, options: [] },
      { type: "short_text", title: "Correo electronico", required: true, options: [] },
      { type: "short_text", title: "Empresa / Organizacion", required: false, options: [] },
      { type: "single_choice", title: "Tipo de entrada", required: true, options: ["General", "VIP", "Estudiante", "Prensa"] },
      { type: "multiple_choice", title: "Sesiones de interes", required: false, options: ["Conferencia principal", "Taller A", "Taller B", "Networking", "Demo en vivo"] },
      { type: "single_choice", title: "Necesitas algun requerimiento especial?", required: false, options: ["No", "Accesibilidad", "Dieta especial", "Otro"] },
    ],
  },
  {
    id: "tpl-job",
    name: "Solicitud de empleo",
    description: "Recibe postulaciones de candidatos interesados.",
    category: "Contacto",
    questions: [
      { type: "short_text", title: "Nombre completo", required: true, options: [] },
      { type: "short_text", title: "Correo electronico", required: true, options: [] },
      { type: "short_text", title: "Telefono", required: true, options: [] },
      { type: "single_choice", title: "Puesto al que aplicas", required: true, options: ["Desarrollador", "Disenador", "Marketing", "Ventas", "Administracion", "Otro"] },
      { type: "single_choice", title: "Anos de experiencia", required: true, options: ["Sin experiencia", "1-2 anos", "3-5 anos", "5-10 anos", "Mas de 10 anos"] },
      { type: "long_text", title: "Cuentanos sobre ti y por que te interesa esta posicion", required: true, options: [] },
    ],
  },
  {
    id: "tpl-quiz",
    name: "Quiz de conocimiento",
    description: "Evalua el conocimiento de tu audiencia sobre un tema.",
    category: "Evaluacion",
    questions: [
      { type: "single_choice", title: "Pregunta 1: Cual es la capital de Francia?", required: true, options: ["Londres", "Paris", "Berlin", "Madrid"] },
      { type: "single_choice", title: "Pregunta 2: En que ano llego el hombre a la luna?", required: true, options: ["1965", "1969", "1972", "1975"] },
      { type: "multiple_choice", title: "Pregunta 3: Cuales son lenguajes de programacion? (elige todos)", required: true, options: ["Python", "HTML", "JavaScript", "Photoshop", "Rust"] },
      { type: "short_text", title: "Pregunta 4: Cuantos planetas tiene el sistema solar?", required: true, options: [] },
    ],
  },
  {
    id: "tpl-performance",
    name: "Evaluacion de desempeno",
    description: "Evalua el rendimiento de los miembros de tu equipo.",
    category: "Evaluacion",
    questions: [
      { type: "short_text", title: "Nombre del evaluado", required: true, options: [] },
      { type: "single_choice", title: "Cumplimiento de objetivos", required: true, options: ["Supera expectativas", "Cumple expectativas", "Parcialmente", "No cumple"] },
      { type: "single_choice", title: "Trabajo en equipo", required: true, options: ["Excelente", "Bueno", "Aceptable", "Necesita mejorar"] },
      { type: "single_choice", title: "Comunicacion", required: true, options: ["Excelente", "Bueno", "Aceptable", "Necesita mejorar"] },
      { type: "multiple_choice", title: "Areas de fortaleza", required: false, options: ["Liderazgo", "Creatividad", "Resolucion de problemas", "Puntualidad", "Proactividad"] },
      { type: "long_text", title: "Comentarios adicionales y plan de mejora", required: false, options: [] },
    ],
  },
  {
    id: "tpl-market",
    name: "Investigacion de mercado",
    description: "Conoce las preferencias y necesidades de tu mercado.",
    category: "Evaluacion",
    questions: [
      { type: "single_choice", title: "Cual es tu rango de edad?", required: true, options: ["18-24", "25-34", "35-44", "45-54", "55+"] },
      { type: "single_choice", title: "Con que frecuencia usas productos como el nuestro?", required: true, options: ["Diariamente", "Semanalmente", "Mensualmente", "Raramente", "Nunca"] },
      { type: "multiple_choice", title: "Que factores consideras al elegir un producto?", required: true, options: ["Precio", "Calidad", "Marca", "Recomendaciones", "Diseno", "Funcionalidad"] },
      { type: "single_choice", title: "Cuanto estarias dispuesto a pagar?", required: true, options: ["Menos de $10", "$10-$25", "$25-$50", "$50-$100", "Mas de $100"] },
      { type: "long_text", title: "Que caracteristicas te gustaria ver en un producto ideal?", required: false, options: [] },
    ],
  },
];

export function FormProvider({ children }) {
  const [forms, setForms] = useState(defaultForms);
  const [trashedForms, setTrashedForms] = useState([]);
  const [responses, setResponses] = useState(defaultResponses);

  const getForm = (id) => forms.find((f) => f.id === id);

  const getFormResponses = (formId) => responses.filter((r) => r.formId === formId);

  const createForm = (title, description = "") => {
    const newForm = {
      id: generateId(),
      title: title || "Formulario sin titulo",
      description,
      status: "Borrador",
      createdAt: new Date().toISOString().split("T")[0],
      introFields: defaultIntroFields.map((f) => ({ ...f })),
      questions: [],
    };
    setForms((prev) => [newForm, ...prev]);
    return newForm.id;
  };

  const createFormFromTemplate = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return null;

    const newForm = {
      id: generateId(),
      title: template.name,
      description: template.description,
      status: "Borrador",
      createdAt: new Date().toISOString().split("T")[0],
      introFields: defaultIntroFields.map((f) => ({ ...f })),
      questions: template.questions.map((q) => ({
        id: generateId(),
        type: q.type,
        title: q.title,
        description: "",
        required: q.required,
        options: q.options.map((text) => ({ id: generateId(), text })),
      })),
    };
    setForms((prev) => [newForm, ...prev]);
    return newForm.id;
  };

  const addResponse = (formId, answers, respondent = {}) => {
    const newResponse = {
      id: generateId(),
      formId,
      submittedAt: new Date().toISOString(),
      respondent,
      answers,
    };
    setResponses((prev) => [newResponse, ...prev]);
  };

  const updateForm = (id, updates) => {
    setForms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const trashForm = (id) => {
    const form = forms.find((f) => f.id === id);
    if (form) {
      setTrashedForms((prev) => [{ ...form, trashedAt: new Date().toISOString() }, ...prev]);
      setForms((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const restoreForm = (id) => {
    const form = trashedForms.find((f) => f.id === id);
    if (form) {
      const { trashedAt, ...restored } = form;
      setForms((prev) => [restored, ...prev]);
      setTrashedForms((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const permanentDeleteForm = (id) => {
    setTrashedForms((prev) => prev.filter((f) => f.id !== id));
    setResponses((prev) => prev.filter((r) => r.formId !== id));
  };

  const emptyTrash = () => {
    const trashedIds = trashedForms.map((f) => f.id);
    setTrashedForms([]);
    setResponses((prev) => prev.filter((r) => !trashedIds.includes(r.formId)));
  };

  const updateIntroField = (formId, fieldId, updates) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              introFields: f.introFields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
            }
          : f
      )
    );
  };

  const addIntroField = (formId, type = "text") => {
    const labels = {
      name: { label: "Nombre completo", placeholder: "Escribe tu nombre", required: true },
      phone: { label: "Telefono", placeholder: "Ej: 0412-1234567", required: false },
      email: { label: "Correo electronico", placeholder: "correo@ejemplo.com", required: true },
      text: { label: "Nuevo campo", placeholder: "Escribe aqui...", required: false },
    };
    const config = labels[type] || labels.text;
    const newField = {
      id: generateId(),
      type,
      label: config.label,
      placeholder: config.placeholder,
      required: config.required,
      enabled: true,
    };
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, introFields: [...f.introFields, newField] }
          : f
      )
    );
  };

  const removeIntroField = (formId, fieldId) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, introFields: f.introFields.filter((field) => field.id !== fieldId) }
          : f
      )
    );
  };

  const addQuestion = (formId, type) => {
    const question = {
      id: generateId(),
      type,
      title: "",
      description: "",
      required: false,
      options:
        type === "single_choice" || type === "multiple_choice"
          ? [
              { id: generateId(), text: "Opcion 1" },
              { id: generateId(), text: "Opcion 2" },
            ]
          : [],
    };
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, questions: [...f.questions, question] }
          : f
      )
    );
    return question.id;
  };

  const updateQuestion = (formId, questionId, updates) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : f
      )
    );
  };

  const deleteQuestion = (formId, questionId) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? { ...f, questions: f.questions.filter((q) => q.id !== questionId) }
          : f
      )
    );
  };

  const reorderQuestions = (formId, fromIndex, toIndex) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id !== formId) return f;
        const questions = [...f.questions];
        const [moved] = questions.splice(fromIndex, 1);
        questions.splice(toIndex, 0, moved);
        return { ...f, questions };
      })
    );
  };

  const addOption = (formId, questionId) => {
    const newOption = { id: generateId(), text: "" };
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId
                  ? { ...q, options: [...q.options, newOption] }
                  : q
              ),
            }
          : f
      )
    );
  };

  const updateOption = (formId, questionId, optionId, text) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((o) =>
                        o.id === optionId ? { ...o, text } : o
                      ),
                    }
                  : q
              ),
            }
          : f
      )
    );
  };

  const deleteOption = (formId, questionId, optionId) => {
    setForms((prev) =>
      prev.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId
                  ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
                  : q
              ),
            }
          : f
      )
    );
  };

  return (
    <FormContext.Provider
      value={{
        forms,
        trashedForms,
        templates,
        responses,
        getForm,
        getFormResponses,
        createForm,
        createFormFromTemplate,
        updateForm,
        trashForm,
        restoreForm,
        permanentDeleteForm,
        emptyTrash,
        updateIntroField,
        addIntroField,
        removeIntroField,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        addOption,
        updateOption,
        deleteOption,
        addResponse,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForms() {
  return useContext(FormContext);
}
