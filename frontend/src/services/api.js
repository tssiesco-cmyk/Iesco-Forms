/**
 * Cliente HTTP de la aplicacion. Todo lo que hable con el backend pasa por aqui.
 *
 * En desarrollo las rutas salen contra /api y Vite las reenvia al backend
 * (ver vite.config.js). En produccion se puede apuntar a otro host con
 * VITE_API_URL sin tocar el codigo.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TIMEOUT_MS = 15000;

/**
 * Lo registra AuthContext. Cuando cualquier peticion recibe un 401, la sesion
 * murio y hay que echar al usuario al login, sin que cada pantalla lo controle.
 */
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/** Error con la informacion util del fallo: codigo, mensaje y detalles de validacion. */
export class ApiError extends Error {
  constructor(message, { status = 0, details = null, isNetwork = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.isNetwork = isNetwork;
  }

  /** Los 4xx son culpa de lo que se envio; reintentar sin cambiar nada no sirve. */
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * ASP.NET responde los errores como ProblemDetails. De ahi sacamos el mensaje
 * y, en las validaciones, la lista de campos que fallaron.
 */
function describeProblem(problem, status) {
  if (!problem) return `Error ${status}`;

  if (problem.errors && typeof problem.errors === "object") {
    const messages = Object.values(problem.errors).flat();
    if (messages.length > 0) return messages.join(" ");
  }

  return problem.detail || problem.title || `Error ${status}`;
}

async function request(method, path, body, { signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Si quien llama trae su propio signal (por ejemplo al desmontar una pagina),
  // lo encadenamos con el del timeout.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      // La sesion viaja en una cookie HttpOnly; sin esto el navegador no la manda.
      credentials: "include",
    });
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      // Distinguimos el corte por timeout del cancelado a proposito.
      if (signal?.aborted) throw error;
      throw new ApiError("El servidor tardo demasiado en responder.", { isNetwork: true });
    }

    throw new ApiError(
      "No se pudo conectar con el servidor. Comprueba que el backend este corriendo.",
      { isNetwork: true }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // Un cuerpo que no es JSON solo importa si ademas vino un error.
      if (!response.ok) throw new ApiError(text.slice(0, 200), { status: response.status });
    }
  }

  if (!response.ok) {
    // El propio login devuelve 401 con credenciales malas: ahi no hay sesion
    // que cerrar, el error lo muestra la pantalla.
    if (response.status === 401 && !path.startsWith("/auth/")) {
      onUnauthorized?.();
    }

    // 502/503/504 significan que el backend no esta respondiendo, no que la
    // peticion fuera mala: se tratan como fallo de conexion para que la interfaz
    // muestre "arranca el backend" en vez de un error de datos.
    throw new ApiError(describeProblem(payload, response.status), {
      status: response.status,
      details: payload?.errors ?? null,
      isNetwork: response.status === 502 || response.status === 503 || response.status === 504,
    });
  }

  return payload;
}

/**
  * Sube un archivo. No pasa por request() porque un multipart no lleva
  * Content-Type puesto a mano: el navegador tiene que anadir la frontera del
  * formulario y si lo escribimos nosotros se rompe.
  */
async function upload(path, file) {
  const body = new FormData();
  body.append("file", file);

  let response;
  try {
    response = await fetch(BASE_URL + path, { method: "POST", body, credentials: "include" });
  } catch {
    throw new ApiError("No se pudo subir el archivo. Comprueba tu conexion.", { isNetwork: true });
  }

  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { /* sin cuerpo */ }

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
    throw new ApiError(describeProblem(payload, response.status), { status: response.status });
  }

  return payload;
}

const get = (path, options) => request("GET", path, undefined, options);
const post = (path, body, options) => request("POST", path, body ?? {}, options);
const patch = (path, body, options) => request("PATCH", path, body ?? {}, options);
const del = (path, options) => request("DELETE", path, undefined, options);

export const formsApi = {
  list: (options) => get("/forms", options),
  getById: (id, options) => get(`/forms/${id}`, options),
  create: (title, description) => post("/forms", { title, description }),
  createFromTemplate: (templateId) => post(`/forms/from-template/${templateId}`),
  update: (id, changes) => patch(`/forms/${id}`, changes),
  trash: (id) => del(`/forms/${id}`),

  addQuestion: (formId, type) => post(`/forms/${formId}/questions`, { type }),
  updateQuestion: (formId, questionId, changes) =>
    patch(`/forms/${formId}/questions/${questionId}`, changes),
  deleteQuestion: (formId, questionId) => del(`/forms/${formId}/questions/${questionId}`),
  duplicateQuestion: (formId, questionId) =>
    post(`/forms/${formId}/questions/${questionId}/duplicate`),
  reorderQuestions: (formId, fromIndex, toIndex) =>
    post(`/forms/${formId}/questions/reorder`, { fromIndex, toIndex }),

  addOption: (formId, questionId) => post(`/forms/${formId}/questions/${questionId}/options`),
  updateOption: (formId, questionId, optionId, text) =>
    patch(`/forms/${formId}/questions/${questionId}/options/${optionId}`, { text }),
  deleteOption: (formId, questionId, optionId) =>
    del(`/forms/${formId}/questions/${questionId}/options/${optionId}`),

  uploadBackground: (formId, file) => upload(`/forms/${formId}/background`, file),
  uploadQuestionBackground: (formId, questionId, file) =>
    upload(`/forms/${formId}/questions/${questionId}/background`, file),
  removeQuestionBackground: (formId, questionId) =>
    del(`/forms/${formId}/questions/${questionId}/background`),
  uploadIntroBackground: (formId, file) => upload(`/forms/${formId}/intro-background`, file),
  removeIntroBackground: (formId) => del(`/forms/${formId}/intro-background`),
  removeBackground: (formId) => del(`/forms/${formId}/background`),
  updateBackground: (formId, changes) => patch(`/forms/${formId}/background`, changes),

  addIntroField: (formId, type) => post(`/forms/${formId}/intro-fields`, { type }),
  updateIntroField: (formId, fieldId, changes) =>
    patch(`/forms/${formId}/intro-fields/${fieldId}`, changes),
  removeIntroField: (formId, fieldId) => del(`/forms/${formId}/intro-fields/${fieldId}`),
};

export const responsesApi = {
  listByForm: (formId, options) => get(`/forms/${formId}/responses`, options),
  submit: (formId, answers, respondent) =>
    post(`/forms/${formId}/responses`, { answers, respondent }),
};

export const trashApi = {
  list: (options) => get("/trash", options),
  restore: (id) => post(`/trash/${id}/restore`),
  deletePermanently: (id) => del(`/trash/${id}`),
  empty: () => del("/trash"),
};

export const templatesApi = {
  list: (options) => get("/templates", options),
};

export const notificationsApi = {
  list: (limit = 20, options) => get(`/notifications?limit=${limit}`, options),
  /** Respuesta minima: la campana la pide cada poco. */
  unreadCount: (options) => get("/notifications/unread-count", options),
  markRead: (id) => post(`/notifications/${id}/read`),
  markAllRead: () => post("/notifications/read-all"),
};

export const authApi = {
  login: (email, password, rememberMe = false) =>
    post("/auth/login", { email, password, rememberMe }),
  logout: () => post("/auth/logout"),
  /** Devuelve el perfil si hay sesion viva; lanza 401 si no. */
  me: (options) => get("/auth/me", options),
};

export const healthApi = {
  check: (options) => get("/health", options),
};
