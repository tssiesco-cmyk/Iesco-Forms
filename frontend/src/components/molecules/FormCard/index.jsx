import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { FiMoreHorizontal, FiEdit3, FiEye, FiBarChart2, FiTrash2, FiCopy } from "react-icons/fi";
import Badge from "../../atoms/Badge";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.borderInput};
    transform: translateY(-2px);
  }
`;

const Preview = styled.div`
  height: 120px;
  background: ${({ $color }) => $color || "linear-gradient(135deg, #6542F4 0%, #9B7DFF 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0 0;
  overflow: hidden;
`;

const PreviewIcon = styled.div`
  font-size: 32px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
`;

const CardBody = styled.div`
  padding: 16px 18px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  line-height: 1.3;
`;

const MenuWrapper = styled.div`
  position: relative;
`;

const MenuButton = styled.button`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 180px;
  padding: 6px;
  z-index: 100;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ $danger, theme }) => $danger ? theme.colors.danger : theme.colors.text};
  text-align: left;

  &:hover {
    background: ${({ $danger, theme }) => $danger ? theme.colors.dangerBg : theme.colors.surfaceAlt};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
  margin: 4px 0;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
`;

const MetaText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

function FormCard({ icon, title, date, responses, status, color, onClick, onEdit, onPreview, onResults, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setMenuOpen(false);
    action?.();
  };

  return (
    <Card onClick={onClick}>
      <Preview $color={color}>
        <PreviewIcon>{icon}</PreviewIcon>
      </Preview>
      <CardBody>
        <CardHeader>
          <Title>{title}</Title>
          <MenuWrapper ref={menuRef}>
            <MenuButton onClick={handleMenuClick}>
              <FiMoreHorizontal size={16} />
            </MenuButton>
            {menuOpen && (
              <Dropdown>
                {onEdit && (
                  <DropdownItem onClick={(e) => handleAction(e, onEdit)}>
                    <FiEdit3 size={14} /> Editar
                  </DropdownItem>
                )}
                {onPreview && (
                  <DropdownItem onClick={(e) => handleAction(e, onPreview)}>
                    <FiEye size={14} /> Vista previa
                  </DropdownItem>
                )}
                {onResults && (
                  <DropdownItem onClick={(e) => handleAction(e, onResults)}>
                    <FiBarChart2 size={14} /> Resultados
                  </DropdownItem>
                )}
                {onDuplicate && (
                  <DropdownItem onClick={(e) => handleAction(e, onDuplicate)}>
                    <FiCopy size={14} /> Duplicar
                  </DropdownItem>
                )}
                {onDelete && (
                  <>
                    <Divider />
                    <DropdownItem $danger onClick={(e) => handleAction(e, onDelete)}>
                      <FiTrash2 size={14} /> Eliminar
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            )}
          </MenuWrapper>
        </CardHeader>
        <MetaText>{date}</MetaText>
        <Meta>
          {responses !== undefined && <MetaText>{responses} respuestas</MetaText>}
          {status && (
            <Badge $variant={status === "Activo" ? "success" : "default"}>
              {status}
            </Badge>
          )}
        </Meta>
      </CardBody>
    </Card>
  );
}

export default FormCard;
