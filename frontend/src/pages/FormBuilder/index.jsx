import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiType, FiAlignLeft,
  FiCircle, FiCheckSquare, FiChevronUp, FiChevronDown,
  FiEye, FiX, FiBarChart2, FiUser, FiToggleLeft, FiToggleRight, FiMail, FiPhone
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import Button from "../../components/atoms/Button";

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
  color: ${({ $active, theme }) => $active ? "white" : theme.colors.textSecondary};
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
  justify-content: flex-end;
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
    background: white;
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
    getForm, updateForm, addQuestion, updateQuestion,
    deleteQuestion, reorderQuestions, addOption, updateOption, deleteOption,
    updateIntroField, addIntroField, removeIntroField
  } = useForms();

  const form = getForm(id);
  const [activeQuestionId, setActiveQuestionId] = useState(
    form?.questions[0]?.id || null
  );

  if (!form) {
    return (
      <Page>
        <EmptyState>
          <h2>Formulario no encontrado</h2>
          <Button onClick={() => navigate("/formularios")}>Volver</Button>
        </EmptyState>
      </Page>
    );
  }

  const activeQuestion = form.questions.find((q) => q.id === activeQuestionId);
  const activeIndex = form.questions.findIndex((q) => q.id === activeQuestionId);

  const handleAddQuestion = (type) => {
    const newId = addQuestion(id, type);
    setActiveQuestionId(newId);
  };

  const handleDeleteQuestion = (qId) => {
    deleteQuestion(id, qId);
    if (activeQuestionId === qId) {
      const remaining = form.questions.filter((q) => q.id !== qId);
      setActiveQuestionId(remaining[0]?.id || null);
    }
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

  return (
    <Page>
      <LeftPanel>
        <PanelHeader>
          <BackButton onClick={() => navigate("/formularios")}>
            <FiArrowLeft size={18} />
          </BackButton>
          <FormTitle
            value={form.title}
            onChange={(e) => updateForm(id, { title: e.target.value })}
            placeholder="Titulo del formulario"
          />
        </PanelHeader>

        <IntroSection>
          <IntroSectionTitle>
            <FiUser size={12} /> Datos del respondedor
          </IntroSectionTitle>
          {form.introFields.map((field) => (
            <IntroFieldRow key={field.id}>
              <IntroToggle
                $on={field.enabled}
                onClick={() => updateIntroField(id, field.id, { enabled: !field.enabled })}
                title={field.enabled ? "Desactivar" : "Activar"}
              >
                {field.enabled ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
              </IntroToggle>
              {field.type === "email" ? <FiMail size={14} style={{ color: "#9E9EA7", flexShrink: 0 }} /> : field.type === "phone" ? <FiPhone size={14} style={{ color: "#9E9EA7", flexShrink: 0 }} /> : <FiUser size={14} style={{ color: "#9E9EA7", flexShrink: 0 }} />}
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
            <AddButton onClick={() => handleAddQuestion("short_text")}>
              <FiType size={14} /> Texto corto
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("long_text")}>
              <FiAlignLeft size={14} /> Texto largo
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("single_choice")}>
              <FiCircle size={14} /> Opcion unica
            </AddButton>
            <AddButton onClick={() => handleAddQuestion("multiple_choice")}>
              <FiCheckSquare size={14} /> Multiple
            </AddButton>
          </AddGrid>
        </AddSection>
      </LeftPanel>

      <MainEditor>
        <EditorToolbar>
          <Button
            $variant="secondary"
            $size="sm"
            onClick={() => navigate(`/formularios/${id}/resultados`)}
          >
            <FiBarChart2 size={14} /> Resultados
          </Button>
          <Button
            $variant="secondary"
            $size="sm"
            onClick={() => navigate(`/formularios/${id}/vista`)}
          >
            <FiEye size={14} /> Vista previa
          </Button>
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
                  <textarea
                    disabled
                    placeholder="Respuesta larga del usuario..."
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "10px 12px",
                      border: "1px solid #e8e8ed",
                      borderRadius: "6px",
                      opacity: 0.5,
                      cursor: "default",
                      resize: "none",
                      fontFamily: "inherit",
                      fontSize: "14px",
                    }}
                  />
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
