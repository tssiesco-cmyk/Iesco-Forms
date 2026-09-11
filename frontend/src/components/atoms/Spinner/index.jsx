import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  display: inline-block;
  width: ${({ $size = 16 }) => `${$size}px`};
  height: ${({ $size = 16 }) => `${$size}px`};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ $color, theme }) => $color || theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;

  /* Quien prefiere menos movimiento ve un pulso suave en vez de un giro. */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.6;
  }
`;

export default Spinner;
