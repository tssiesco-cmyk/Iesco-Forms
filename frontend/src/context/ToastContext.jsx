import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ToastList from "../components/molecules/Toast";

const ToastContext = createContext();

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { tone = "primary", duration = DEFAULT_DURATION, onRetry } = {}) => {
    const id = ++nextId.current;

    setToasts((prev) => {
      // Si el mismo mensaje ya esta en pantalla no lo repetimos: al fallar la red
      // varias operaciones seguidas se apilarian avisos identicos.
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, tone, onRetry }];
    });

    // Los avisos con accion de reintento esperan a que el usuario decida.
    if (duration > 0 && !onRetry) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }

    return id;
  }, [dismiss]);

  // Al desmontar, ningun temporizador debe quedar vivo.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({
    show,
    dismiss,
    success: (message, options) => show(message, { ...options, tone: "success" }),
    error: (message, options) => show(message, { ...options, tone: "danger", duration: 8000 }),
    info: (message, options) => show(message, { ...options, tone: "primary" }),
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
