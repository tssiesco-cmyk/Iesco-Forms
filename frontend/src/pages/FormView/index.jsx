import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { FiArrowRight, FiArrowLeft, FiCheck, FiX, FiUser, FiMail } from "react-icons/fi";
import { useForms } from "../../context/FormContext";

/* --- ANIMATIONS --- */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

/* --- LAYOUT --- */
const Page = styled.div`
  min-height: 100vh;
  background: ${({ $bg }) => $bg || "#6542F4"};
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background 0.5s ease;
`;

const ProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.9);
  transition: width 0.4s ease;
  z-index: 100;
`;

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.25); }
`;

const FormTitleBar = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
`;

const QuestionContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 120px;
  animation: ${({ $direction }) =>
    $direction === "forward"
      ? css`${slideUp} 0.4s ease`
      : css`${slideDown} 0.4s ease`};
`;

const QuestionCard = styled.div`
  width: 100%;
  max-width: 620px;
  color: white;
`;

const QuestionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
  font-weight: 500;
`;

const QuestionTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
`;

const QuestionDesc = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 32px;
  line-height: 1.5;
`;

const RequiredBadge = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-left: 4px;
`;

/* --- INPUT TYPES --- */
const TextInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 22px;
  padding: 12px 0;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;

  &:focus {
    border-bottom-color: white;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 20px;
  padding: 12px 0;
  outline: none;
  resize: none;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: white;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

const OptionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OptionButton = styled.button`
  width: 100%;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, ${({ $selected }) => $selected ? "0.9" : "0.25"});
  background: ${({ $selected }) => $selected ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.07)"};
  color: white;
  font-size: 16px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.15s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const OptionKey = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, ${({ $selected }) => $selected ? "0.3" : "0.12"});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const OptionCheckmark = styled.div`
  width: 22px;
  height: 22px;
  border-radius: ${({ $type }) => $type === "single_choice" ? "50%" : "4px"};
  border: 2px solid rgba(255, 255, 255, ${({ $selected }) => $selected ? "0.9" : "0.3"});
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  transition: all 0.15s;
  background: ${({ $selected }) => $selected ? "rgba(255, 255, 255, 0.9)" : "transparent"};
  color: ${({ $selected }) => $selected ? "#6542F4" : "transparent"};
`;

/* --- NAVIGATION --- */
const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const NavButton = styled.button`
  height: 44px;
  padding: 0 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(8px);
  transition: all 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.25); }
  &:disabled { opacity: 0.3; cursor: default; }
