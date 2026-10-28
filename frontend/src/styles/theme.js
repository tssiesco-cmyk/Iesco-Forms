/**
 * Tokens compartidos por ambos temas. Solo cambian los colores y las sombras:
 * tipografia, espaciados y medidas se mantienen iguales en claro y oscuro.
 */
const base = {
  fonts: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  fontSizes: {
    xs: "11px",
    sm: "12px",
    md: "13px",
    base: "14px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "32px",
    "4xl": "40px",
    "5xl": "48px",
    "6xl": "64px",
  },

  radii: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "50%",
  },

  sidebar: {
    width: "260px",
    collapsedWidth: "72px",
  },

  breakpoints: {
    tablet: "1024px",
    mobile: "768px",
  },
};

const lightColors = {
  // El color de accion es casi negro: en tema claro un boton blanco sobre
  // fondo blanco no se distingue. En oscuro este mismo rol lo toma el blanco.
  primary: "#191919",
  primaryHover: "#000000",
  primaryLight: "#F0F0F4",
  primaryBg: "#F0F0F4",
  primaryDark: "#0A0A0A",

  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceHover: "#F4F4F6",
  surfaceAlt: "#F4F4F6",

  border: "#E8E8ED",
  borderLight: "#F0F0F4",
  borderInput: "#D1D1DB",
  borderFocus: "#191919",

  text: "#191919",
  textSecondary: "#4A4A57",
  textMuted: "#737380",
  textInverse: "#FFFFFF",

  success: "#2DB87F",
  successBg: "#EAFAF3",
  warning: "#F5A623",
  warningBg: "#FFF8EC",
  danger: "#E34850",
  dangerBg: "#FEF0F0",

  info: "#4F46E5",
  infoBg: "#EEF2FF",

  overlay: "rgba(0, 0, 0, 0.4)",

  // La barra lateral ahora sigue al tema en vez de quedarse siempre oscura.
  sidebarBg: "#FFFFFF",
  sidebarText: "#6B6B76",
  sidebarTextActive: "#191919",
  sidebarHover: "#F4F4F6",
  sidebarActive: "#EDEDF1",
  sidebarDivider: "#E8E8ED",
};

const darkColors = {
  primary: "#FFFFFF",
  primaryHover: "#E4E4EA",
  primaryLight: "#262631",
  primaryBg: "#262631",
  primaryDark: "#0A0A0E",

  background: "#0F0F13",
  surface: "#17171C",
  surfaceHover: "#22222A",
  surfaceAlt: "#212129",

  border: "#2C2C35",
  borderLight: "#24242C",
  borderInput: "#3A3A45",
  borderFocus: "#FFFFFF",

  text: "#EDEDF0",
  textSecondary: "#A0A0AA",
  textMuted: "#70707C",
  textInverse: "#0F0F13",

  success: "#3DD598",
  successBg: "#16302A",
  warning: "#F5B44C",
  warningBg: "#332811",
  danger: "#F0666E",
  dangerBg: "#341C20",

  info: "#8B8AF5",
  infoBg: "#232244",

  overlay: "rgba(0, 0, 0, 0.6)",

  sidebarBg: "#121216",
  sidebarText: "#8E8E9C",
  sidebarTextActive: "#FFFFFF",
  sidebarHover: "rgba(255, 255, 255, 0.06)",
  sidebarActive: "rgba(255, 255, 255, 0.11)",
  sidebarDivider: "rgba(255, 255, 255, 0.08)",
};

const lightShadows = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 4px 12px rgba(0, 0, 0, 0.08)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
  modal: "0 16px 48px rgba(0, 0, 0, 0.16)",
};

// En oscuro las sombras se refuerzan porque sobre fondos negros casi no se ven.
const darkShadows = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.4)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.55)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.6)",
  modal: "0 16px 48px rgba(0, 0, 0, 0.7)",
};

export const lightTheme = {
  ...base,
  mode: "light",
  colors: lightColors,
  shadows: lightShadows,
};

export const darkTheme = {
  ...base,
  mode: "dark",
  colors: darkColors,
  shadows: darkShadows,
};

export default lightTheme;
