import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { notificationsApi } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext();

/** Cada cuanto se consulta si hay avisos nuevos. */
const POLL_MS = 30000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  /**
   * El sondeo solo pide el numero, que es una respuesta minima. La lista
   * completa se carga cuando el usuario abre el panel.
   */
  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await notificationsApi.unreadCount();
      setUnreadCount(result?.count ?? 0);
    } catch {
      // Un fallo puntual del sondeo no merece molestar al usuario: el contador
      // se queda como estaba y se reintenta en la siguiente vuelta.
    }
  }, [isAuthenticated]);

  const loadList = useCallback(async (signal) => {
    if (!isAuthenticated) return;

    setStatus("loading");
    setError(null);

    try {
      const list = await notificationsApi.list(20, { signal });
      setItems(list ?? []);
      setUnreadCount((list ?? []).filter((n) => !n.readAt).length);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
      setStatus("error");
    }
  }, [isAuthenticated]);

  /**
   * Sondeo con dos cuidados: no corre sin sesion, y se detiene cuando la pestana
   * no esta visible. Sin lo segundo, una pestana olvidada machaca la API toda la
   * noche sin que nadie este mirando.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      setStatus("idle");
      return;
    }

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const start = () => {
      stop();
      refreshCount();
      timerRef.current = setInterval(refreshCount, POLL_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, refreshCount]);

  const markRead = useCallback(async (id) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.readAt) return;

    // Se marca al momento y se corrige si el servidor dice que no.
    const readAt = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationsApi.markRead(id);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)));
      setUnreadCount((c) => c + 1);
    }
  }, [items]);

  const markAllRead = useCallback(async () => {
    const previous = items;
    const readAt = new Date().toISOString();

    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllRead();
    } catch {
      setItems(previous);
      refreshCount();
    }
  }, [items, refreshCount]);

  const value = useMemo(() => ({
    items,
    unreadCount,
    status,
    error,
    loadList,
    refreshCount,
    markRead,
    markAllRead,
  }), [items, unreadCount, status, error, loadList, refreshCount, markRead, markAllRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
