import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  FiPlus, FiEdit3, FiMessageSquare, FiUsers,
  FiTrendingUp, FiArrowRight
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import StatCard from "../../components/molecules/StatCard";
import FormCard from "../../components/molecules/FormCard";
import { coverImageOf } from "../../services/formCover";
import CreateCard from "../../components/molecules/CreateCard";
import SkeletonCard from "../../components/molecules/SkeletonCard";
import { ErrorState, Skeleton } from "../../components/molecules/StateView";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";

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
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
  color: ${({ theme }) => theme.colors.text};
`;

const QuickActionText = styled.div`
  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    margin: 0 0 6px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0;
  }
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

function Home() {
  const navigate = useNavigate();
  const { forms, status, error, reload, createForm } = useForms();
  const [creating, setCreating] = useState(false);

  const loading = status === "loading";

  // Los compartidos contigo se cuentan aparte: no son tuyos.
  const myForms = forms.filter((f) => !f.sharedPermission);
  const sharedCount = forms.length - myForms.length;

  const totalResponses = myForms.reduce((sum, f) => sum + (f.responseCount ?? 0), 0);
  const activeForms = myForms.filter((f) => f.status === "Activo").length;
  const recentForms = myForms.slice(0, 3);

  const handleQuickCreate = async () => {
    if (creating) return;

    setCreating(true);
    const newId = await createForm("Formulario sin titulo");
    setCreating(false);

    if (newId) navigate(`/formularios/${newId}/editar`);
  };

  // Mientras cargan los datos las cifras muestran un bloque gris en vez de un
  // cero que luego salta a otro numero.
  const stat = (value) => (loading ? <Skeleton $width="48px" $height="24px" /> : value);

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
        <Button onClick={handleQuickCreate} disabled={creating}>
          {creating ? <Spinner $size={14} $color="currentColor" /> : <FiPlus size={16} />}
          {creating ? "Creando..." : "Crear formulario"}
        </Button>
      </QuickAction>

      <Section>
        <SectionHeader>
          <SectionTitle>Resumen</SectionTitle>
        </SectionHeader>
        <StatsGrid>
          <StatCard icon={<FiEdit3 size={16} />} label="Formularios" number={stat(myForms.length)} />
          <StatCard icon={<FiMessageSquare size={16} />} label="Respuestas totales" number={stat(totalResponses)} tone="success" />
          <StatCard icon={<FiTrendingUp size={16} />} label="Formularios activos" number={stat(activeForms)} tone="warning" />
          <StatCard icon={<FiUsers size={16} />} label="Compartidos contigo" number={stat(sharedCount)} tone="danger" />
        </StatsGrid>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Formularios recientes</SectionTitle>
          <Button $variant="ghost" $size="sm" onClick={() => navigate("/formularios")}>
            Ver todos <FiArrowRight size={14} />
          </Button>
        </SectionHeader>
        {status === "error" ? (
          <ErrorState error={error} onRetry={reload} compact />
        ) : (
          <CardsGrid>
            <CreateCard label="Nuevo formulario" to="/formularios" />
            {loading
              ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)
              : recentForms.map((form) => (
                  <FormCard
                    key={form.id}
                    icon={<FiEdit3 size={24} />}
                    image={coverImageOf(form)}
                    title={form.title}
                    date={form.status === "Borrador" ? "Borrador" : form.createdAt}
                    responses={form.responseCount ?? 0}
                    status={form.status}
                    onClick={() => navigate(`/formularios/${form.id}/editar`)}
                  />
                ))}
          </CardsGrid>
        )}
      </Section>
    </>
  );
}

export default Home;
