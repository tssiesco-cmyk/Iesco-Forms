import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  FiSmile, FiTrendingUp, FiCalendar, FiMail, FiUserPlus,
  FiBriefcase, FiHelpCircle, FiStar, FiPieChart, FiSearch, FiLayers, FiTrash2, FiX
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import { EmptyState, ErrorState, LoadingState } from "../../components/molecules/StateView";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import { matchesSearch } from "../../services/search";

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

/* La tarjeta es un boton; el de borrar no puede ir dentro, asi que va encima. */
const CardWrap = styled.div`
  position: relative;
  display: flex;

  > button:first-child { flex: 1; }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerBg};
  }

  &:disabled { opacity: 0.5; cursor: default; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

const ModalBody = styled.p`
  padding: 24px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;

  strong { color: ${({ theme }) => theme.colors.text}; }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
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

/** Las que no estan en iconMap: las del equipo y cualquiera nueva del catalogo. */
const fallbackStyle = { icon: <FiLayers size={20} />, tone: "info" };

/** "12 sep 2026", para "Creada por Ana · 12 sep 2026". */
function shortDate(value) {
  return value ? new Date(value).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : "";
}

/**
 * Las plantillas que guarda el equipo desde sus formularios. No tienen ids
 * fijos: se reconocen por isCustom.
 */
const TEAM_CATEGORY = {
  key: "equipo",
  label: "Del equipo",
  title: "Del equipo",
  subtitle: "Plantillas que guardo tu equipo a partir de sus formularios.",
};

const categories = [
  {
    key: "feedback",
    label: "Feedback",
    title: "Feedback y encuestas",
    subtitle: "Mide la satisfaccion y recopila opiniones de tus clientes.",
    ids: ["tpl-satisfaction", "tpl-nps", "tpl-event-feedback"],
  },
  {
    key: "contacto",
    label: "Contacto",
    title: "Contacto y registro",
    subtitle: "Recibe mensajes, registra asistentes y recibe postulaciones.",
    ids: ["tpl-contact", "tpl-registration", "tpl-job"],
  },
  {
    key: "evaluacion",
    label: "Evaluacion",
    title: "Evaluacion e investigacion",
    subtitle: "Crea quizzes, evalua desempeno y estudia tu mercado.",
    ids: ["tpl-quiz", "tpl-performance", "tpl-market"],
  },
];

function Templates() {
  const navigate = useNavigate();
  const { templates, status, error, reload, createFormFromTemplate, deleteTemplate } = useForms();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Se guarda cual plantilla se esta usando para mostrar el giro solo en esa
  // tarjeta y evitar que se pulsen dos a la vez.
  const [usingId, setUsingId] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");

  // Busca en nombre y descripcion de la plantilla y en el titulo de su
  // seccion, asi "encuesta" tambien trae las de "Feedback y encuestas".
  // Las del equipo van primero, como las devuelve el backend. Ahi tambien se
  // busca por el nombre de quien la creo.
  const teamSection = {
    ...TEAM_CATEGORY,
    items: templates.filter((tpl) =>
      tpl.isCustom && matchesSearch(search, tpl.name, tpl.description, tpl.ownerName, TEAM_CATEGORY.title)),
  };

  const catalogSections = categories.map((cat) => ({
    ...cat,
    items: cat.ids
      .map((tplId) => templates.find((t) => t.id === tplId))
      .filter((tpl) => tpl && matchesSearch(search, tpl.name, tpl.description, cat.title)),
  }));

  const visibleSections = [teamSection, ...catalogSections]
    .filter((cat) => category === "todas" || cat.key === category)
    .filter((cat) => cat.items.length > 0);

  const hasTeamTemplates = templates.some((tpl) => tpl.isCustom);

  const categoryOptions = [
    { value: "todas", label: "Todas" },
    ...(hasTeamTemplates ? [{ value: TEAM_CATEGORY.key, label: TEAM_CATEGORY.label }] : []),
    ...categories.map((cat) => ({ value: cat.key, label: cat.label })),
  ];

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    const ok = await deleteTemplate(deleteTarget.id);
    setDeleting(false);

    if (ok) setDeleteTarget(null);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("todas");
  };

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

      {status === "ready" && (
        <SearchToolbar
          placeholder="Buscar plantillas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          filters={{ value: category, onChange: setCategory, options: categoryOptions }}
        />
      )}

      {status === "ready" && visibleSections.length === 0 && (
        <EmptyState
          icon={<FiSearch size={24} />}
          title="Sin resultados"
          text={search.trim()
            ? `Ninguna plantilla coincide con "${search.trim()}".`
            : "No hay plantillas en esta categoria."}
          compact
        >
          <Button $variant="secondary" onClick={clearFilters}>Quitar filtros</Button>
        </EmptyState>
      )}

      {status === "ready" && visibleSections.map((cat) => (
        <Section key={cat.key}>
          <SectionTitle>{cat.title}</SectionTitle>
          <SectionSubtitle>{cat.subtitle}</SectionSubtitle>
          <CardGrid>
            {cat.items.map((tpl) => {
              const style = iconMap[tpl.id] ?? fallbackStyle;
              const author = tpl.isCustom
                ? [`Creada por ${tpl.ownerName ?? "un usuario"}`, shortDate(tpl.createdAt)].filter(Boolean).join(" · ")
                : null;

              return (
                <CardWrap key={tpl.id}>
                  <Card
                    onClick={() => handleUseTemplate(tpl.id)}
                    disabled={Boolean(usingId)}
                    $busy={usingId === tpl.id}
                  >
                    <CardIcon $tone={style.tone}>
                      {usingId === tpl.id ? <Spinner $size={20} /> : style.icon}
                    </CardIcon>
                    <CardTitle>{tpl.name}</CardTitle>
                    {tpl.description && <CardDesc>{tpl.description}</CardDesc>}
                    {author && <CardDesc>{author}</CardDesc>}
                    <CardMeta>
                      {usingId === tpl.id ? "Creando formulario..." : `${tpl.questions?.length ?? 0} preguntas`}
                    </CardMeta>
                  </Card>

                  {tpl.canDelete && (
                    <DeleteButton
                      type="button"
                      onClick={() => setDeleteTarget(tpl)}
                      disabled={Boolean(usingId)}
                      title="Borrar plantilla"
                      aria-label={`Borrar plantilla ${tpl.name}`}
                    >
                      <FiTrash2 size={15} />
                    </DeleteButton>
                  )}
                </CardWrap>
              );
            })}
          </CardGrid>
        </Section>
      ))}

      {deleteTarget && (
        <ModalOverlay onClick={() => !deleting && setDeleteTarget(null)}>
          <Modal role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Borrar plantilla</h2>
              <Button $variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                <FiX size={18} />
              </Button>
            </ModalHeader>
            <ModalBody>
              Deseas borrar la plantilla <strong>"{deleteTarget.name}"</strong>? Desaparece para
              todo el equipo y no se puede deshacer. Los formularios ya creados con ella no cambian.
            </ModalBody>
            <ModalActions>
              <Button $variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </Button>
              <Button $variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting && <Spinner $size={13} $color="currentColor" />}
                {deleting ? "Borrando..." : "Borrar plantilla"}
              </Button>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}

export default Templates;
