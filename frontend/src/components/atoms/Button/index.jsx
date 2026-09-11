import styled, { css } from "styled-components";

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textInverse};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};

    &:hover {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:hover {
      background: ${({ theme }) => theme.colors.surfaceAlt};
    }
  `,
  ghost: css`
    color: ${({ theme }) => theme.colors.textSecondary};
    padding: 8px;

    &:hover {
      background: ${({ theme }) => theme.colors.surfaceAlt};
      color: ${({ theme }) => theme.colors.text};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
    font-weight: ${({ theme }) => theme.fontWeights.medium};

    &:hover {
      background: ${({ theme }) => theme.colors.danger};
      color: ${({ theme }) => theme.colors.textInverse};
    }
  `,
};

const sizes = {
  sm: css`
    padding: 6px 12px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    border-radius: ${({ theme }) => theme.radii.sm};
  `,
  md: css`
    padding: 9px 16px;
    font-size: ${({ theme }) => theme.fontSizes.base};
    border-radius: ${({ theme }) => theme.radii.md};
  `,
  lg: css`
    padding: 12px 24px;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    border-radius: ${({ theme }) => theme.radii.md};
  `,
};

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;
  white-space: nowrap;
  ${({ $size = "md" }) => sizes[$size]}
  ${({ $variant = "primary" }) => variants[$variant]}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

export default Button;
