import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  FiPlus, FiEdit3, FiMessageSquare, FiUsers,
  FiTrendingUp, FiArrowRight
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import StatCard from "../../components/molecules/StatCard";
import FormCard from "../../components/molecules/FormCard";
import CreateCard from "../../components/molecules/CreateCard";
import Button from "../../components/atoms/Button";

const Welcome = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 6px;
  letter-spacing: -0.5px;
`;

const WelcomeText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const QuickAction = styled.div`
  background: linear-gradient(135deg, #6542F4 0%, #9B7DFF 100%);
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
  color: white;
`;

const QuickActionText = styled.div`
  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 0 0 6px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
    opacity: 0.85;
    margin: 0;
  }
`;

const WhiteButton = styled(Button)`
  background: white;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  &:hover { background: #f0f0f0; }
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const gradients = [
  "linear-gradient(135deg, #6542F4 0%, #9B7DFF 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)",
  "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
];

function Home() {
  const navigate = useNavigate();
  const { forms, createForm } = useForms();

  const totalResponses = forms.reduce((sum, f) => sum + f.responses, 0);
  const activeForms = forms.filter((f) => f.status === "Activo").length;
  const recentForms = forms.slice(0, 3);

  const handleQuickCreate = () => {
    const newId = createForm("Formulario sin titulo");
    navigate(`/formularios/${newId}/editar`);
  };

  return (
    <>
      <Welcome>
        <WelcomeTitle>Buenos dias, Adriano</WelcomeTitle>
        <WelcomeText>Crea formularios, recopila respuestas y analiza resultados.</WelcomeText>
      </Welcome>

      <QuickAction>
        <QuickActionText>
          <h3>Crea un nuevo formulario</h3>
          <p>Empieza desde cero o usa una plantilla para ir mas rapido.</p>
        </QuickActionText>
        <WhiteButton onClick={handleQuickCreate}>
          <FiPlus size={16} /> Crear formulario
        </WhiteButton>
      </QuickAction>

      <Section>
        <SectionHeader>
          <SectionTitle>Resumen</SectionTitle>
        </SectionHeader>
        <StatsGrid>
          <StatCard icon={<FiEdit3 size={16} />} label="Formularios" number={forms.length} />
          <StatCard icon={<FiMessageSquare size={16} />} label="Respuestas totales" number={totalResponses} iconBg="#EAFAF3" iconColor="#2DB87F" />
          <StatCard icon={<FiTrendingUp size={16} />} label="Formularios activos" number={activeForms} iconBg="#FFF8EC" iconColor="#F5A623" />
          <StatCard icon={<FiUsers size={16} />} label="Compartidos" number="0" iconBg="#FEF0F0" iconColor="#E34850" />
        </StatsGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Formularios recientes</SectionTitle>
          <Button $variant="ghost" $size="sm" onClick={() => navigate("/formularios")}>
            Ver todos <FiArrowRight size={14} />
          </Button>
        </SectionHeader>
        <CardsGrid>
          <CreateCard label="Nuevo formulario" to="/formularios" />
          {recentForms.map((form, i) => (
            <FormCard
              key={form.id}
              icon={<FiEdit3 size={24} />}
              title={form.title}
              date={`${form.responses} respuestas`}
              responses={form.responses}
              status={form.status}
              color={gradients[i % gradients.length]}
              onClick={() => navigate(`/formularios/${form.id}/editar`)}
            />
          ))}
        </CardsGrid>
      </Section>
    </>
  );
}

export default Home;
