import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { FiSearch, FiBell } from "react-icons/fi";
import Avatar from "../../atoms/Avatar";

const Header = styled.header`
  height: 64px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
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

const AvatarButton = styled.button`
  margin-left: 8px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.full};
`;

const routeNames = {
  "/": "Inicio",
  "/formularios": "Mis formularios",
  "/plantillas": "Plantillas",
  "/compartidos": "Compartidos",
  "/papelera": "Papelera",
  "/configuracion": "Configuracion",
};

function TopBar() {
  const { pathname } = useLocation();
  const currentPage = routeNames[pathname] || "Inicio";

  return (
    <Header>
      <Breadcrumb>
        Iesco Forms / <strong>{currentPage}</strong>
      </Breadcrumb>
      <Actions>
        <IconButton><FiSearch size={18} /></IconButton>
        <IconButton><FiBell size={18} /></IconButton>
        <AvatarButton><Avatar $size={32}>A</Avatar></AvatarButton>
      </Actions>
    </Header>
  );
}

export default TopBar;
