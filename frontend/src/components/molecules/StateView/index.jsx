import styled, { keyframes } from "styled-components";
import { FiAlertTriangle, FiRefreshCw, FiWifiOff } from "react-icons/fi";
import Button from "../../atoms/Button";
import Spinner from "../../atoms/Spinner";

const Wrapper = styled.div`
  text-align: center;
  padding: ${({ $compact }) => ($compact ? "32px 24px" : "64px 24px")};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const IconCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.surfaceAlt};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const Text = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  max-width: 460px;
  line-height: 1.5;
`;

const Actions = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 10px;
`;

/** Carga con texto, para bloques donde un esqueleto seria exagerado. */
export function LoadingState({ text = "Cargando...", compact }) {
  return (
    <Wrapper $compact={compact}>
      <Spinner $size={24} />
      <Text style={{ marginTop: 12 }}>{text}</Text>
    </Wrapper>
  );
}

/**
 * Error de carga. Distingue el fallo de red (el backend no responde) del resto,
 * porque la accion del usuario es distinta en cada caso.
 */
export function ErrorState({ error, onRetry, compact }) {
  const isNetwork = error?.isNetwork;

  return (
    <Wrapper $compact={compact}>
      <IconCircle $tone="danger">
        {isNetwork ? <FiWifiOff size={24} /> : <FiAlertTriangle size={24} />}
      </IconCircle>
      <Title>{isNetwork ? "Sin conexion con el servidor" : "No se pudo cargar"}</Title>
      <Text>
        {isNetwork
          ? "El backend no responde. Comprueba que este corriendo con 'dotnet run' en la carpeta backend."
          : error?.message || "Ocurrio un error inesperado."}
      </Text>
      {onRetry && (
        <Actions>
          <Button onClick={onRetry}>
            <FiRefreshCw size={14} /> Reintentar
          </Button>
        </Actions>
      )}
    </Wrapper>
  );
}

/** Vacio: no hay error, simplemente todavia no hay nada. */
export function EmptyState({ icon, title, text, children, compact }) {
  return (
    <Wrapper $compact={compact}>
      {icon && <IconCircle>{icon}</IconCircle>}
      <Title>{title}</Title>
      {text && <Text>{text}</Text>}
      {children && <Actions>{children}</Actions>}
    </Wrapper>
  );
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

/** Bloque gris que ocupa el sitio del contenido mientras llega. */
export const Skeleton = styled.div`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ $radius, theme }) => $radius || theme.radii.sm};
  width: ${({ $width = "100%" }) => $width};
  height: ${({ $height = "14px" }) => $height};
  animation: ${pulse} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
