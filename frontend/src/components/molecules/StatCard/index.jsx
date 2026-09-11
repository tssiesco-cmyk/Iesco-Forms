import styled from "styled-components";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing["2xl"]};
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Value = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

const IconWrapper = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.primaryBg};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 4px;
`;

/** tone: "primary" | "success" | "warning" | "danger" | "info" */
function StatCard({ icon, label, number, tone = "primary" }) {
  return (
    <Card>
      <IconWrapper $tone={tone}>{icon}</IconWrapper>
      <Label>{label}</Label>
      <Value>{number}</Value>
    </Card>
  );
}

export default StatCard;
