import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
`;

const TextGroup = styled.div``;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px;
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

function PageHeader({ title, subtitle, children }) {
  return (
    <Wrapper>
      <TextGroup>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TextGroup>
      {children && <Actions>{children}</Actions>}
    </Wrapper>
  );
}

export default PageHeader;
