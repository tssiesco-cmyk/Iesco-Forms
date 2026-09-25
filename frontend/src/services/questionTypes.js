/**
 * Todo lo que depende del tipo de pregunta, en un solo sitio: el editor, la
 * pantalla de responder, los resultados, el PDF y la exportacion a Excel lo
 * leen de aqui en vez de repetir sus propias listas.
 *
 * La logica condicional (nextQuestionIndex / visitedQuestionIds) tiene su
 * gemela en el backend (Services/FormLogic.cs). Tienen que decidir lo mismo:
 * el navegador elige que pregunta mostrar y el servidor cuales se exigen.
 */

export const QUESTION_TYPES = [
  { value: "short_text", label: "Texto corto" },
  { value: "long_text", label: "Texto largo" },
  { value: "single_choice", label: "Opcion unica" },
  { value: "multiple_choice", label: "Opcion multiple" },
  { value: "dropdown", label: "Lista desplegable" },
  { value: "yes_no", label: "Sí / No" },
  { value: "rating", label: "Calificacion" },
  { value: "nps", label: "NPS (0 a 10)" },
  { value: "number", label: "Numero" },
  { value: "date", label: "Fecha" },
];

export const TYPE_LABELS = Object.fromEntries(QUESTION_TYPES.map((t) => [t.value, t.label]));

/** Donde quien responde escribe libremente: solo ahi aplica el formato de mayusculas. */
export const TEXT_TYPES = ["short_text", "long_text"];

const OPTION_TYPES = ["single_choice", "multiple_choice", "dropdown", "yes_no"];
const SINGLE_OPTION_TYPES = ["single_choice", "dropdown", "yes_no"];

export const hasOptions = (type) => OPTION_TYPES.includes(type);

/** Se elige una sola opcion. Son las que admiten un salto por opcion. */
export const isSingleOption = (type) => SINGLE_OPTION_TYPES.includes(type);

/** Opciones que arma quien crea el formulario (yes_no las trae fijas). */
export const hasEditableOptions = (type) => hasOptions(type) && type !== "yes_no";

export const DEFAULT_SCALE = 5;
export const SCALE_CHOICES = [3, 4, 5, 6, 7, 8, 9, 10];

/** Salto que termina el formulario. */
export const JUMP_END = "end";

/**
 * Indice de la pregunta que va despues de la de `index`, o -1 si ahi termina.
 * El salto de la opcion elegida manda sobre el de la pregunta. Un salto hacia
 * atras (quedo asi al reordenar) o a una pregunta borrada se ignora.
 */
export function nextQuestionIndex(questions, index, answer) {
  const question = questions[index];
  let jump = question.jumpTo;

  if (isSingleOption(question.type) && typeof answer === "string") {
    const option = question.options.find((o) => o.id === answer);
    if (option?.jumpTo) jump = option.jumpTo;
  }

  if (jump === JUMP_END) return -1;

  if (jump) {
    const target = questions.findIndex((q) => q.id === jump);
    if (target > index) return target;
  }

  return index + 1 < questions.length ? index + 1 : -1;
}

/** Ids de las preguntas por las que pasa quien responde con estas respuestas. */
export function visitedQuestionIds(questions, answers) {
  const visited = [];
  let index = questions.length > 0 ? 0 : -1;

  while (index >= 0) {
    visited.push(questions[index].id);
    index = nextQuestionIndex(questions, index, answers[questions[index].id]);
  }

  return visited;
}

/** Si el formulario tiene algun salto configurado. */
export function hasLogic(questions) {
  return questions.some((q) => q.jumpTo || q.options?.some((o) => o.jumpTo));
}

export function isAnswered(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.toString().trim() !== "";
}

/**
 * Valores posibles de las escalas. Se usan como si fueran opciones para
 * contar y graficar igual que una pregunta de opcion unica.
 */
export function scaleValues(question) {
  if (question.type === "nps") return Array.from({ length: 11 }, (_, i) => i);
  if (question.type === "rating") {
    const max = question.scaleMax || DEFAULT_SCALE;
    return Array.from({ length: max }, (_, i) => i + 1);
  }
  return [];
}

export const isScale = (type) => type === "rating" || type === "nps";

/**
 * La pregunta tal como la necesitan los graficos: las de escala pasan a tener
 * una "opcion" por valor, con el valor como id (asi es como se guardan).
 */
export function chartQuestion(question) {
  if (!isScale(question.type)) return question;

  return {
    ...question,
    options: scaleValues(question).map((v) => ({
      id: String(v),
      text: question.type === "rating" ? `${v} ${v === 1 ? "estrella" : "estrellas"}` : String(v),
    })),
  };
}

/** Si los resultados de esta pregunta se muestran como grafico. */
export const isChartable = (type) => hasOptions(type) || isScale(type);

/** Promedio de una escala o de un numero; null si no hay valores. */
export function average(question, responses) {
  const values = responses
    .map((r) => r.answers?.[question.id])
    .filter(isAnswered)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Net Promoter Score: % de promotores (9-10) menos % de detractores (0-6).
 * Va de -100 a 100. Null si nadie respondio.
 */
export function npsScore(question, responses) {
  const values = responses
    .map((r) => r.answers?.[question.id])
    .filter(isAnswered)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  if (values.length === 0) return null;

  const promoters = values.filter((n) => n >= 9).length;
  const detractors = values.filter((n) => n <= 6).length;
  const pct = (n) => Math.round((n / values.length) * 100);

  return {
    score: pct(promoters) - pct(detractors),
    promoters: pct(promoters),
    passives: pct(values.length - promoters - detractors),
    detractors: pct(detractors),
  };
}

/** yyyy-mm-dd a "25 sept 2026", sin pasar por la zona horaria. */
export function formatDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Texto legible de una respuesta, para tablas, PDF y Excel. Las opciones pasan
 * de id a texto; las fechas se formatean; las estrellas llevan su maximo.
 */
export function answerText(question, value, empty = "") {
  if (!isAnswered(value)) return empty;

  if (hasOptions(question.type)) {
    const byId = Object.fromEntries(question.options.map((o) => [o.id, o.text]));
    const ids = Array.isArray(value) ? value : [value];
    return ids.map((id) => byId[id] ?? "(opcion eliminada)").join("; ");
  }

  if (question.type === "rating") return `${value} / ${question.scaleMax || DEFAULT_SCALE}`;
  if (question.type === "date") return formatDateValue(value.toString());

  return value.toString();
}
