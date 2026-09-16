import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setUnauthorizedHandler } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // checking: aun no sabemos si hay sesion | authenticated | anonymous
  const [status, setStatus] = useState("checking");

  /**
   * Al arrancar preguntamos al servidor quien esta conectado. La sesion vive en
   * una cookie HttpOnly que el JavaScript no puede leer, asi que esta es la
   * unica forma de saberlo, y tambien la mas fiable: si la cookie caduco o el
   * backend se reinicio, aqui nos enteramos.
   */
  useEffect(() => {
    const controller = new AbortController();

    authApi
      .me({ signal: controller.signal })
      .then((profile) => {
        setUser(profile);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setUser(null);
        setStatus("anonymous");
      });

    return () => controller.abort();
  }, []);

  /**
   * Cualquier peticion que reciba un 401 significa que la sesion murio mientras
   * se usaba la aplicacion. Aqui no se navega a la portada a proposito: quien
   * estaba trabajando y se le caduco la sesion quiere volver a entrar, asi que
   * la ruta protegida lo lleva al login. Salir a la portada es solo para quien
   * cierra sesion queriendo.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    try {
      const profile = await authApi.login(email, password, rememberMe);
      setUser(profile);
      setStatus("authenticated");
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Aunque el servidor no conteste, la sesion local se cierra igual.
    }

    // Se navega antes de limpiar el estado. Si no, la ruta protegida ve que ya
    // no hay sesion y manda al login antes de que lleguemos a la portada.
    // React agrupa ambas cosas en el mismo render, asi que no hay parpadeo.
    navigate("/", { replace: true });

    setUser(null);
    setStatus("anonymous");
  }, [navigate]);

  /** Tras editar la cuenta, el servidor devuelve el perfil nuevo. */
  const updateProfile = useCallback((profile) => setUser(profile), []);

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === "authenticated",
    isAdmin: user?.role === "Administrador",
    login,
    logout,
    updateProfile,
  }), [user, status, login, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
