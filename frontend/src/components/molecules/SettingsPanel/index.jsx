import styled from "styled-components";

/**
 * Piezas comunes de Mi cuenta y Configuracion: las dos paginas son listas de
 * secciones con filas de opcion, y tienen que verse igual.
 */

export const Page = styled.div`
  max-width: 820px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

export const HeaderInfo = styled.div`
  h1 {
    font-size: ${({ theme }) => theme.fontSizes["2xl"]};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    margin: 0 0 4px;
  }

  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.base};
    margin: 0;
  }
`;

export const HeaderIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 0;
  }

  p {
    margin: 2px 0 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const Option = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

export const OptionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const OptionIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const OptionText = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    margin-bottom: 2px;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
    overflow-wrap: anywhere;
  }
`;

/** Campos de formulario dentro de una seccion o de un modal. */
export const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: ${({ $flush }) => ($flush ? "0" : "20px 24px")};

  label {
    display: block;
    margin-bottom: 6px;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  input, select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-family: inherit;
    transition: border-color 0.15s;
    &:focus { border-color: ${({ theme }) => theme.colors.primary}; outline: none; }
  }
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

export const FieldError = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.danger};
`;

export const FieldActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
`;

export const Modal = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;
