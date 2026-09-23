import styled, { useTheme } from "styled-components";
import { FiHome, FiEdit3, FiLayout, FiShare2, FiTrash2, FiSettings } from "react-icons/fi";
import NavItem from "../../molecules/NavItem";
import UserProfile from "../../molecules/UserProfile";
import Divider from "../../atoms/Divider";
import { useAuth } from "../../../context/AuthContext";
import logo from "../../../assets/logoiescogroup.png";

const Aside = styled.aside`
  width: ${({ theme }) => theme.sidebar.width};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.sidebarBg};
  border-right: 1px solid ${({ theme }) => theme.colors.sidebarDivider};
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  padding: 20px 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: ${({ theme }) => theme.sidebar.collapsedWidth};
    padding: 20px 10px;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px 28px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    justify-content: center;
    padding: 8px 0 28px;
  }
`;

const LogoImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  object-fit: contain;
  flex-shrink: 0;
  /* El logo es blanco sobre transparente, hecho para fondo oscuro. En tema claro
     se invierte a negro; al ser monocromo la inversion no altera la marca. */
  filter: ${({ theme }) => (theme.mode === "light" ? "invert(1)" : "none")};
`;

const BrandName = styled.span`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.sidebarTextActive};
  letter-spacing: -0.3px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const NavGroup = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const NavLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.sidebarText};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 16px 14px 8px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const SidebarBottom = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/** Iniciales a partir del nombre: "Adriano Velasquez" -> "AV". */
function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Sidebar() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  return (
    <Aside>
      <Brand>
        <LogoImage src={logo} alt="IESCO" />
        <BrandName>IESCO Forms</BrandName>
      </Brand>

      <NavGroup>
        <NavItem to="/panel" icon={<FiHome />} label="Inicio" />
        <NavItem to="/formularios" icon={<FiEdit3 />} label="Mis formularios" />
        <NavItem to="/plantillas" icon={<FiLayout />} label="Plantillas" />

        <Divider $color={theme.colors.sidebarDivider} $margin="12px 0" />

        <NavLabel>Mas</NavLabel>
        <NavItem to="/compartidos" icon={<FiShare2 />} label="Compartidos" />
        <NavItem to="/papelera" icon={<FiTrash2 />} label="Papelera" />
      </NavGroup>

      <SidebarBottom>
        <Divider $color={theme.colors.sidebarDivider} $margin="8px 0" />
        <NavItem to="/configuracion" icon={<FiSettings />} label="Configuracion" />
        <UserProfile
          name={user?.displayName ?? "Sin sesion"}
          role={user?.role ?? ""}
          email={user?.email}
          initial={initialsOf(user?.displayName)}
          avatarUrl={user?.avatarUrl}
          onLogout={logout}
        />
      </SidebarBottom>
    </Aside>
  );
}

export default Sidebar;
