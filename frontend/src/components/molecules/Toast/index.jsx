import styled, { keyframes } from "styled-components";
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Stack = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: min(380px, calc(100vw - 32px));

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: 16px;
    right: 16px;
    bottom: 16px;
    max-width: none;
  }
`;

const Item = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: ${slideIn} 0.2s ease;
`;

const Icon = styled.span`
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 1px;
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const Message = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.45;
  word-break: break-word;
`;

const RetryButton = styled.button`
  margin-top: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.primary};
  padding: 4px 8px;
  margin-left: -8px;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const CloseButton = styled.button`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 2px;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`;

const icons = {
  success: <FiCheckCircle size={16} />,
  danger: <FiAlertTriangle size={16} />,
  warning: <FiAlertTriangle size={16} />,
  primary: <FiInfo size={16} />,
};

function ToastList({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <Stack role="status" aria-live="polite">
      {toasts.map((toast) => (
        <Item key={toast.id} $tone={toast.tone}>
          <Icon $tone={toast.tone}>{icons[toast.tone] || icons.primary}</Icon>
          <Body>
            <Message>{toast.message}</Message>
            {toast.onRetry && (
              <RetryButton
                onClick={() => {
                  onDismiss(toast.id);
                  toast.onRetry();
                }}
              >
                Reintentar
              </RetryButton>
            )}
          </Body>
          <CloseButton onClick={() => onDismiss(toast.id)} aria-label="Cerrar aviso">
            <FiX size={14} />
          </CloseButton>
        </Item>
      ))}
    </Stack>
  );
}

export default ToastList;
