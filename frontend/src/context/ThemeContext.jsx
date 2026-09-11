import { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "../styles/theme";

const ThemeModeContext = createContext();

const STORAGE_KEY = "iesco-forms-theme";

/**
 * Prioridad: lo que el usuario eligio antes > preferencia del sistema > claro.
 * Todo va dentro de try/catch porque localStorage puede fallar en ventanas
 * privadas o con las cookies bloqueadas.
 */
function getInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage no disponible, seguimos con la preferencia del sistema
  }

  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    // matchMedia no disponible
  }

  return "light";
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Si no se puede guardar, el tema igual funciona durante la sesion
    }
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <StyledThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
