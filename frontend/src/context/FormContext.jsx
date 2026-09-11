import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { formsApi, responsesApi, templatesApi, trashApi } from "../services/api";
import { useToast } from "./ToastContext";
import { useNotifications } from "./NotificationsContext";

const FormContext = createContext();

/**
 * Espera antes de mandar al servidor lo que el usuario esta escribiendo.
 * Suficiente para no disparar una peticion por tecla, corto para que el
 * indicador de guardado no se quede colgado.
 */
const TYPING_DELAY = 600;

export function FormProvider({ children }) {
  const toast = useToast();
  const notifications = useNotifications();

  const [forms, setForms] = useState([]);
  const [trashedForms, setTrashedForms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [responsesByForm, setResponsesByForm] = useState({});

  // Carga inicial: loading -> ready | error
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Estado del guardado automatico: idle | saving | saved | error
  const [saveState, setSaveState] = useState("idle");

  // Escrituras pendientes de enviar (las que esperan a que pares de escribir)
  // y peticiones ya en vuelo. Van en refs porque no deben provocar renders.
  const pendingWrites = useRef(new Map());
  const inFlight = useRef(0);

  // El sondeo de la campana es cada 30 s. Cuando el cambio lo hace el propio
  // usuario, esperar tanto para ver su aviso se siente roto: se refresca el
  // contador justo despues de escribir, agrupando para no pedirlo por cada tecla.
  const countRefreshTimer = useRef(null);
  const scheduleCountRefresh = useCallback(() => {
    if (countRefreshTimer.current) clearTimeout(countRefreshTimer.current);
    countRefreshTimer.current = setTimeout(() => {
      countRefreshTimer.current = null;
      notifications?.refreshCount?.();
    }, 1200);
  }, [notifications]);

  useEffect(() => () => {
    if (countRefreshTimer.current) clearTimeout(countRefreshTimer.current);
  }, []);

  const refreshSaveState = useCallback(() => {
    if (pendingWrites.current.size === 0 && inFlight.current === 0) {
      setSaveState((prev) => (prev === "error" ? "error" : "saved"));
    } else {
      setSaveState("saving");
    }
  }, []);

  // --- Carga inicial ---

  const load = useCallback(async (signal) => {
    setStatus("loading");
    setError(null);

    try {
      const [formList, trashList, templateList] = await Promise.all([
        formsApi.list({ signal }),
        trashApi.list({ signal }),
        templatesApi.list({ signal }),
      ]);

      setForms(formList ?? []);
      setTrashedForms(trashList ?? []);
      setTemplates(templateList ?? []);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);

  // --- Utilidades internas ---

  /** Reemplaza un formulario en la lista dejando el resto igual. */
  const replaceForm = useCallback((updated) => {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }, []);

  /** Aplica un cambio local a un formulario sin pasar por el servidor. */
  const patchFormLocally = useCallback((formId, updater) => {
    setForms((prev) => prev.map((f) => (f.id === formId ? updater(f) : f)));
  }, []);

  /**
   * Vuelve a pedir un formulario al servidor. Se usa para deshacer un cambio
   * optimista que fallo: en vez de adivinar como revertir, tomamos la verdad.
   */
  const resyncForm = useCallback(async (formId) => {
    try {
      const fresh = await formsApi.getById(formId);
      if (fresh) replaceForm(fresh);
    } catch {
      // Si tampoco se puede leer, el aviso del fallo original ya se mostro.
    }
  }, [replaceForm]);

  /** Ejecuta una escritura inmediata llevando la cuenta para el indicador. */
  const runWrite = useCallback(async (action, errorMessage) => {
    inFlight.current += 1;
    setSaveState("saving");

    try {
      const result = await action();
      inFlight.current -= 1;
      setSaveState("idle");
      refreshSaveState();
      scheduleCountRefresh();
      return { ok: true, result };
    } catch (err) {
      inFlight.current -= 1;
      setSaveState("error");

      // Un 401 significa que ya no hay sesion (se cerro, o caduco). De eso se
      // encarga AuthContext llevando al login o a la portada; un aviso de "no se
      // pudo guardar" encima solo estorba.
      if (err.status !== 401) {
        toast.error(errorMessage ? `${errorMessage}: ${err.message}` : err.message);
      }

      return { ok: false, error: err };
    }
  }, [refreshSaveState, toast, scheduleCountRefresh]);

  /**
   * Agenda una escritura para dentro de un rato. Si llega otra con la misma
   * clave antes de que salga, sustituye a la anterior: al escribir un titulo
   * solo viaja el ultimo valor.
   */
  const scheduleWrite = useCallback((key, action, errorMessage) => {
    const existing = pendingWrites.current.get(key);
    if (existing) clearTimeout(existing.timer);

    const entry = { action, errorMessage };
    entry.timer = setTimeout(async () => {
      pendingWrites.current.delete(key);
      await runWrite(action, errorMessage);
    }, TYPING_DELAY);

    pendingWrites.current.set(key, entry);
    setSaveState("saving");
  }, [runWrite]);

  /** Manda ya todo lo que estaba esperando. */
  const flushPendingWrites = useCallback(() => {
    const entries = [...pendingWrites.current.values()];
    pendingWrites.current.clear();

    entries.forEach((entry) => {
      clearTimeout(entry.timer);
      runWrite(entry.action, entry.errorMessage);
    });
  }, [runWrite]);

  // Si la pestana se cierra con cambios sin mandar, los lanzamos igual. No se
  // puede esperar la respuesta, pero salen con muchas probabilidades de llegar.
  useEffect(() => {
    const handleUnload = () => {
      pendingWrites.current.forEach((entry) => {
        clearTimeout(entry.timer);
        entry.action();
      });
      pendingWrites.current.clear();
    };

    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      handleUnload();
    };
  }, []);

  // --- Lectura ---

  const getForm = useCallback((id) => forms.find((f) => f.id === id), [forms]);

  const getFormResponses = useCallback(
    (formId) => responsesByForm[formId] ?? [],
    [responsesByForm]
  );

  /** Las respuestas se piden solo cuando alguien entra a verlas. */
  const loadResponses = useCallback(async (formId, signal) => {
    try {
      const list = await responsesApi.listByForm(formId, { signal });
      setResponsesByForm((prev) => ({ ...prev, [formId]: list ?? [] }));
      return { ok: true };
    } catch (err) {
      if (err.name === "AbortError") return { ok: false, aborted: true };
      return { ok: false, error: err };
    }
  }, []);

  // --- Formularios ---

  const createForm = useCallback(async (title, description = "") => {
    const { ok, result } = await runWrite(
      () => formsApi.create(title, description),
      "No se pudo crear el formulario"
    );
    if (!ok) return null;

    setForms((prev) => [result, ...prev]);
    return result.id;
  }, [runWrite]);

  const createFormFromTemplate = useCallback(async (templateId) => {
    const { ok, result } = await runWrite(
      () => formsApi.createFromTemplate(templateId),
      "No se pudo crear el formulario desde la plantilla"
    );
    if (!ok) return null;

    setForms((prev) => [result, ...prev]);
    return result.id;
  }, [runWrite]);

  /**
   * Cambia titulo, descripcion o estado. El titulo se escribe letra a letra, asi
   * que el cambio se ve al instante y el envio espera; publicar o despublicar va
   * directo porque es una accion puntual.
   */
  const updateForm = useCallback((id, changes) => {
    patchFormLocally(id, (form) => ({ ...form, ...changes }));

    const immediate = "status" in changes;
    const send = () => formsApi.update(id, changes);

    if (immediate) {
      return runWrite(send, "No se pudo guardar el cambio").then((res) => {
        if (!res.ok) resyncForm(id);
        return res.ok;
      });
    }

    scheduleWrite(`form:${id}`, send, "No se pudo guardar el formulario");
    return Promise.resolve(true);
  }, [patchFormLocally, runWrite, scheduleWrite, resyncForm]);

  const trashForm = useCallback(async (id) => {
    const previous = forms.find((f) => f.id === id);
    if (!previous) return false;

    // Desaparece de la lista al momento; si falla, vuelve.
    setForms((prev) => prev.filter((f) => f.id !== id));

    const { ok } = await runWrite(() => formsApi.trash(id), "No se pudo eliminar el formulario");
    if (!ok) {
      setForms((prev) => [previous, ...prev]);
      return false;
    }

    setTrashedForms((prev) => [{ ...previous, trashedAt: new Date().toISOString() }, ...prev]);
    toast.success(`"${previous.title}" se movio a la papelera.`);
    return true;
  }, [forms, runWrite, toast]);

  // --- Papelera ---

  const restoreForm = useCallback(async (id) => {
    const previous = trashedForms.find((f) => f.id === id);
    if (!previous) return false;

    setTrashedForms((prev) => prev.filter((f) => f.id !== id));

    const { ok } = await runWrite(() => trashApi.restore(id), "No se pudo restaurar");
    if (!ok) {
      setTrashedForms((prev) => [previous, ...prev]);
      return false;
    }

    const { trashedAt: _trashedAt, ...restored } = previous;
    setForms((prev) => [restored, ...prev]);
    toast.success(`"${previous.title}" se restauro.`);
    return true;
  }, [trashedForms, runWrite, toast]);

  const permanentDeleteForm = useCallback(async (id) => {
    const previous = trashedForms.find((f) => f.id === id);
    setTrashedForms((prev) => prev.filter((f) => f.id !== id));

    const { ok } = await runWrite(
      () => trashApi.deletePermanently(id),
      "No se pudo eliminar definitivamente"
    );
    if (!ok) {
      if (previous) setTrashedForms((prev) => [previous, ...prev]);
      return false;
    }

    setResponsesByForm((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    return true;
  }, [trashedForms, runWrite]);

  const emptyTrash = useCallback(async () => {
    const previous = trashedForms;
    setTrashedForms([]);

    const { ok } = await runWrite(() => trashApi.empty(), "No se pudo vaciar la papelera");
    if (!ok) {
      setTrashedForms(previous);
      return false;
    }

    toast.success("Papelera vaciada.");
    return true;
  }, [trashedForms, runWrite, toast]);

  // --- Preguntas ---

  const addQuestion = useCallback(async (formId, type) => {
    const { ok, result } = await runWrite(
      () => formsApi.addQuestion(formId, type),
      "No se pudo agregar la pregunta"
    );
    if (!ok) return null;

    patchFormLocally(formId, (form) => ({ ...form, questions: [...form.questions, result] }));
    return result.id;
  }, [runWrite, patchFormLocally]);

  const updateQuestion = useCallback((formId, questionId, changes) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      questions: form.questions.map((q) => (q.id === questionId ? { ...q, ...changes } : q)),
    }));

    // "required" es un interruptor, no texto: no tiene sentido esperar.
    const isToggle = "required" in changes && Object.keys(changes).length === 1;
    const send = () => formsApi.updateQuestion(formId, questionId, changes);

    if (isToggle) {
      runWrite(send, "No se pudo guardar la pregunta").then((res) => {
        if (!res.ok) resyncForm(formId);
      });
    } else {
      scheduleWrite(`question:${formId}:${questionId}`, send, "No se pudo guardar la pregunta");
    }
  }, [patchFormLocally, runWrite, scheduleWrite, resyncForm]);

  const deleteQuestion = useCallback(async (formId, questionId) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      questions: form.questions.filter((q) => q.id !== questionId),
    }));

    const { ok } = await runWrite(
      () => formsApi.deleteQuestion(formId, questionId),
      "No se pudo eliminar la pregunta"
    );
    if (!ok) resyncForm(formId);
    return ok;
  }, [patchFormLocally, runWrite, resyncForm]);

  const reorderQuestions = useCallback(async (formId, fromIndex, toIndex) => {
    patchFormLocally(formId, (form) => {
      const questions = [...form.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      return { ...form, questions };
    });

    const { ok } = await runWrite(
      () => formsApi.reorderQuestions(formId, fromIndex, toIndex),
      "No se pudo reordenar"
    );
    if (!ok) resyncForm(formId);
  }, [patchFormLocally, runWrite, resyncForm]);

  // --- Opciones ---

  const addOption = useCallback(async (formId, questionId) => {
    const { ok, result } = await runWrite(
      () => formsApi.addOption(formId, questionId),
      "No se pudo agregar la opcion"
    );
    if (!ok) return null;

    patchFormLocally(formId, (form) => ({
      ...form,
      questions: form.questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, result] } : q
      ),
    }));
    return result.id;
  }, [runWrite, patchFormLocally]);

  const updateOption = useCallback((formId, questionId, optionId, text) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      questions: form.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)) }
          : q
      ),
    }));

    scheduleWrite(
      `option:${formId}:${questionId}:${optionId}`,
      () => formsApi.updateOption(formId, questionId, optionId, text),
      "No se pudo guardar la opcion"
    );
  }, [patchFormLocally, scheduleWrite]);

  const deleteOption = useCallback(async (formId, questionId, optionId) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      questions: form.questions.map((q) =>
        q.id === questionId ? { ...q, options: q.options.filter((o) => o.id !== optionId) } : q
      ),
    }));

    const { ok } = await runWrite(
      () => formsApi.deleteOption(formId, questionId, optionId),
      "No se pudo eliminar la opcion"
    );
    if (!ok) resyncForm(formId);
  }, [patchFormLocally, runWrite, resyncForm]);

  // --- Imagen de fondo ---

  const uploadBackground = useCallback(async (formId, file) => {
    const { ok, result } = await runWrite(
      () => formsApi.uploadBackground(formId, file),
      "No se pudo subir la imagen"
    );
    if (!ok) return false;

    replaceForm(result);
    toast.success("Fondo actualizado.");
    return true;
  }, [runWrite, replaceForm, toast]);

  const removeBackground = useCallback(async (formId) => {
    const { ok, result } = await runWrite(
      () => formsApi.removeBackground(formId),
      "No se pudo quitar el fondo"
    );
    if (!ok) return false;

    replaceForm(result);
    return true;
  }, [runWrite, replaceForm]);

  const setBackgroundOverlay = useCallback(async (formId, overlay) => {
    patchFormLocally(formId, (form) => ({ ...form, backgroundOverlay: overlay }));

    const { ok } = await runWrite(
      () => formsApi.updateBackground(formId, { overlay }),
      "No se pudo guardar el ajuste"
    );
    if (!ok) resyncForm(formId);
  }, [patchFormLocally, runWrite, resyncForm]);

  /** Alterna entre una sola imagen para todo y una por pregunta. */
  const setBackgroundPerQuestion = useCallback(async (formId, perQuestion) => {
    patchFormLocally(formId, (form) => ({ ...form, backgroundPerQuestion: perQuestion }));

    const { ok } = await runWrite(
      () => formsApi.updateBackground(formId, { perQuestion }),
      "No se pudo guardar el ajuste"
    );
    if (!ok) resyncForm(formId);
  }, [patchFormLocally, runWrite, resyncForm]);

  const uploadQuestionBackground = useCallback(async (formId, questionId, file) => {
    const { ok, result } = await runWrite(
      () => formsApi.uploadQuestionBackground(formId, questionId, file),
      "No se pudo subir la imagen"
    );
    if (!ok) return false;

    replaceForm(result);
    return true;
  }, [runWrite, replaceForm]);

  const uploadIntroBackground = useCallback(async (formId, file) => {
    const { ok, result } = await runWrite(
      () => formsApi.uploadIntroBackground(formId, file),
      "No se pudo subir la imagen"
    );
    if (!ok) return false;

    replaceForm(result);
    return true;
  }, [runWrite, replaceForm]);

  const removeIntroBackground = useCallback(async (formId) => {
    const { ok, result } = await runWrite(
      () => formsApi.removeIntroBackground(formId),
      "No se pudo quitar la imagen"
    );
    if (!ok) return false;

    replaceForm(result);
    return true;
  }, [runWrite, replaceForm]);

  const removeQuestionBackground = useCallback(async (formId, questionId) => {
    const { ok, result } = await runWrite(
      () => formsApi.removeQuestionBackground(formId, questionId),
      "No se pudo quitar la imagen"
    );
    if (!ok) return false;

    replaceForm(result);
    return true;
  }, [runWrite, replaceForm]);

  // --- Campos del respondedor ---

  const addIntroField = useCallback(async (formId, type = "text") => {
    const { ok, result } = await runWrite(
      () => formsApi.addIntroField(formId, type),
      "No se pudo agregar el campo"
    );
    if (!ok) return null;

    patchFormLocally(formId, (form) => ({ ...form, introFields: [...form.introFields, result] }));
    return result.id;
  }, [runWrite, patchFormLocally]);

  const updateIntroField = useCallback((formId, fieldId, changes) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      introFields: form.introFields.map((f) => (f.id === fieldId ? { ...f, ...changes } : f)),
    }));

    const isToggle = "enabled" in changes || "required" in changes;
    const send = () => formsApi.updateIntroField(formId, fieldId, changes);

    if (isToggle) {
      runWrite(send, "No se pudo guardar el campo").then((res) => {
        if (!res.ok) resyncForm(formId);
      });
    } else {
      scheduleWrite(`introField:${formId}:${fieldId}`, send, "No se pudo guardar el campo");
    }
  }, [patchFormLocally, runWrite, scheduleWrite, resyncForm]);

  const removeIntroField = useCallback(async (formId, fieldId) => {
    patchFormLocally(formId, (form) => ({
      ...form,
      introFields: form.introFields.filter((f) => f.id !== fieldId),
    }));

    const { ok } = await runWrite(
      () => formsApi.removeIntroField(formId, fieldId),
      "No se pudo eliminar el campo"
    );
    if (!ok) resyncForm(formId);
  }, [patchFormLocally, runWrite, resyncForm]);

  // --- Respuestas ---

  /**
   * Enviar una respuesta no es un guardado de fondo: quien responde tiene que
   * saber si llego o no, asi que devolvemos el error para que la vista lo muestre.
   */
  const addResponse = useCallback(async (formId, answers, respondent = {}) => {
    try {
      const created = await responsesApi.submit(formId, answers, respondent);

      setResponsesByForm((prev) =>
        prev[formId] ? { ...prev, [formId]: [created, ...prev[formId]] } : prev
      );
      patchFormLocally(formId, (form) => ({
        ...form,
        responseCount: (form.responseCount ?? 0) + 1,
      }));

      return { ok: true, response: created };
    } catch (err) {
      return { ok: false, error: err };
    }
  }, [patchFormLocally]);

  const value = {
    // datos
    forms,
    trashedForms,
    templates,
    // estado de carga
    status,
    error,
    reload,
    // estado de guardado
    saveState,
    flushPendingWrites,
    // lectura
    getForm,
    getFormResponses,
    loadResponses,
    // escritura
    createForm,
    createFormFromTemplate,
    updateForm,
    trashForm,
    restoreForm,
    permanentDeleteForm,
    emptyTrash,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    addOption,
    updateOption,
    deleteOption,
    addIntroField,
    updateIntroField,
    removeIntroField,
    uploadBackground,
    removeBackground,
    setBackgroundOverlay,
    setBackgroundPerQuestion,
    uploadQuestionBackground,
    removeQuestionBackground,
    uploadIntroBackground,
    removeIntroBackground,
    addResponse,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useForms() {
  return useContext(FormContext);
}
