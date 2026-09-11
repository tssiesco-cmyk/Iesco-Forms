import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  FiSmile, FiTrendingUp, FiCalendar, FiMail, FiUserPlus,
  FiBriefcase, FiHelpCircle, FiStar, FiPieChart
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import PageHeader from "../../components/molecules/PageHeader";
import { ErrorState, LoadingState } from "../../components/molecules/StateView";
import Spinner from "../../components/atoms/Spinner";

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 4px;
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.button`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 24px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  &:disabled {
    cursor: default;
    opacity: ${({ $busy }) => ($busy ? 1 : 0.5)};
  }

  &:disabled:hover {
    border-color: ${({ theme }) => theme.colors.border};
    box-shadow: none;
    transform: none;
  }
`;

const CardIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.primaryBg};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  line-height: 1.45;
`;

const CardMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 3px 8px;
  border-radius: 4px;
  align-self: flex-start;
`;

const iconMap = {
  "tpl-satisfaction": { icon: <FiSmile size={20} />, tone: "primary" },
  "tpl-nps": { icon: <FiTrendingUp size={20} />, tone: "success" },
  "tpl-event-feedback": { icon: <FiCalendar size={20} />, tone: "warning" },
  "tpl-contact": { icon: <FiMail size={20} />, tone: "info" },
  "tpl-registration": { icon: <FiUserPlus size={20} />, tone: "success" },
  "tpl-job": { icon: <FiBriefcase size={20} />, tone: "danger" },
  "tpl-quiz": { icon: <FiHelpCircle size={20} />, tone: "warning" },
  "tpl-performance": { icon: <FiStar size={20} />, tone: "primary" },
  "tpl-market": { icon: <FiPieChart size={20} />, tone: "info" },
};

const categories = [
  {
    title: "Feedback y encuestas",
    subtitle: "Mide la satisfaccion y recopila opiniones de tus clientes.",
    ids: ["tpl-satisfaction", "tpl-nps", "tpl-event-feedback"],
  },
  {
    title: "Contacto y registro",
    subtitle: "Recibe mensajes, registra asistentes y recibe postulaciones.",
    ids: ["tpl-contact", "tpl-registration", "tpl-job"],
  },
  {
    title: "Evaluacion e investigacion",
    subtitle: "Crea quizzes, evalua desempeno y estudia tu mercado.",
    ids: ["tpl-quiz", "tpl-performance", "tpl-market"],
  },
];

function Templates() {
  const navigate = useNavigate();
  const { templates, status, error, reload, createFormFromTemplate } = useForms();

  // Se guarda cual plantilla se esta usando para mostrar el giro solo en esa
  // tarjeta y evitar que se pulsen dos a la vez.
  const [usingId, setUsingId] = useState(null);

  const handleUseTemplate = async (templateId) => {
    if (usingId) return;

    setUsingId(templateId);
    const newId = await createFormFromTemplate(templateId);
    setUsingId(null);

    if (newId) navigate(`/formularios/${newId}/editar`);
  };

  return (
    <div>
      <PageHeader
        title="Plantillas"
        subtitle="Elige una plantilla para crear tu formulario en segundos."
      />

      {status === "error" && <ErrorState error={error} onRetry={reload} />}
      {status === "loading" && <LoadingState text="Cargando plantillas..." />}

      {status === "ready" && categories.map((cat) => (
        <Section key={cat.title}>
          <SectionTitle>{cat.title}</SectionTitle>
          <SectionSubtitle>{cat.subtitle}</SectionSubtitle>
          <CardGrid>
            {cat.ids.map((tplId) => {
              const tpl = templates.find((t) => t.id === tplId);
              const style = iconMap[tplId];
              if (!tpl) return null;
              return (
                <Card
                  key={tpl.id}
                  onClick={() => handleUseTemplate(tpl.id)}
                  disabled={Boolean(usingId)}
                  $busy={usingId === tpl.id}
                >
                  <CardIcon $tone={style.tone}>
                    {usingId === tpl.id ? <Spinner $size={20} /> : style.icon}
                  </CardIcon>
                  <CardTitle>{tpl.name}</CardTitle>
                  <CardDesc>{tpl.description}</CardDesc>
                  <CardMeta>
                    {usingId === tpl.id ? "Creando formulario..." : `${tpl.questions.length} preguntas`}
                  </CardMeta>
                </Card>
              );
            })}
          </CardGrid>
        </Section>
      ))}
    </div>
  );
}

export default Templates;