`;

const SubmitButton = styled(NavButton)`
  background: white;
  color: #6542F4;

  &:hover { background: #f0f0f0; }
`;

const PressEnter = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
`;

/* --- THANK YOU --- */
const ThankYou = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 24px;
  animation: ${scaleIn} 0.5s ease;
`;

const CheckCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const ThankTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
`;

const ThankText = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 32px;
`;

/* --- INTRO SCREEN --- */
const IntroCard = styled.div`
  width: 100%;
  max-width: 520px;
  color: white;
  animation: ${scaleIn} 0.4s ease;
`;

const IntroTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
`;

const IntroDesc = styled.p`
  font-size: 17px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 36px;
  line-height: 1.5;
`;

const IntroForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
`;

const IntroFieldLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IntroField = styled.div`
  display: flex;
  flex-direction: column;
`;

const IntroInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 20px;
  padding: 10px 0;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: white;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const StartButton = styled.button`
  height: 48px;
  padding: 0 28px;
  border-radius: 8px;
  background: white;
  color: #6542F4;
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
  align-self: flex-start;

  &:hover { background: #f0f0f0; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

/* --- BACKGROUNDS --- */
const backgrounds = [
  "#6542F4",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#6542F4",
];

function FormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getForm, addResponse } = useForms();
  const form = getForm(id);

  const introFields = (form?.introFields || []).filter((f) => f.enabled);
  const hasIntro = introFields.length > 0;
  const hasQuestions = form?.questions?.length > 0;
  const [step, setStep] = useState(hasIntro ? "intro" : "questions");
  const [introData, setIntroData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState("forward");
  const [animKey, setAnimKey] = useState(0);

  if (!form) {
    return (
      <Page $bg="#6542F4">
        <ThankYou>
          <ThankTitle>Formulario no encontrado</ThankTitle>
          <SubmitButton onClick={() => navigate("/formularios")}>
            Volver
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  if (!hasIntro && !hasQuestions) {
    return (
      <Page $bg="#6542F4">
        <ThankYou>
          <ThankTitle>Formulario vacio</ThankTitle>
          <ThankText>Este formulario no tiene preguntas todavia.</ThankText>
          <SubmitButton onClick={() => navigate(`/formularios/${id}/editar`)}>
            Editar formulario
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isOnlyLetters = (v) => /^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/.test(v);
  const isOnlyNumbers = (v) => /^[\d\-\+\(\)\s]+$/.test(v);

  const canStart = introFields
    .filter((f) => f.required)
    .every((f) => {
      const val = introData[f.id]?.trim();
      if (!val) return false;
      if (f.type === "email") return isValidEmail(val);
      if (f.type === "name") return isOnlyLetters(val);
      if (f.type === "phone") return isOnlyNumbers(val);
      return true;
    });

  const handleStart = () => {
    if (!canStart) return;
    if (hasQuestions) {
      setStep("questions");
    } else {
      const respondent = {};
      introFields.forEach((f) => {
        respondent[f.id] = (introData[f.id] || "").trim();
      });
      addResponse(id, {}, respondent);
      setStep("submitted");
    }
  };

  const handleIntroChange = (field, value) => {
    if (field.type === "name" && value && !/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]*$/.test(value)) return;
    if (field.type === "phone" && value && !/^[\d\-\+\(\)\s]*$/.test(value)) return;
    setIntroData((prev) => ({ ...prev, [field.id]: value }));
  };

  const nameField = introFields.find((f) => f.type === "name");
  const respondentName = (nameField ? introData[nameField.id] : null) || Object.values(introData)[0] || "Respondedor";

  const question = hasQuestions ? form.questions[currentIndex] : null;
  const progress = hasQuestions ? ((currentIndex + 1) / form.questions.length) * 100 : 0;
  const bg = backgrounds[currentIndex % backgrounds.length];
  const currentAnswer = question ? answers[question.id] : undefined;

  const isAnswered = () => {
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    return currentAnswer.toString().trim() !== "";
  };

  const canProceed = !question?.required || isAnswered();

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (currentIndex < form.questions.length - 1) {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i + 1);
    } else {
      const respondent = {};
      introFields.forEach((f) => {
        respondent[f.id] = (introData[f.id] || "").trim();
      });
      addResponse(id, answers, respondent);
      setStep("submitted");
    }
  }, [canProceed, currentIndex, form.questions.length, answers, introData]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection("backward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleTextChange = (value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleSingleSelect = (optionId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setTimeout(goNext, 400);
  };

  const handleMultiSelect = (optionId) => {
    setAnswers((prev) => {
      const current = prev[question.id] || [];
      return {
        ...prev,
        [question.id]: current.includes(optionId)
          ? current.filter((oid) => oid !== optionId)
          : [...current, optionId],
      };
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step === "intro" && canStart) handleStart();
      else if (step === "questions" && canProceed) goNext();
    }
  };

  // --- INTRO SCREEN ---
  if (step === "intro") {
    return (
      <Page $bg="#6542F4" onKeyDown={handleKeyDown} tabIndex={0}>
        <TopBar>
          <FormTitleBar>{form.title}</FormTitleBar>
          <CloseButton onClick={() => navigate(`/formularios/${id}/editar`)}>
            <FiX size={18} />
          </CloseButton>
        </TopBar>

        <QuestionContainer $direction="forward">
          <IntroCard>
            <IntroTitle>{form.title}</IntroTitle>
            <IntroDesc>
              {form.description || "Completa este formulario para enviar tus respuestas."}
            </IntroDesc>

            {introFields.length > 0 && (
              <IntroForm>
                {introFields.map((field, i) => (
                  <IntroField key={field.id}>
                    <IntroFieldLabel>
                      {field.label} {field.required && "*"}
                    </IntroFieldLabel>
                    <IntroInput
                      type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                      placeholder={field.placeholder}
                      value={introData[field.id] || ""}
                      onChange={(e) => handleIntroChange(field, e.target.value)}
                      autoFocus={i === 0}
                      inputMode={field.type === "phone" ? "tel" : undefined}
                    />
                  </IntroField>
                ))}
              </IntroForm>
            )}

            <StartButton onClick={handleStart} disabled={!canStart}>
              Comenzar <FiArrowRight size={16} />
            </StartButton>
          </IntroCard>
        </QuestionContainer>
      </Page>
    );
  }

  // --- SUBMITTED ---
  if (step === "submitted") {
    return (
      <Page $bg="#059669">
        <TopBar>
          <FormTitleBar>{form.title}</FormTitleBar>
          <CloseButton onClick={() => navigate("/formularios")}>
            <FiX size={18} />
          </CloseButton>
        </TopBar>
        <ThankYou>
          <CheckCircle><FiCheck size={36} /></CheckCircle>
          <ThankTitle>Gracias, {respondentName.split(" ")[0]}</ThankTitle>
          <ThankText>Tus respuestas han sido registradas correctamente.</ThankText>
          <SubmitButton onClick={() => navigate("/formularios")}>
            Volver al inicio
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  // --- QUESTIONS ---
  return (
    <Page $bg={bg} onKeyDown={handleKeyDown} tabIndex={0}>
      <ProgressBar style={{ width: `${progress}%` }} />

      <TopBar>
        <FormTitleBar>{form.title}</FormTitleBar>
        <CloseButton onClick={() => navigate(`/formularios/${id}/editar`)}>
          <FiX size={18} />
        </CloseButton>
      </TopBar>

      <QuestionContainer key={animKey} $direction={direction}>
        <QuestionCard>
          <QuestionNumber>
            {currentIndex + 1}
            <FiArrowRight size={12} />
          </QuestionNumber>

          <QuestionTitle>
            {question.title || "Pregunta sin titulo"}
            {question.required && <RequiredBadge>*</RequiredBadge>}
          </QuestionTitle>

          {question.description && (
            <QuestionDesc>{question.description}</QuestionDesc>
          )}

          {question.type === "short_text" && (
            <TextInput
              type="text"
              placeholder="Escribe tu respuesta aqui..."
              value={currentAnswer || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              autoFocus
            />
          )}

          {question.type === "long_text" && (
            <TextArea
              placeholder="Escribe tu respuesta aqui..."
              value={currentAnswer || ""}
              onChange={(e) => handleTextChange(e.target.value)}
              autoFocus
            />
          )}

          {question.type === "single_choice" && (
            <OptionsGrid>
              {question.options.map((opt, i) => (
                <OptionButton
                  key={opt.id}
                  $selected={currentAnswer === opt.id}
                  onClick={() => handleSingleSelect(opt.id)}
                >
                  <OptionKey $selected={currentAnswer === opt.id}>
                    {String.fromCharCode(65 + i)}
                  </OptionKey>
                  {opt.text}
                  <OptionCheckmark
                    $type="single_choice"
                    $selected={currentAnswer === opt.id}
                  >
                    {currentAnswer === opt.id && <FiCheck size={14} />}
                  </OptionCheckmark>
                </OptionButton>
              ))}
            </OptionsGrid>
          )}

          {question.type === "multiple_choice" && (
            <OptionsGrid>
              {question.options.map((opt, i) => {
                const selected = (currentAnswer || []).includes(opt.id);
                return (
                  <OptionButton
                    key={opt.id}
                    $selected={selected}
                    onClick={() => handleMultiSelect(opt.id)}
                  >
                    <OptionKey $selected={selected}>
                      {String.fromCharCode(65 + i)}
                    </OptionKey>
                    {opt.text}
                    <OptionCheckmark $type="multiple_choice" $selected={selected}>
                      {selected && <FiCheck size={14} />}
                    </OptionCheckmark>
                  </OptionButton>
                );
              })}
            </OptionsGrid>
          )}
        </QuestionCard>
      </QuestionContainer>

      <BottomBar>
        <PressEnter>
          Presiona <strong>Enter ↵</strong> para continuar
        </PressEnter>

        <NavButtons>
          <NavButton onClick={goPrev} disabled={currentIndex === 0}>
            <FiArrowLeft size={16} />
          </NavButton>

          {currentIndex === form.questions.length - 1 ? (
            <SubmitButton onClick={goNext} disabled={!canProceed}>
              Enviar <FiCheck size={16} />
            </SubmitButton>
          ) : (
            <NavButton onClick={goNext} disabled={!canProceed}>
              Siguiente <FiArrowRight size={16} />
            </NavButton>
          )}
        </NavButtons>
      </BottomBar>
    </Page>
  );
}

export default FormView;
