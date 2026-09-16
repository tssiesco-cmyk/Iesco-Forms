import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { css } from "styled-components";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiType, FiAlignLeft,
  FiCircle, FiCheckSquare, FiChevronUp, FiChevronDown,
  FiEye, FiX, FiBarChart2, FiUser, FiToggleLeft, FiToggleRight, FiMail, FiPhone,
  FiSend, FiRotateCcw, FiCheck, FiAlertCircle, FiImage, FiUpload,
  FiCopy, FiChevronsLeft, FiChevronsRight, FiShare2
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import Button from "../../components/atoms/Button";
import Badge from "../../components/atoms/Badge";
import Spinner from "../../components/atoms/Spinner";
import { ErrorState, LoadingState } from "../../components/molecules/StateView";
import ShareFormModal from "../../components/organisms/ShareFormModal";
import FormLinksPanel from "../../components/organisms/FormLinksPanel";

const Page = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  /* El panel se cierra saliendose hacia la derecha; sin esto asomaria una barra
     de scroll horizontal mientras dura la animacion. */
  overflow: hidden;
`;

/* --- LEFT PANEL: titulo, fondo y datos del usuario --- */
const LeftPanel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  /* Con fondo, datos, formato y enlaces ya no cabe todo: se desplaza. */
  overflow-y: auto;
`;

/* --- SIDE PANEL: solo las preguntas, a la derecha del editor --- */
const SidePanel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Al cerrarse se sale del flujo en vez de encogerse: asi el contenido de
     dentro no se reacomoda en cada frame mientras se desliza. */
  margin-right: ${({ $open }) => ($open ? "0" : "-320px")};
  transform: translateX(${({ $open }) => ($open ? "0" : "100%")});
  transition: margin-right 0.22s ease, transform 0.22s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const PanelHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

// Titulo y subtitulo comparten columna para que el boton de volver quede
// centrado contra el bloque entero y no contra la primera linea.
const HeaderTitles = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FormTitle = styled.input`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const FormSubtitle = styled.input`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

/* --- Formato de la respuesta (mayusculas / minusculas) --- */
const CaseSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const CaseTarget = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 6px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CaseGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin: 0 6px;
`;

const CaseButton = styled.button`
  padding: 8px 4px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surface};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const QuestionsHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const QuestionsCount = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.normal};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const QuestionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const QuestionTypeIcon = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const QuestionActions = styled.div`
  display: none;
  gap: 2px;
  flex-shrink: 0;
`;

const QuestionActionBtn = styled.button`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    background: ${({ $danger, theme }) => $danger ? theme.colors.dangerBg : theme.colors.surface};
    color: ${({ $danger, theme }) => $danger ? theme.colors.danger : theme.colors.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

// Duplicar y eliminar reemplazan al icono de tipo en vez de sumarse a el, para
// que la fila no cambie de ancho al pasar el mouse.
const showRowActions = css`
  ${QuestionTypeIcon} { display: none; }
  ${QuestionActions} { display: flex; }
`;

const QuestionItem = styled.div`
  width: 100%;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  margin-bottom: 4px;
  cursor: ${({ $dragging }) => $dragging ? "grabbing" : "grab"};
  opacity: ${({ $dragging }) => $dragging ? 0.4 : 1};
  transition: background 0.1s ease, opacity 0.1s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : "transparent"};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.medium : theme.fontWeights.normal};

  /* La linea indica de que lado va a caer la pregunta que se esta arrastrando. */
  box-shadow: ${({ $dropLine, theme }) =>
    $dropLine === "before" ? `inset 0 2px 0 ${theme.colors.primary}`
      : $dropLine === "after" ? `inset 0 -2px 0 ${theme.colors.primary}`
        : "none"};

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surfaceAlt};
  }

  &:hover, &:focus-within { ${showRowActions} }

  /* En la pregunta abierta se quedan fijas: es la que mas se va a tocar. */
  ${({ $active }) => $active && showRowActions}
