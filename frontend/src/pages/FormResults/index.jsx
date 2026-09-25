import { useEffect, useState } from "react";
import { downloadResultsPdf } from "../../services/resultsPdf";
import { downloadResultsCsv, downloadResultsXlsx } from "../../services/resultsExport";
import {
  TYPE_LABELS, answerText, average, chartQuestion, hasOptions, isChartable, isSingleOption, npsScore,
} from "../../services/questionTypes";
import { CHART_COLORS } from "../../styles/chartColors";
import Spinner from "../../components/atoms/Spinner";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiArrowLeft, FiEdit3, FiEye, FiUsers, FiCheckCircle,
  FiMessageSquare, FiClock, FiTrendingUp, FiPercent, FiDownload,
  FiCalendar, FiChevronLeft, FiChevronRight, FiTrash2, FiAlertTriangle, FiX,
  FiFileText, FiGrid, FiFile
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import { responsesApi } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/atoms/Button";
import Avatar from "../../components/atoms/Avatar";
import { ErrorState, LoadingState } from "../../components/molecules/StateView";

/* ===== LAYOUT ===== */
const Page = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const SidePanel = styled.aside`
  width: 280px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
`;

const SideHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const SideTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SideNav = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavBtn = styled.button`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : "transparent"};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.medium : theme.fontWeights.normal};
  text-align: left;
  &:hover { background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surfaceAlt}; }
`;

const SideStats = styled.div`
  padding: 16px 20px;
  margin-top: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SideStatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SideStatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.primaryBg};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SideStatInfo = styled.div`
  span { display: block; font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { display: block; font-size: ${({ theme }) => theme.fontSizes.base}; font-weight: ${({ theme }) => theme.fontWeights.semibold}; }
`;

/* ===== MAIN ===== */
const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 960px;
`;

/* ===== TABS ===== */
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button`
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : "transparent"};
  margin-bottom: -1px;
  transition: all 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

/* ===== KPI CARDS ===== */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
`;

const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
`;

const KpiIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $tone, theme }) => theme.colors[`${$tone}Bg`] || theme.colors.primaryBg};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const KpiValue = styled.div`
  font-size: 26px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const KpiLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ===== QUESTION BLOCKS ===== */
const QuestionBlock = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 24px;
  margin-bottom: 20px;
`;

const QHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const QTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QNum = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const QType = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 3px 8px;
  border-radius: 4px;
`;

const QResponseCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 16px;
  display: block;
`;

/* ===== DONUT CHART ===== */
const ChartRow = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
`;

const DonutWrapper = styled.div`
  width: 160px;
  height: 160px;
  flex-shrink: 0;
`;

const DonutSvg = styled.svg`
  width: 160px;
  height: 160px;
  transform: rotate(-90deg);
`;

const DonutCenter = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
`;

const DonutLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  strong {
    display: block;
    font-size: 22px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
`;

const LegendValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  min-width: 30px;
  text-align: right;
`;

const LegendPercent = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 36px;
  text-align: right;
`;

/* ===== BAR CHART ===== */
const BarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BarLabel = styled.span`
  width: 160px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 28px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: width 0.6s ease;
  background: ${({ $color }) => $color};
`;

const BarValue = styled.span`
  width: 30px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const BarPercent = styled.span`
  width: 40px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ===== TEXT RESPONSES ===== */
const TextList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextItem = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.5;
`;

const TextTime = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;

/* ===== RESPONSES TABLE ===== */
const Table = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 1fr 180px 120px;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

const TableHeaderCell = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 1fr 180px 120px;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  transition: background 0.1s;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const RespondentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const CellText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/** Abajo a la derecha, siempre visible aunque la tabla sea larga. */
/* Boton fijo abajo a la derecha; el menu de formatos se abre encima. */
const DownloadDock = styled.div`
  position: fixed;
  right: 32px;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const DownloadButton = styled(Button)`
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const DownloadMenu = styled.div`
  min-width: 220px;
  padding: 6px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
`;

const DownloadOption = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};

  small {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

/* Promedio, NPS: una linea de cifras encima del grafico. */
const StatLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.text};
    margin-right: 4px;
  }
`;

const EmptyMsg = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-style: italic;
  text-align: center;
  padding: 40px;
`;

/* ===== FILTRO POR FECHA ===== */
const FilterBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  input {
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const PresetBtn = styled.button`
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surfaceAlt};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.medium : theme.fontWeights.normal};
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const FilterCount = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ===== VISTA INDIVIDUAL ===== */
const IndividualNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
`;

const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.textSecondary};
    min-width: 70px;
    text-align: center;
  }
`;

const DetailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 16px;
`;

const FieldGrid = styled.dl`
  display: grid;
  grid-template-columns: minmax(120px, 200px) 1fr;
  gap: 8px 16px;
  margin: 0;

  dt {
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.text};
    word-break: break-word;
  }
`;

const AnswerText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-word;
  color: ${({ $muted, theme }) => $muted ? theme.colors.textMuted : theme.colors.text};
  font-style: ${({ $muted }) => $muted ? "italic" : "normal"};
`;

const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const ClickableRow = styled(TableRow)`
  cursor: pointer;
`;

/* ===== MODAL DE CONFIRMACION ===== */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 440px;
  max-width: calc(100vw - 32px);
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
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
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

const WarningIcon = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  display: flex;
  align-items: center;
`;

/* ===== HELPERS ===== */

/** yyyy-mm-dd en hora local, que es lo que usa un <input type="date">. */
function toInputDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toInputDate(d);
}

/** Atajos del filtro. "Todo" deja las dos fechas vacias. */
const DATE_PRESETS = [
  { key: "7", label: "Ultimos 7 dias", from: () => daysAgo(6) },
  { key: "30", label: "Ultimos 30 dias", from: () => daysAgo(29) },
  { key: "all", label: "Todo", from: () => "" },
];

/** Una respuesta tiene algo si trae texto o al menos una opcion. */
function hasValue(answer) {
  if (answer === null || answer === undefined) return false;
  return Array.isArray(answer) ? answer.length > 0 : answer.toString().trim() !== "";
}
// Compartidos con el informe en PDF, para que cada opcion tenga el mismo color.
const chartColors = CHART_COLORS;

const typeLabels = TYPE_LABELS;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function DonutChart({ stats, total }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Cada segmento arranca donde terminan los anteriores, calculado sin mutar nada durante el render.
  const segments = stats.reduce((acc, s) => {
    const dash = (s.count / (total || 1)) * circumference;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    return [...acc, { ...s, dash, offset }];
  }, []);

  return (
    <DonutCenter>
      <DonutSvg viewBox="0 0 160 160">
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </DonutSvg>
      <DonutLabel>
        <strong>{total}</strong>
        <span>respuestas</span>
      </DonutLabel>
    </DonutCenter>
  );
}

function FormResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getForm, status, error, reload, getFormResponses, loadResponses } = useForms();
  const [activeTab, setActiveTab] = useState("resumen");
  const [downloading, setDownloading] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const toast = useToast();

  // Filtro por fecha: cadenas yyyy-mm-dd de los <input type="date">. Vacias = sin limite.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Vista individual: cual se ve y el borrado con confirmacion.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Las borradas se esconden al momento, sin esperar a recargar la lista.
  const [deletedIds, setDeletedIds] = useState(() => new Set());

  // Las respuestas no vienen en la carga inicial: se piden al entrar aqui.
  const [responsesState, setResponsesState] = useState("loading");
  const [responsesError, setResponsesError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setResponsesState("loading");
    setResponsesError(null);

    loadResponses(id, controller.signal).then((result) => {
      if (!active || result.aborted) return;
      if (result.ok) {
        setResponsesState("ready");
      } else {
        setResponsesError(result.error);
        setResponsesState("error");
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, loadResponses]);

  const form = getForm(id);
  const allResponses = getFormResponses(id).filter((r) => !deletedIds.has(r.id));

  // Todo lo de abajo (KPIs, graficos, tabla, individual y PDF) usa la lista
  // filtrada: el informe descargado dice lo mismo que la pantalla.
  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
  const isFiltered = fromTime !== null || toTime !== null;
  const formResponses = isFiltered
    ? allResponses.filter((r) => {
      const t = new Date(r.submittedAt).getTime();
      return (fromTime === null || t >= fromTime) && (toTime === null || t <= toTime);
    })
    : allResponses;

  if (status === "loading") {
    return <Page><Main><LoadingState text="Cargando formulario..." /></Main></Page>;
  }

  if (status === "error") {
    return <Page><Main><ErrorState error={error} onRetry={reload} /></Main></Page>;
  }

  if (!form) {
    return (
      <Page><Main>
        <EmptyMsg>No se encontro el formulario.</EmptyMsg>
        <div style={{ textAlign: "center" }}>
          <Button onClick={() => navigate("/formularios")}>Volver a mis formularios</Button>
        </div>
      </Main></Page>
    );
  }

  const totalResponses = formResponses.length;
  const questionsCount = form.questions.length;
  const answeredCount = formResponses.filter((r) =>
    Object.values(r.answers).some((a) => a && (Array.isArray(a) ? a.length > 0 : a.toString().trim() !== ""))
  ).length;
  const completionRate = totalResponses > 0 ? Math.round((answeredCount / totalResponses) * 100) : 0;

  // Las escalas (estrellas, NPS) se cuentan como si cada valor fuera una opcion.
  const getChoiceStats = (original) => {
    const question = chartQuestion(original);
    const counts = {};
    question.options.forEach((opt) => { counts[opt.id] = 0; });
    formResponses.forEach((r) => {
      const answer = r.answers[question.id];
      if (!answer) return;
      if (Array.isArray(answer)) {
        answer.forEach((optId) => { if (counts[optId] !== undefined) counts[optId]++; });
      } else {
        if (counts[answer] !== undefined) counts[answer]++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return question.options.map((opt, i) => ({
      label: opt.text,
      count: counts[opt.id],
      percent: Math.round((counts[opt.id] / total) * 100),
      color: chartColors[i % chartColors.length],
    }));
  };

  const getTextResponses = (question) =>
    formResponses
      .filter((r) => hasValue(r.answers[question.id]))
      .map((r) => ({ text: answerText(question, r.answers[question.id]), date: r.submittedAt }));

  const getRespondentName = (response) => {
    const r = response.respondent || {};
    if (r.name) return r.name;
    const nameField = form.introFields?.find((f) => f.type === "name");
    if (nameField && r[nameField.id]) return r[nameField.id];
    const vals = Object.values(r);
    return vals[0] || "Anonimo";
  };

  const getRespondentEmail = (response) => {
    const r = response.respondent || {};
    if (r.email) return r.email;
    const emailField = form.introFields?.find((f) => f.type === "email");
    if (emailField && r[emailField.id]) return r[emailField.id];
    return "";
  };

  const downloaders = {
    pdf: { run: downloadResultsPdf, name: "el PDF" },
    xlsx: { run: downloadResultsXlsx, name: "el Excel" },
    csv: { run: downloadResultsCsv, name: "el CSV" },
  };

  const handleDownload = async (format) => {
    setDownloadMenuOpen(false);
    if (downloading || totalResponses === 0) return;

    setDownloading(true);
    try {
      await downloaders[format].run(form, formResponses);
    } catch (err) {
      toast.error(`No se pudo generar ${downloaders[format].name}: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const getRespondentAnswerCount = (response) => {
    return Object.values(response.answers).filter((a) =>
      a && (Array.isArray(a) ? a.length > 0 : a.toString().trim() !== "")
    ).length;
  };

  const canDelete = form.access === "owner" || form.access === "edit";

  // Si se filtra o se borra, el indice puede quedar fuera de la lista.
  const safeIndex = Math.min(currentIndex, Math.max(totalResponses - 1, 0));
  const current = totalResponses > 0 ? formResponses[safeIndex] : null;

  const activePreset = !dateTo
    ? DATE_PRESETS.find((p) => p.from() === dateFrom)?.key
    : undefined;

  const applyPreset = (preset) => {
    setDateFrom(preset.from());
    setDateTo("");
    setCurrentIndex(0);
  };

  const openIndividual = (index) => {
    setCurrentIndex(index);
    setActiveTab("individual");
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;

    setDeleting(true);
    try {
      await responsesApi.remove(id, confirmDelete.id);
      setDeletedIds((prev) => new Set(prev).add(confirmDelete.id));
      setConfirmDelete(null);
      toast.success("Respuesta borrada");
      // En segundo plano, para que contadores y demas pantallas queden al dia.
      loadResponses(id);
    } catch (err) {
      toast.error(`No se pudo borrar la respuesta: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  /** Texto de lo elegido; una opcion borrada ya no tiene texto que mostrar. */
  const optionText = (question, optionId) =>
    question.options.find((o) => o.id === optionId)?.text ?? "(opcion eliminada)";

  const renderAnswer = (question, answer) => {
    if (!hasValue(answer)) return <AnswerText $muted>Sin responder</AnswerText>;

    if (question.type === "multiple_choice") {
      const ids = Array.isArray(answer) ? answer : [answer];
      return (
        <ChipList>
          {ids.map((optId) => <Chip key={optId}>{optionText(question, optId)}</Chip>)}
        </ChipList>
      );
    }

    if (hasOptions(question.type)) {
      return <ChipList><Chip>{optionText(question, Array.isArray(answer) ? answer[0] : answer)}</Chip></ChipList>;
    }

    return <AnswerText>{answerText(question, answer)}</AnswerText>;
  };

  /**
   * Los datos del respondedor con su etiqueta. Si el campo se quito del
   * formulario despues de responder, el dato sigue ahi pero sin nombre.
   */
  const respondentRows = (response) => {
    const values = response.respondent || {};
    const fields = form.introFields || [];
    const known = fields
      .filter((f) => hasValue(values[f.id]))
      .map((f) => ({ key: f.id, label: f.label || "Campo", value: values[f.id] }));
    const unknown = Object.keys(values)
      .filter((k) => !fields.some((f) => f.id === k) && hasValue(values[k]))
      .map((k) => ({ key: k, label: "Campo eliminado", value: values[k] }));
    return [...known, ...unknown];
  };

  return (
    <Page>
      <SidePanel>
        <SideHeader>
          <BackBtn onClick={() => navigate(`/formularios/${id}/editar`)}>
            <FiArrowLeft size={18} />
          </BackBtn>
          <SideTitle>{form.title}</SideTitle>
        </SideHeader>

        <SideNav>
          <NavBtn $active onClick={() => navigate(`/formularios/${id}/resultados`)}>
            <FiMessageSquare size={16} /> Resultados
          </NavBtn>
          <NavBtn onClick={() => navigate(`/formularios/${id}/editar`)}>
            <FiEdit3 size={16} /> Editor
          </NavBtn>
          <NavBtn onClick={() => navigate(`/formularios/${id}/vista`)}>
            <FiEye size={16} /> Vista previa
          </NavBtn>
        </SideNav>

        <SideStats>
          <SideStatRow>
            <SideStatIcon $tone="primary"><FiUsers size={14} /></SideStatIcon>
            <SideStatInfo><span>Respuestas</span><strong>{totalResponses}</strong></SideStatInfo>
          </SideStatRow>
          <SideStatRow>
            <SideStatIcon $tone="success"><FiCheckCircle size={14} /></SideStatIcon>
            <SideStatInfo><span>Completado</span><strong>{completionRate}%</strong></SideStatInfo>
          </SideStatRow>
          <SideStatRow>
            <SideStatIcon $tone="warning"><FiClock size={14} /></SideStatIcon>
            <SideStatInfo>
              <span>Ultima respuesta</span>
              <strong>{totalResponses > 0 ? formatShortDate(formResponses[0].submittedAt) : "-"}</strong>
            </SideStatInfo>
          </SideStatRow>
        </SideStats>
      </SidePanel>

      <Main>
        <Tabs>
          <Tab $active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")}>Resumen</Tab>
          <Tab $active={activeTab === "respuestas"} onClick={() => setActiveTab("respuestas")}>Respuestas ({totalResponses})</Tab>
          <Tab $active={activeTab === "individual"} onClick={() => setActiveTab("individual")}>Individual</Tab>
        </Tabs>

        {responsesState === "ready" && allResponses.length > 0 && (
          <FilterBar>
            <FiCalendar size={16} />
            <FilterLabel>
              Desde
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentIndex(0); }}
              />
            </FilterLabel>
            <FilterLabel>
              Hasta
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => { setDateTo(e.target.value); setCurrentIndex(0); }}
              />
            </FilterLabel>
            {DATE_PRESETS.map((p) => (
              <PresetBtn key={p.key} $active={activePreset === p.key} onClick={() => applyPreset(p)}>
                {p.label}
              </PresetBtn>
            ))}
            {isFiltered && (
              <FilterCount>{totalResponses} de {allResponses.length} respuestas</FilterCount>
            )}
          </FilterBar>
        )}

        {responsesState === "loading" && <LoadingState text="Cargando respuestas..." />}
        {responsesState === "error" && (
          <ErrorState
            error={responsesError}
            onRetry={() => loadResponses(id).then((r) => setResponsesState(r.ok ? "ready" : "error"))}
          />
        )}

        {responsesState === "ready" && activeTab === "resumen" && (
          <>
            <KpiGrid>
              <KpiCard>
                <KpiIcon $tone="primary"><FiUsers size={16} /></KpiIcon>
                <KpiValue>{totalResponses}</KpiValue>
                <KpiLabel>Total respuestas</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $tone="success"><FiPercent size={16} /></KpiIcon>
                <KpiValue>{completionRate}%</KpiValue>
                <KpiLabel>Tasa de completado</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $tone="warning"><FiTrendingUp size={16} /></KpiIcon>
                <KpiValue>{questionsCount}</KpiValue>
                <KpiLabel>Preguntas</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $tone="danger"><FiClock size={16} /></KpiIcon>
                <KpiValue>{totalResponses > 0 ? formatShortDate(formResponses[0].submittedAt) : "-"}</KpiValue>
                <KpiLabel>Ultima respuesta</KpiLabel>
              </KpiCard>
            </KpiGrid>

            {form.questions.map((q, i) => {
              const isChoice = isChartable(q.type);
              const stats = isChoice ? getChoiceStats(q) : [];
              const totalForQ = stats.reduce((a, b) => a + b.count, 0);
              const textResps = !isChoice ? getTextResponses(q) : [];
              const avg = ["rating", "nps", "number"].includes(q.type) ? average(q, formResponses) : null;
              const nps = q.type === "nps" ? npsScore(q, formResponses) : null;

              return (
                <QuestionBlock key={q.id}>
                  <QHeader>
                    <QTitle><QNum>{i + 1}</QNum>{q.title || "Pregunta sin titulo"}</QTitle>
                    <QType>{typeLabels[q.type]}</QType>
                  </QHeader>
                  <QResponseCount>
                    {isChoice
                      ? `${formResponses.filter((r) => hasValue(r.answers[q.id])).length} respuestas`
                      : `${textResps.length} respuestas`}
                  </QResponseCount>

                  {(avg !== null || nps) && (
                    <StatLine>
                      {nps && (
                        <span title="% de promotores (9-10) menos % de detractores (0-6)">
                          <strong>{nps.score > 0 ? `+${nps.score}` : nps.score}</strong> NPS
                        </span>
                      )}
                      {nps && (
                        <span>
                          Promotores {nps.promoters}% · Pasivos {nps.passives}% · Detractores {nps.detractors}%
                        </span>
                      )}
                      {avg !== null && (
                        <span>
                          <strong>{avg.toLocaleString("es-ES", { maximumFractionDigits: 2 })}</strong>
                          {q.type === "rating" ? `promedio de ${q.scaleMax || 5} estrellas` : "promedio"}
                        </span>
                      )}
                    </StatLine>
                  )}

                  {isSingleOption(q.type) && (
                    <ChartRow>
                      <DonutWrapper>
                        <DonutChart stats={stats} total={totalForQ} />
                      </DonutWrapper>
                      <LegendList>
                        {stats.map((s) => (
                          <LegendItem key={s.label}>
                            <LegendDot $color={s.color} />
                            <LegendLabel>{s.label}</LegendLabel>
                            <LegendValue>{s.count}</LegendValue>
                            <LegendPercent>{s.percent}%</LegendPercent>
                          </LegendItem>
                        ))}
                      </LegendList>
                    </ChartRow>
                  )}

                  {isChoice && !isSingleOption(q.type) && (
                    <BarList>
                      {stats.map((s) => (
                        <BarRow key={s.label}>
                          <BarLabel>{s.label}</BarLabel>
                          <BarTrack>
                            <BarFill $color={s.color} style={{ width: `${s.percent}%` }} />
                          </BarTrack>
                          <BarValue>{s.count}</BarValue>
                          <BarPercent>{s.percent}%</BarPercent>
                        </BarRow>
                      ))}
                    </BarList>
                  )}

                  {!isChoice && (
                    textResps.length > 0 ? (
                      <TextList>
                        {textResps.map((r, j) => (
                          <TextItem key={j}>
                            {r.text}
                            <TextTime>{formatDate(r.date)}</TextTime>
                          </TextItem>
                        ))}
                      </TextList>
                    ) : (
                      <EmptyMsg>Sin respuestas</EmptyMsg>
                    )
                  )}
                </QuestionBlock>
              );
            })}
          </>
        )}

        {responsesState === "ready" && activeTab === "respuestas" && (
          totalResponses > 0 ? (
            <Table>
              <TableHeader>
                <TableHeaderCell>#</TableHeaderCell>
                <TableHeaderCell>Nombre</TableHeaderCell>
                <TableHeaderCell>Correo</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Respuestas</TableHeaderCell>
              </TableHeader>
              {formResponses.map((r, i) => {
                const name = getRespondentName(r);
                const email = getRespondentEmail(r);
                const initial = name.charAt(0).toUpperCase();
                const answeredQ = getRespondentAnswerCount(r);
                const avatarColors = ["#6542F4", "#2DB87F", "#F5A623", "#E34850", "#3B82F6", "#8B5CF6"];

                return (
                  <ClickableRow key={r.id} onClick={() => openIndividual(i)} title="Ver esta respuesta">
                    <CellText>{i + 1}</CellText>
                    <RespondentInfo>
                      <Avatar $size={30} $bg={avatarColors[i % avatarColors.length]}>{initial}</Avatar>
                      <strong>{name}</strong>
                    </RespondentInfo>
                    <CellText>{email}</CellText>
                    <CellText>{formatDate(r.submittedAt)}</CellText>
                    <CellText>{answeredQ} de {questionsCount}</CellText>
                  </ClickableRow>
                );
              })}
            </Table>
          ) : (
            <EmptyMsg>
              {isFiltered
                ? "No hay respuestas en ese rango de fechas."
                : "Aun no hay respuestas para este formulario."}
            </EmptyMsg>
          )
        )}

        {responsesState === "ready" && activeTab === "individual" && (
          current ? (
            <>
              <IndividualNav>
                <NavGroup>
                  <Button
                    $variant="secondary"
                    $size="sm"
                    onClick={() => setCurrentIndex(safeIndex - 1)}
                    disabled={safeIndex === 0}
                    title="Anterior"
                  >
                    <FiChevronLeft size={16} />
                  </Button>
                  <span>{safeIndex + 1} de {totalResponses}</span>
                  <Button
                    $variant="secondary"
                    $size="sm"
                    onClick={() => setCurrentIndex(safeIndex + 1)}
                    disabled={safeIndex >= totalResponses - 1}
                    title="Siguiente"
                  >
                    <FiChevronRight size={16} />
                  </Button>
                </NavGroup>
                {canDelete && (
                  <Button $variant="danger" $size="sm" onClick={() => setConfirmDelete(current)}>
                    <FiTrash2 size={14} /> Borrar respuesta
                  </Button>
                )}
              </IndividualNav>

              <DetailMeta>
                <FiClock size={14} /> Enviada el {formatDate(current.submittedAt)}
              </DetailMeta>

              {respondentRows(current).length > 0 && (
                <QuestionBlock>
                  <QHeader><QTitle>Datos del respondedor</QTitle></QHeader>
                  <FieldGrid>
                    {respondentRows(current).map((row) => (
                      <div key={row.key} style={{ display: "contents" }}>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </FieldGrid>
                </QuestionBlock>
              )}

              {form.questions.map((q, i) => (
                <QuestionBlock key={q.id}>
                  <QHeader>
                    <QTitle><QNum>{i + 1}</QNum>{q.title || "Pregunta sin titulo"}</QTitle>
                    <QType>{typeLabels[q.type]}</QType>
                  </QHeader>
                  <div style={{ marginTop: 12 }}>{renderAnswer(q, current.answers?.[q.id])}</div>
                </QuestionBlock>
              ))}
            </>
          ) : (
            <EmptyMsg>
              {isFiltered
                ? "No hay respuestas en ese rango de fechas."
                : "Aun no hay respuestas para este formulario."}
            </EmptyMsg>
          )
        )}

        {confirmDelete && (
          <ModalOverlay onClick={() => !deleting && setConfirmDelete(null)}>
            <Modal onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>
                  <WarningIcon><FiAlertTriangle size={20} /></WarningIcon>
                  Borrar respuesta
                </h2>
                <Button $variant="ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                  <FiX size={18} />
                </Button>
              </ModalHeader>
              <ModalBody>
                Se borrara para siempre la respuesta de <strong>{getRespondentName(confirmDelete)}</strong>{" "}
                enviada el {formatDate(confirmDelete.submittedAt)}. Esta accion no se puede deshacer.
              </ModalBody>
              <ModalActions>
                <Button $variant="secondary" onClick={() => setConfirmDelete(null)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button $variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Spinner $size={13} $color="currentColor" />}
                  {deleting ? "Borrando..." : "Borrar respuesta"}
                </Button>
              </ModalActions>
            </Modal>
          </ModalOverlay>
        )}

        {/* En las dos pestanas, en el mismo sitio: el informe es el mismo. */}
        {responsesState === "ready" && (
          <DownloadDock>
            {downloadMenuOpen && (
              <DownloadMenu role="menu">
                <DownloadOption role="menuitem" onClick={() => handleDownload("pdf")}>
                  <FiFileText size={18} />
                  <span>Informe PDF<small>Graficos y detalle, para imprimir o enviar</small></span>
                </DownloadOption>
                <DownloadOption role="menuitem" onClick={() => handleDownload("xlsx")}>
                  <FiGrid size={18} />
                  <span>Excel (.xlsx)<small>Una fila por respuesta y hoja de resumen</small></span>
                </DownloadOption>
                <DownloadOption role="menuitem" onClick={() => handleDownload("csv")}>
                  <FiFile size={18} />
                  <span>CSV<small>Para otros sistemas</small></span>
                </DownloadOption>
              </DownloadMenu>
            )}
            <DownloadButton
              onClick={() => setDownloadMenuOpen((open) => !open)}
              disabled={downloading || totalResponses === 0}
              aria-haspopup="menu"
              aria-expanded={downloadMenuOpen}
              title={totalResponses === 0 ? "Todavia no hay respuestas para descargar" : "Descargar en PDF, Excel o CSV"}
            >
              {downloading ? <Spinner $size={14} $color="currentColor" /> : <FiDownload size={16} />}
              {downloading ? "Generando..." : "Descargar"}
            </DownloadButton>
          </DownloadDock>
        )}
      </Main>
    </Page>
  );
}

export default FormResults;
