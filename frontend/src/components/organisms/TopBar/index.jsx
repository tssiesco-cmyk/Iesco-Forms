import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch, FiSun, FiMoon, FiSettings,
  FiUser, FiLogOut, FiChevronDown
} from "react-icons/fi";
import Avatar from "../../atoms/Avatar";
import NotificationsMenu from "../NotificationsMenu";
import GlobalSearch from "../GlobalSearch";
import { useThemeMode } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";

const Header = styled.header`
  height: 64px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  /* Por encima del contenido para que el menu no quede tapado por las tarjetas. */
  position: relative;
  z-index: 20;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 16px;
  }
`;

const Breadcrumb = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

/* --- MENU DE USUARIO --- */

const UserMenuWrapper = styled.div`
  position: relative;
  margin-left: 8px;
`;

const AvatarButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px 3px 3px;
  border-radius: 999px;
  border: 1px solid ${({ $open, theme }) => ($open ? theme.colors.borderInput : "transparent")};
  background: ${({ $open, theme }) => ($open ? theme.colors.surfaceAlt : "transparent")};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const Chevron = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 248px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 6px;
  z-index: 200;
  animation: ${dropIn} 0.15s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: 6px;
`;

const MenuIdentity = styled.div`
  min-width: 0;
  flex: 1;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
`;

const RoleTag = styled.span`
  display: inline-block;
  margin-top: 6px !important;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary} !important;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 2px 8px;
  border-radius: 20px;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 9px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ $danger, theme }) => ($danger ? theme.colors.danger : theme.colors.text)};
  text-align: left;
  transition: background 0.1s ease;

  &:hover {
    background: ${({ $danger, theme }) => ($danger ? theme.colors.dangerBg : theme.colors.surfaceAlt)};
  }

  svg { flex-shrink: 0; }
`;

const MenuItemHint = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
  margin: 6px 0;
`;

const routeNames = {
  "/panel": "Inicio",
  "/formularios": "Mis formularios",
  "/plantillas": "Plantillas",
  "/compartidos": "Compartidos",
  "/papelera": "Papelera",
  "/mi-cuenta": "Mi cuenta",
  "/configuracion": "Configuracion",
};

/** Iniciales a partir del nombre: "Adriano Velasquez" -> "AV". */
function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);

  // Ctrl+K (Cmd+K en Mac) abre el buscador desde cualquier pagina.
  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const currentPage = routeNames[pathname] || "Inicio";
  const isDark = mode === "dark";

  // Cerrar al pulsar fuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  // No hace falta cerrarlo al cambiar de pagina: navegar desde el propio menu
  // ya lo cierra, y hacerlo desde fuera cuenta como pulsacion externa.
  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <Header>
      <Breadcrumb>
        IESCO Forms / <strong>{currentPage}</strong>
      </Breadcrumb>

      <Actions>
        <IconButton title="Buscar (Ctrl+K)" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
          <FiSearch size={18} />
        </IconButton>
        <IconButton
          onClick={toggleMode}
          title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </IconButton>
        <NotificationsMenu />

        <UserMenuWrapper ref={menuRef}>
          <AvatarButton
            $open={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu de usuario"
          >
            <Avatar $size={32}>{initialsOf(user?.displayName)}</Avatar>
            <Chevron $open={menuOpen}><FiChevronDown size={15} /></Chevron>
          </AvatarButton>

          {menuOpen && (
            <Menu role="menu">
              <MenuHeader>
                <Avatar $size={38}>{initialsOf(user?.displayName)}</Avatar>
                <MenuIdentity>
                  <strong>{user?.displayName ?? "Sin sesion"}</strong>
                  <span>{user?.email}</span>
                  {user?.role && <RoleTag as="span">{user.role}</RoleTag>}
                </MenuIdentity>
              </MenuHeader>

              <MenuItem role="menuitem" onClick={() => go("/mi-cuenta")}>
                <FiUser size={15} /> Mi cuenta
              </MenuItem>

              <MenuItem role="menuitem" onClick={() => go("/configuracion")}>
                <FiSettings size={15} /> Configuracion
              </MenuItem>

              {/* El tema no cierra el menu: asi se ve el cambio al momento. */}
              <MenuItem role="menuitem" onClick={toggleMode}>
                {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
                Tema
                <MenuItemHint>{isDark ? "Oscuro" : "Claro"}</MenuItemHint>
              </MenuItem>

              <MenuDivider />

              <MenuItem role="menuitem" $danger onClick={() => { setMenuOpen(false); logout(); }}>
                <FiLogOut size={15} /> Cerrar sesion
              </MenuItem>
            </Menu>
          )}
        </UserMenuWrapper>
      </Actions>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </Header>
  );
}

export default TopBar;
