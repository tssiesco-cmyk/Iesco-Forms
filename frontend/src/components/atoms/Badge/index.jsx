import styled, { css } from "styled-components";

const variants = {
  success: css`
    background: ${({ theme }) => theme.colors.successBg};
    color: ${({ theme }) => theme.colors.success};
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningBg};
    color: ${({ theme }) => theme.colors.warning};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  `,
  default: css`
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.textSecondary};
  `,
};

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
  ${({ $variant = "default" }) => variants[$variant]}
`;

export default Badge;