`;

const QuestionNumber = styled.span`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.surfaceAlt};
  color: ${({ $active, theme }) => $active ? theme.colors.textInverse : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const QuestionLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.md};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AddSection = styled.div`
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const AddTitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px;
`;

const AddGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const AddButton = styled.button`
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

/* --- MAIN EDITOR --- */
const MainEditor = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const EditorToolbar = styled.div`
  padding: 16px 32px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ToolbarStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToolbarHint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SaveIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $tone, theme }) => theme.colors[$tone] || theme.colors.textMuted};
  transition: color 0.2s ease;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PanelToggle = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const EditorContent = styled.div`
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
`;

const EditorCard = styled.div`
  width: 100%;
  max-width: 640px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  color: ${({ theme }) => theme.colors.textMuted};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 16px 0 8px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

/* --- QUESTION EDITOR --- */
const QEditor = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 28px;
  margin-bottom: 20px;
`;

const QHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
`;

const QTitleInput = styled.input`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: none;
  border-bottom: 2px solid transparent;
  padding-bottom: 4px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.15s;

  &:focus {
    border-bottom-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const QDescInput = styled.input`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.base};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 20px;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const QActions = styled.div`
  display: flex;
  gap: 4px;
`;

const QActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const DeleteBtn = styled(QActionBtn)`
  &:hover {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const OptionMarker = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ $type }) => $type === "single_choice" ? "50%" : "4px"};
  flex-shrink: 0;
`;

const OptionInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const RemoveOptionBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.dangerBg};
    color: ${({ theme }) => theme.colors.danger};
  }
`;

/* Vista previa inerte de como se vera el campo para quien responde */
const PreviewTextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: inherit;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.5;
  cursor: default;
  resize: none;
`;

const AddOptionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const QFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const RequiredToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
`;

const Toggle = styled.div`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.border};
  position: relative;
  transition: background 0.2s;

  &::after {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surface};
    top: 2px;
    left: ${({ $active }) => $active ? "18px" : "2px"};
    transition: left 0.2s;
  }
`;

const TypeLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 4px 8px;
  border-radius: 4px;
`;

/* --- INTRO FIELDS SECTION --- */
const IntroSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const IntroSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 10px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const IntroFieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  margin-bottom: 4px;

  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const IntroFieldInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  min-width: 0;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const IntroToggle = styled.button`
  color: ${({ $on, theme }) => $on ? theme.colors.primary : theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const IntroRemoveBtn = styled.button`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 2px;
  border-radius: 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerBg};
  }
`;

/* --- FONDO DE LA ENCUESTA --- */
const BackgroundSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const BackgroundPreview = styled.div`
  height: 92px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px dashed ${({ $hasImage, theme }) => ($hasImage ? "transparent" : theme.colors.border)};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  background-image: ${({ $image }) => ($image ? `url(${$image})` : "none")};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  gap: 7px;
  margin-bottom: 8px;
  overflow: hidden;
`;

const BackgroundActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const BackgroundButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $danger, theme }) => ($danger ? theme.colors.danger : theme.colors.primary)};

  &:hover {
    background: ${({ $danger, theme }) => ($danger ? theme.colors.dangerBg : theme.colors.primaryBg)};
  }

  &:disabled { opacity: 0.5; cursor: default; }
`;

const OverlayToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  input {
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }
`;

const BackgroundHint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 8px 0 0;
  line-height: 1.45;
`;

const QuestionBackground = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0 4px;
  margin-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const QuestionBackgroundPreview = styled.div`
  width: 88px;
  height: 56px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px dashed ${({ $image, theme }) => ($image ? "transparent" : theme.colors.border)};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  background-image: ${({ $image }) => ($image ? `url(${$image})` : "none")};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const QuestionBackgroundLabel = styled.p`
  margin: 0 0 7px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const IntroFieldIcon = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const IntroEmpty = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.45;
  margin: 0 6px 10px;
`;

const IntroAddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover { background: ${({ theme }) => theme.colors.primaryLight}; }
`;

const typeLabels = {
  short_text: "Texto corto",
  long_text: "Texto largo",
  single_choice: "Opcion unica",
  multiple_choice: "Opcion multiple",
};

// El formato solo cambia algo donde se escribe libremente; en las de opciones
// el texto lo fija quien arma el formulario, no quien responde.
const TEXT_TYPES = ["short_text", "long_text"];

const caseOptions = [
  { value: "upper", label: "MAYUSCULA" },
  { value: "normal", label: "Normal" },
  { value: "lower", label: "minuscula" },
];

const typeIcons = {
  short_text: <FiType size={14} />,
  long_text: <FiAlignLeft size={14} />,
  single_choice: <FiCircle size={14} />,
  multiple_choice: <FiCheckSquare size={14} />,
};

function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getForm, status, error, reload, saveState, flushPendingWrites,
    uploadBackground, removeBackground, setBackgroundOverlay,
    setBackgroundPerQuestion, uploadQuestionBackground, removeQuestionBackground,
    uploadIntroBackground, removeIntroBackground,
    updateForm, addQuestion, updateQuestion,
    deleteQuestion, duplicateQuestion, reorderQuestions, addOption, updateOption, deleteOption,
    updateIntroField, addIntroField, removeIntroField
  } = useForms();

  const form = getForm(id);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [addingType, setAddingType] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  // Solo el indice de donde salio la pregunta y el de la fila que se sobrevuela:
  // con eso alcanza para pintar la linea y para llamar a reorderQuestions.
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingQuestion, setUploadingQuestion] = useState(false);
  const [uploadingIntro, setUploadingIntro] = useState(false);
  const [sharing, setSharing] = useState(false);
  const fileInputRef = useRef(null);
  const questionFileInputRef = useRef(null);
  const introFileInputRef = useRef(null);

  const handlePickFile = async (event) => {
    const file = event.target.files?.[0];
    // Se limpia el input para que elegir el mismo archivo otra vez vuelva a disparar.
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    await uploadBackground(id, file);
    setUploading(false);
  };

  const handlePickIntroFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingIntro(true);
    await uploadIntroBackground(id, file);
    setUploadingIntro(false);
  };

  const handlePickQuestionFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeQuestionId) return;

    setUploadingQuestion(true);
    await uploadQuestionBackground(id, activeQuestionId, file);
    setUploadingQuestion(false);
  };

  // Al entrar directo por URL el formulario aun no esta cargado, asi que no hay
  // nada que seleccionar. En vez de sincronizarlo con un efecto, la pregunta
  // activa se deriva aqui: la elegida si sigue existiendo, si no la primera.
  const questions = form?.questions ?? [];
  const activeQuestionId =
    selectedQuestionId && questions.some((q) => q.id === selectedQuestionId)
      ? selectedQuestionId
      : questions[0]?.id ?? null;
  const setActiveQuestionId = setSelectedQuestionId;

  if (status === "loading") {
    return (
      <Page>
        <LoadingState text="Cargando formulario..." />
      </Page>
    );
  }

  if (status === "error") {
    return (
      <Page>
        <ErrorState error={error} onRetry={reload} />
      </Page>
    );
  }

  if (!form) {
    return (
      <Page>
        <EmptyState>
          <h2>Formulario no encontrado</h2>
          <p>Puede que se haya eliminado o que el enlace sea incorrecto.</p>
          <div style={{ marginTop: 20 }}>
            <Button onClick={() => navigate("/formularios")}>Volver a mis formularios</Button>
          </div>
        </EmptyState>
      </Page>
    );
  }

  // Los compartidos vuelven a Compartidos, no a una lista donde no estan.
  const backPath = form.sharedPermission ? "/compartidos" : "/formularios";

  const activeQuestion = form.questions.find((q) => q.id === activeQuestionId);
  const activeIndex = form.questions.findIndex((q) => q.id === activeQuestionId);

  const handleAddQuestion = async (type) => {
    if (addingType) return;

    setAddingType(type);
    const newId = await addQuestion(id, type);
    setAddingType(null);

    if (newId) setActiveQuestionId(newId);
  };

  // No hace falta reelegir pregunta: al desaparecer la seleccionada, la
  // derivacion de arriba cae sola sobre la primera que quede.
  const handleDeleteQuestion = (qId) => deleteQuestion(id, qId);

  const handleDuplicateQuestion = async (qId) => {
    if (duplicatingId) return;

    setDuplicatingId(qId);
    const newId = await duplicateQuestion(id, qId);
    setDuplicatingId(null);

    // La copia queda justo debajo de la original y se abre para editarla.
    if (newId) setActiveQuestionId(newId);
  };

  // --- Arrastrar para reordenar ---
  // El movimiento real lo hace reorderQuestions, el mismo que usan las flechas
  // del editor; aqui solo se traduce el gesto a un par de indices.

  const handleDragStart = (index) => (event) => {
    event.dataTransfer.effectAllowed = "move";
    // Firefox no arranca el arrastre si no se escribe algo en dataTransfer.
    event.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  };

  const handleDragOver = (index) => (event) => {
    // Sin preventDefault el navegador no acepta la fila como destino valido.
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (index) => (event) => {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderQuestions(id, dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  // Tambien corre cuando se suelta fuera de la lista, asi que es el que
  // garantiza que no quede una linea dibujada para siempre.
  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const dropLineFor = (index) => {
    if (dragIndex === null || dragIndex === index || overIndex !== index) return null;
    // Bajando, la pregunta cae debajo de la sobrevolada; subiendo, encima.
    return dragIndex < index ? "after" : "before";
  };

  const handleMoveUp = () => {
    if (activeIndex > 0) {
      reorderQuestions(id, activeIndex, activeIndex - 1);
    }
  };

  const handleMoveDown = () => {
    if (activeIndex < form.questions.length - 1) {
      reorderQuestions(id, activeIndex, activeIndex + 1);
    }
  };

  const isPublished = form.status === "Activo";
  // Un formulario vacio no se puede publicar: necesita al menos una pregunta
  // o un campo de datos del usuario activo.
  const canPublish =
    form.questions.length > 0 || form.introFields.some((f) => f.enabled);

  const handlePublish = () => {
    if (!canPublish) return;
    // Antes de publicar se manda lo que este esperando, para que no se publique
    // una version sin el ultimo texto escrito.
    flushPendingWrites();
    updateForm(id, { status: "Activo" });
  };

  const handleUnpublish = () => updateForm(id, { status: "Borrador" });

  return (
    <Page>
      {sharing && <ShareFormModal form={form} onClose={() => setSharing(false)} />}

      <LeftPanel>
        <PanelHeader>
          <BackButton onClick={() => { flushPendingWrites(); navigate(backPath); }}>
            <FiArrowLeft size={18} />
          </BackButton>
          <HeaderTitles>
            <FormTitle
              value={form.title}
              onChange={(e) => updateForm(id, { title: e.target.value })}
              placeholder="Titulo del formulario"
              aria-label="Titulo del formulario"
            />
            <FormSubtitle
              value={form.description || ""}
              onChange={(e) => updateForm(id, { description: e.target.value })}
              placeholder="Subtitulo (opcional)"
              aria-label="Subtitulo del formulario"
            />
          </HeaderTitles>
        </PanelHeader>

        <BackgroundSection>
          <IntroSectionTitle>
            <FiImage size={12} /> Fondo de la encuesta
          </IntroSectionTitle>

          <BackgroundPreview $image={form.backgroundImage} $hasImage={Boolean(form.backgroundImage)}>
            {!form.backgroundImage && <><FiImage size={14} /> Sin fondo</>}
          </BackgroundPreview>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePickFile}
            hidden
          />

          <BackgroundActions>
            <BackgroundButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Spinner $size={12} /> : <FiUpload size={12} />}
              {uploading ? "Subiendo..." : form.backgroundImage ? "Cambiar" : "Subir imagen"}
            </BackgroundButton>

            {form.backgroundImage && (
              <BackgroundButton $danger onClick={() => removeBackground(id)} disabled={uploading}>
                <FiX size={12} /> Quitar
              </BackgroundButton>
            )}
          </BackgroundActions>

          <OverlayToggle>
            <input
              type="checkbox"
              checked={Boolean(form.backgroundPerQuestion)}
              onChange={(e) => setBackgroundPerQuestion(id, e.target.checked)}
            />
            Imagen distinta por pregunta
          </OverlayToggle>

          {form.backgroundImage && (
            <OverlayToggle>
              <input
                type="checkbox"
                checked={form.backgroundOverlay !== false}
                onChange={(e) => setBackgroundOverlay(id, e.target.checked)}
              />
              Velo oscuro para que se lea el texto
            </OverlayToggle>
          )}

          <BackgroundHint>
            {form.backgroundPerQuestion
              ? "Cada pregunta puede tener la suya. Las que no tengan usan esta."
              : "PNG, JPG o WebP. Maximo 5 MB."}
          </BackgroundHint>
        </BackgroundSection>

        <IntroSection>
          <IntroSectionTitle>
            <FiUser size={12} /> Datos del usuario
          </IntroSectionTitle>
          {form.introFields.length === 0 && (
            <IntroEmpty>
              Sin campos. Agrega los que necesites para pedir datos antes de las preguntas.
            </IntroEmpty>
          )}
          {form.introFields.map((field) => (
            <IntroFieldRow key={field.id}>
              <IntroToggle
                $on={field.enabled}
                onClick={() => updateIntroField(id, field.id, { enabled: !field.enabled })}
                title={field.enabled ? "Desactivar" : "Activar"}
              >
                {field.enabled ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
              </IntroToggle>
              <IntroFieldIcon>
                {field.type === "email" ? <FiMail size={14} /> : field.type === "phone" ? <FiPhone size={14} /> : <FiUser size={14} />}
              </IntroFieldIcon>
              <IntroFieldInput
                value={field.label}
                onChange={(e) => updateIntroField(id, field.id, { label: e.target.value })}
                placeholder="Nombre del campo"
              />
              <IntroRemoveBtn onClick={() => removeIntroField(id, field.id)}>
                <FiX size={14} />
              </IntroRemoveBtn>
            </IntroFieldRow>
          ))}
          {form.backgroundPerQuestion && (
            <QuestionBackground>
              <QuestionBackgroundPreview
                $image={form.introBackgroundImage || form.backgroundImage}
              >
                {!form.introBackgroundImage && !form.backgroundImage && (
                  <><FiImage size={13} /> Sin imagen</>
                )}
              </QuestionBackgroundPreview>

              <div>
                <QuestionBackgroundLabel>
                  {form.introBackgroundImage
                    ? "Imagen de esta pantalla"
                    : "Usando la imagen del formulario"}
                </QuestionBackgroundLabel>

                <input
                  ref={introFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePickIntroFile}
                  hidden
                />

                <BackgroundActions>
                  <BackgroundButton
                    onClick={() => introFileInputRef.current?.click()}
                    disabled={uploadingIntro}
                  >
                    {uploadingIntro ? <Spinner $size={12} /> : <FiUpload size={12} />}
                    {uploadingIntro
                      ? "Subiendo..."
                      : form.introBackgroundImage ? "Cambiar" : "Subir imagen"}
                  </BackgroundButton>

                  {form.introBackgroundImage && (
                    <BackgroundButton
                      $danger
                      onClick={() => removeIntroBackground(id)}
                      disabled={uploadingIntro}
                    >
                      <FiX size={12} /> Quitar
                    </BackgroundButton>
                  )}
                </BackgroundActions>
              </div>
            </QuestionBackground>
          )}

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            <IntroAddBtn onClick={() => addIntroField(id, "name")}>
              <FiUser size={12} /> Nombre
            </IntroAddBtn>
            <IntroAddBtn onClick={() => addIntroField(id, "phone")}>
              <FiPhone size={12} /> Telefono
            </IntroAddBtn>
            <IntroAddBtn onClick={() => addIntroField(id, "email")}>
              <FiMail size={12} /> Correo
            </IntroAddBtn>
            <IntroAddBtn onClick={() => addIntroField(id, "text")}>
              <FiPlus size={12} /> Otro
            </IntroAddBtn>
          </div>
        </IntroSection>

        <CaseSection>
          <IntroSectionTitle>
            <FiType size={12} /> Formato de la respuesta
          </IntroSectionTitle>

          {!activeQuestion ? (
            <IntroEmpty>
              Elige una pregunta en el panel de la derecha para fijar su formato.
            </IntroEmpty>
          ) : !TEXT_TYPES.includes(activeQuestion.type) ? (
            <IntroEmpty>
              Solo aplica a las preguntas de texto. La que tienes abierta es de opciones.
            </IntroEmpty>
          ) : (
            <>
              <CaseTarget>
                Pregunta {activeIndex + 1}: {activeQuestion.title || "Sin titulo"}
              </CaseTarget>

              <CaseGroup role="group" aria-label="Formato de la respuesta">
                {caseOptions.map((option) => {
                  // Las preguntas creadas antes de esta opcion no traen el campo.
                  const current = activeQuestion.textCase || "normal";

                  return (
                    <CaseButton
                      key={option.value}
                      $active={current === option.value}
                      aria-pressed={current === option.value}
                      onClick={() =>
                        updateQuestion(id, activeQuestion.id, { textCase: option.value })
                      }
                    >
                      {option.label}
                    </CaseButton>
                  );
                })}
              </CaseGroup>

              <BackgroundHint>
                Manda sobre el Bloq Mayus: la respuesta se convierte sola al escribirla.
              </BackgroundHint>
            </>
          )}
        </CaseSection>

        <FormLinksPanel formId={id} isPublished={isPublished} />
      </LeftPanel>

      <MainEditor>
        <EditorToolbar>
          <ToolbarStatus>
            <Badge $variant={isPublished ? "success" : "warning"}>
              {isPublished ? "Publicado" : "Borrador"}
            </Badge>

            {saveState === "saving" && (
              <SaveIndicator><Spinner $size={12} /> Guardando...</SaveIndicator>
            )}
            {saveState === "saved" && (
              <SaveIndicator $tone="success"><FiCheck size={13} /> Guardado</SaveIndicator>
            )}
            {saveState === "error" && (
              <SaveIndicator $tone="danger"><FiAlertCircle size={13} /> Sin guardar</SaveIndicator>
            )}

            {saveState === "idle" && !isPublished && !canPublish && (
              <ToolbarHint>Agrega una pregunta o un campo para poder publicar</ToolbarHint>
            )}
          </ToolbarStatus>

          <ToolbarActions>
            {form.access === "owner" && (
              <Button $variant="secondary" $size="sm" onClick={() => setSharing(true)}>
                <FiShare2 size={14} /> Compartir
              </Button>
            )}
            <Button
              $variant="secondary"
              $size="sm"
              onClick={() => { flushPendingWrites(); navigate(`/formularios/${id}/resultados`); }}
            >
              <FiBarChart2 size={14} /> Resultados
            </Button>
            <Button
              $variant="secondary"
              $size="sm"
              onClick={() => { flushPendingWrites(); navigate(`/formularios/${id}/vista`); }}
            >
              <FiEye size={14} /> Vista previa
            </Button>
            {isPublished ? (
              <Button $variant="secondary" $size="sm" onClick={handleUnpublish}>
                <FiRotateCcw size={14} /> Volver a borrador
              </Button>
            ) : (
              <Button $size="sm" onClick={handlePublish} disabled={!canPublish}>
                <FiSend size={14} /> Publicar
              </Button>
            )}

            <PanelToggle
              onClick={() => setPanelOpen((open) => !open)}
              title={panelOpen ? "Ocultar panel de preguntas" : "Mostrar panel de preguntas"}
              aria-label={panelOpen ? "Ocultar panel de preguntas" : "Mostrar panel de preguntas"}
              aria-expanded={panelOpen}
            >
              {panelOpen ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
            </PanelToggle>
          </ToolbarActions>
        </EditorToolbar>

        <EditorContent>
          <EditorCard>
            {!activeQuestion ? (
              <EmptyState>
                <EmptyIcon><FiPlus size={24} /></EmptyIcon>
                <h2>Agrega tu primera pregunta</h2>
                <p>Usa el panel derecho para agregar preguntas a tu formulario.</p>
              </EmptyState>
            ) : (
              <QEditor>
                <QHeader>
                  <QTitleInput
                    value={activeQuestion.title}
                    onChange={(e) =>
                      updateQuestion(id, activeQuestion.id, { title: e.target.value })
                    }
                    placeholder="Escribe tu pregunta aqui..."
                  />
                  <QActions>
                    <QActionBtn onClick={handleMoveUp} disabled={activeIndex === 0}>
                      <FiChevronUp size={16} />
                    </QActionBtn>
                    <QActionBtn
                      onClick={handleMoveDown}
                      disabled={activeIndex === form.questions.length - 1}
                    >
                      <FiChevronDown size={16} />
                    </QActionBtn>
                    <DeleteBtn onClick={() => handleDeleteQuestion(activeQuestion.id)}>
                      <FiTrash2 size={16} />
                    </DeleteBtn>
                  </QActions>
                </QHeader>

                <QDescInput
                  value={activeQuestion.description}
                  onChange={(e) =>
                    updateQuestion(id, activeQuestion.id, { description: e.target.value })
                  }
                  placeholder="Descripcion (opcional)"
                />

                {(activeQuestion.type === "single_choice" ||
                  activeQuestion.type === "multiple_choice") && (
                  <>
                    <OptionsList>
                      {activeQuestion.options.map((opt, i) => (
                        <OptionRow key={opt.id}>
                          <OptionMarker $type={activeQuestion.type} />
                          <OptionInput
                            value={opt.text}
                            onChange={(e) =>
                              updateOption(id, activeQuestion.id, opt.id, e.target.value)
                            }
                            placeholder={`Opcion ${i + 1}`}
                          />
                          {activeQuestion.options.length > 1 && (
                            <RemoveOptionBtn
                              onClick={() => deleteOption(id, activeQuestion.id, opt.id)}
                            >
                              <FiX size={14} />
                            </RemoveOptionBtn>
                          )}
                        </OptionRow>
                      ))}
                    </OptionsList>
                    <AddOptionBtn onClick={() => addOption(id, activeQuestion.id)}>
                      <FiPlus size={14} /> Agregar opcion
                    </AddOptionBtn>
                  </>
                )}

                {activeQuestion.type === "short_text" && (
                  <OptionInput
                    disabled
                    placeholder="Respuesta corta del usuario..."
                    style={{ opacity: 0.5, cursor: "default" }}
                  />
                )}

                {activeQuestion.type === "long_text" && (
                  <PreviewTextArea
                    disabled
                    placeholder="Respuesta larga del usuario..."
                  />
                )}

                {form.backgroundPerQuestion && (
                  <QuestionBackground>
                    <QuestionBackgroundPreview
                      $image={activeQuestion.backgroundImage || form.backgroundImage}
                    >
                      {!activeQuestion.backgroundImage && !form.backgroundImage && (
                        <><FiImage size={13} /> Sin imagen</>
                      )}
                    </QuestionBackgroundPreview>

                    <div>
                      <QuestionBackgroundLabel>
                        {activeQuestion.backgroundImage
                          ? "Imagen de esta pregunta"
                          : "Usando la imagen del formulario"}
                      </QuestionBackgroundLabel>

                      <input
                        ref={questionFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePickQuestionFile}
                        hidden
                      />

                      <BackgroundActions>
                        <BackgroundButton
                          onClick={() => questionFileInputRef.current?.click()}
                          disabled={uploadingQuestion}
                        >
                          {uploadingQuestion ? <Spinner $size={12} /> : <FiUpload size={12} />}
                          {uploadingQuestion
                            ? "Subiendo..."
                            : activeQuestion.backgroundImage ? "Cambiar" : "Subir imagen"}
                        </BackgroundButton>

                        {activeQuestion.backgroundImage && (
                          <BackgroundButton
                            $danger
                            onClick={() => removeQuestionBackground(id, activeQuestion.id)}
                            disabled={uploadingQuestion}
                          >
                            <FiX size={12} /> Quitar
                          </BackgroundButton>
                        )}
                      </BackgroundActions>
                    </div>
                  </QuestionBackground>
                )}

                <QFooter>
                  <TypeLabel>{typeLabels[activeQuestion.type]}</TypeLabel>
                  <RequiredToggle>
                    Obligatoria
                    <Toggle
                      $active={activeQuestion.required}
                      onClick={() =>
                        updateQuestion(id, activeQuestion.id, {
                          required: !activeQuestion.required,
                        })
                      }
                    />
                  </RequiredToggle>
                </QFooter>
              </QEditor>
            )}
          </EditorCard>
        </EditorContent>
      </MainEditor>

      <SidePanel $open={panelOpen}>
        <QuestionsHeader>
          Preguntas
          <QuestionsCount>{form.questions.length}</QuestionsCount>
        </QuestionsHeader>

        <QuestionList>
          {form.questions.map((q, i) => (
            <QuestionItem
              key={q.id}
              draggable
              tabIndex={0}
              aria-current={q.id === activeQuestionId || undefined}
              $active={q.id === activeQuestionId}
              $dragging={dragIndex === i}
              $dropLine={dropLineFor(i)}
              onClick={() => setActiveQuestionId(q.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveQuestionId(q.id);
                }
              }}
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDrop={handleDrop(i)}
              onDragEnd={handleDragEnd}
            >
              <QuestionNumber $active={q.id === activeQuestionId}>
                {i + 1}
              </QuestionNumber>
              <QuestionLabel>
                {q.title || "Pregunta sin titulo"}
              </QuestionLabel>

              <QuestionTypeIcon>{typeIcons[q.type]}</QuestionTypeIcon>

              <QuestionActions>
                <QuestionActionBtn
                  title="Duplicar pregunta"
                  aria-label="Duplicar pregunta"
                  disabled={Boolean(duplicatingId)}
                  onClick={(event) => {
                    // Sin esto el clic tambien abriria la pregunta de la fila.
                    event.stopPropagation();
                    handleDuplicateQuestion(q.id);
                  }}
                >
                  {duplicatingId === q.id ? <Spinner $size={12} /> : <FiCopy size={13} />}
                </QuestionActionBtn>

                <QuestionActionBtn
                  $danger
                  title="Eliminar pregunta"
                  aria-label="Eliminar pregunta"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteQuestion(q.id);
                  }}
                >
                  <FiTrash2 size={13} />
                </QuestionActionBtn>
              </QuestionActions>
            </QuestionItem>
          ))}
        </QuestionList>

        <AddSection>
          <AddTitle>Agregar pregunta</AddTitle>
          <AddGrid>
            <AddButton onClick={() => handleAddQuestion("short_text")} disabled={Boolean(addingType)}>
              {addingType === "short_text" ? <Spinner $size={14} /> : <FiType size={14} />} Texto corto
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("long_text")} disabled={Boolean(addingType)}>
              {addingType === "long_text" ? <Spinner $size={14} /> : <FiAlignLeft size={14} />} Texto largo
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("single_choice")} disabled={Boolean(addingType)}>
              {addingType === "single_choice" ? <Spinner $size={14} /> : <FiCircle size={14} />} Opcion unica
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("multiple_choice")} disabled={Boolean(addingType)}>
              {addingType === "multiple_choice" ? <Spinner $size={14} /> : <FiCheckSquare size={14} />} Multiple
            </AddButton>
          </AddGrid>
        </AddSection>
      </SidePanel>

    </Page>
  );
}

export default FormBuilder;
