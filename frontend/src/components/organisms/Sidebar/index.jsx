import styled from "styled-components";
import { FiHome, FiEdit3, FiLayout, FiShare2, FiTrash2, FiSettings } from "react-icons/fi";
import NavItem from "../../molecules/NavItem";
import UserProfile from "../../molecules/UserProfile";
import Divider from "../../atoms/Divider";
import logo from "../../../assets/logoiescogroup.png";

const Aside = styled.aside`
  width: ${({ theme }) => theme.sidebar.width};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.sidebarBg};
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

function Sidebar() {
  return (
    <Aside>
      <Brand>
        <LogoImage src={logo} alt="Iesco" />
        <BrandName>Iesco Forms</BrandName>
      </Brand>

      <NavGroup>
        <NavItem to="/" icon={<FiHome />} label="Inicio" />
        <NavItem to="/formularios" icon={<FiEdit3 />} label="Mis formularios" />
        <NavItem to="/plantillas" icon={<FiLayout />} label="Plantillas" />

        <Divider $color="rgba(255,255,255,0.08)" $margin="12px 0" />

        <NavLabel>Mas</NavLabel>
        <NavItem to="/compartidos" icon={<FiShare2 />} label="Compartidos" />
        <NavItem to="/papelera" icon={<FiTrash2 />} label="Papelera" />
      </NavGroup>

      <SidebarBottom>
        <Divider $color="rgba(255,255,255,0.08)" $margin="8px 0" />
        <NavItem to="/configuracion" icon={<FiSettings />} label="Configuracion" />
        <UserProfile name="Adriano" role="Administrador" initial="A" />
      </SidebarBottom>
    </Aside>
  );
}

export default Sidebar;
