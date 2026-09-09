import styled from "styled-components";
import { FiUser, FiMail, FiSun } from "react-icons/fi";
import Avatar from "../../components/atoms/Avatar";
import Button from "../../components/atoms/Button";

const Page = styled.div`
  max-width: 720px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

const HeaderInfo = styled.div`
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

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  overflow: hidden;
`;

const SectionTitle = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 0;
  }
`;

const Option = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const OptionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const OptionIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OptionText = styled.div`
  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    margin-bottom: 2px;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

function Settings() {
  return (
    <Page>
      <Header>
        <Avatar $size={56}>A</Avatar>
        <HeaderInfo>
          <h1>Configuracion</h1>
          <p>Administra las preferencias de tu cuenta.</p>
        </HeaderInfo>
      </Header>

      <Section>
        <SectionTitle><h2>Cuenta</h2></SectionTitle>
        <Option>
          <OptionInfo>
            <OptionIcon><FiUser size={16} /></OptionIcon>
            <OptionText>
              <strong>Nombre</strong>
              <span>Adriano Velasquez</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="secondary" $size="sm">Editar</Button>
        </Option>
        <Option>
          <OptionInfo>
            <OptionIcon><FiMail size={16} /></OptionIcon>
            <OptionText>
              <strong>Correo electronico</strong>
              <span>adrianovelasquez@iescogroup.com</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="secondary" $size="sm">Editar</Button>
        </Option>
      </Section>

      <Section>
        <SectionTitle><h2>Preferencias</h2></SectionTitle>
        <Option>
          <OptionInfo>
            <OptionIcon><FiSun size={16} /></OptionIcon>
            <OptionText>
              <strong>Tema</strong>
              <span>Claro</span>
            </OptionText>
          </OptionInfo>
          <Button $variant="secondary" $size="sm">Cambiar</Button>
        </Option>
      </Section>
    </Page>
  );
}

export default Settings;
