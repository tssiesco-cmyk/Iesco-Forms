import { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiType, FiAlignLeft,
  FiCircle, FiCheckSquare, FiChevronUp, FiChevronDown,
  FiEye, FiX, FiBarChart2, FiUser, FiToggleLeft, FiToggleRight, FiMail, FiPhone,
  FiSend, FiRotateCcw, FiCheck, FiAlertCircle, FiImage, FiUpload
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import Button from "../../components/atoms/Button";
import Badge from "../../components/atoms/Badge";
import Spinner from "../../components/atoms/Spinner";
import { ErrorState, LoadingState } from "../../components/molecules/StateView";

const Page = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

/* --- LEFT PANEL --- */
const LeftPanel = styled.aside`
  width: 320px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

const FormTitle = styled.input`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const QuestionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const QuestionItem = styled.button`
  width: 100%;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  margin-bottom: 4px;
  transition: all 0.1s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : "transparent"};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.medium : theme.fontWeights.normal};

  &:hover {
    background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surfaceAlt};
  }
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
    deleteQuestion, reorderQuestions, addOption, updateOption, deleteOption,
    updateIntroField, addIntroField, removeIntroField
  } = useForms();

  const form = getForm(id);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [addingType, setAddingType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingQuestion, setUploadingQuestion] = useState(false);
  const [uploadingIntro, setUploadingIntro] = useState(false);
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
  // o un campo de datos del respondedor activo.
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
      <LeftPanel>
        <PanelHeader>
          <BackButton onClick={() => { flushPendingWrites(); navigate("/formularios"); }}>
            <FiArrowLeft size={18} />
          </BackButton>
          <FormTitle
            value={form.title}
            onChange={(e) => updateForm(id, { title: e.target.value })}
            placeholder="Titulo del formulario"
          />
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
            <FiUser size={12} /> Datos del respondedor
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

        <QuestionList>
          {form.questions.map((q, i) => (
            <QuestionItem
              key={q.id}
              $active={q.id === activeQuestionId}
              onClick={() => setActiveQuestionId(q.id)}
            >
              <QuestionNumber $active={q.id === activeQuestionId}>
                {i + 1}
              </QuestionNumber>
              <QuestionLabel>
                {q.title || "Pregunta sin titulo"}
              </QuestionLabel>
              {typeIcons[q.type]}
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
          </ToolbarActions>
        </EditorToolbar>

        <EditorContent>
          <EditorCard>
            {!activeQuestion ? (
              <EmptyState>
                <EmptyIcon><FiPlus size={24} /></EmptyIcon>
                <h2>Agrega tu primera pregunta</h2>
                <p>Usa el panel izquierdo para agregar preguntas a tu formulario.</p>
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
    </Page>
  );
}

export default FormBuilder;
