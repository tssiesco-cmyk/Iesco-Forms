import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { FiArrowRight, FiArrowLeft, FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import { useAuth } from "../../context/AuthContext";
import { formsApi, linksApi } from "../../services/api";
import Spinner from "../../components/atoms/Spinner";

/* --- ANIMATIONS --- */
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

/* --- LAYOUT --- */
/**
 * Los colores de esta pantalla van por variables CSS en vez de leer el tema en
 * cada componente. Asi, cuando el formulario tiene imagen de fondo, basta con
 * redefinirlas aqui arriba para que todo el texto pase a blanco, sin tocar los
 * veinte componentes de abajo.
 */
const Page = styled.div`
  --fv-text: ${({ theme }) => theme.colors.text};
  --fv-secondary: ${({ theme }) => theme.colors.textSecondary};
  --fv-muted: ${({ theme }) => theme.colors.textMuted};
  --fv-border: ${({ theme }) => theme.colors.border};
  --fv-border-strong: ${({ theme }) => theme.colors.borderInput};
  --fv-surface: ${({ theme }) => theme.colors.surface};
  --fv-surface-alt: ${({ theme }) => theme.colors.surfaceAlt};
  --fv-accent: ${({ theme }) => theme.colors.primary};
  --fv-accent-hover: ${({ theme }) => theme.colors.primaryHover};
  --fv-accent-soft: ${({ theme }) => theme.colors.primaryBg};
  --fv-on-accent: ${({ theme }) => theme.colors.textInverse};

  ${({ $hasBackground }) => $hasBackground && css`
    --fv-text: #FFFFFF;
    --fv-secondary: rgba(255, 255, 255, 0.78);
    --fv-muted: rgba(255, 255, 255, 0.58);
    --fv-border: rgba(255, 255, 255, 0.3);
    --fv-border-strong: rgba(255, 255, 255, 0.55);
    --fv-surface: rgba(255, 255, 255, 0.1);
    --fv-surface-alt: rgba(255, 255, 255, 0.16);
    --fv-accent: #FFFFFF;
    --fv-accent-hover: rgba(255, 255, 255, 0.88);
    --fv-accent-soft: rgba(255, 255, 255, 0.22);
    --fv-on-accent: #111111;
  `}

  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  color: var(--fv-text);
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;

  ${({ $image }) => $image && css`
    background-image: url("${$image}");
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  `}

  /* El velo: sin el, el texto se pierde sobre casi cualquier foto. */
  ${({ $image, $overlay }) => $image && $overlay && css`
    &::before {
      content: "";
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: -1;
    }
  `}
`;

const ProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: var(--fv-accent);
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
  background: var(--fv-surface-alt);
  color: var(--fv-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover { background: var(--fv-border); }
`;

const FormTitleBar = styled.span`
  color: var(--fv-secondary);
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
  color: var(--fv-text);
`;

const QuestionNumber = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--fv-muted);
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
  color: var(--fv-secondary);
  margin: 0 0 32px;
  line-height: 1.5;
`;

const RequiredBadge = styled.span`
  color: var(--fv-muted);
  font-size: 13px;
  margin-left: 4px;
`;

/* --- INPUT TYPES --- */
const TextInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--fv-border);
  color: var(--fv-text);
  font-size: 22px;
  padding: 12px 0;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;

  &:focus {
    border-bottom-color: var(--fv-accent);
  }

  &::placeholder {
    color: var(--fv-muted);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--fv-border);
  color: var(--fv-text);
  font-size: 20px;
  padding: 12px 0;
  outline: none;
  resize: none;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.5;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: var(--fv-accent);
  }

  &::placeholder {
    color: var(--fv-muted);
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
  border: 1px solid ${({ $selected }) => $selected ? "var(--fv-accent)" : "var(--fv-border)"};
  background: ${({ $selected }) => $selected ? "var(--fv-accent-soft)" : "var(--fv-surface)"};
  color: var(--fv-text);
  font-size: 16px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--fv-surface-alt);
    border-color: var(--fv-border-strong);
  }
`;

const OptionKey = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${({ $selected }) => $selected ? "var(--fv-accent)" : "var(--fv-surface-alt)"};
  color: ${({ $selected }) => $selected ? "var(--fv-on-accent)" : "var(--fv-secondary)"};
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
  border: 2px solid ${({ $selected }) => $selected ? "var(--fv-accent)" : "var(--fv-border-strong)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  transition: all 0.15s;
  background: ${({ $selected }) => $selected ? "var(--fv-accent)" : "transparent"};
  color: ${({ $selected }) => $selected ? "var(--fv-on-accent)" : "transparent"};
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
  background: var(--fv-surface);
  border: 1px solid var(--fv-border);
  color: var(--fv-text);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;

  &:hover { background: var(--fv-surface-alt); }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const SubmitButton = styled(NavButton)`
  background: var(--fv-accent);
  border-color: var(--fv-accent);
  color: var(--fv-on-accent);

  &:hover { background: var(--fv-accent-hover); }
`;

const PressEnter = styled.span`
  font-size: 12px;
  color: var(--fv-muted);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SubmitError = styled.div`
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.dangerBg};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.45;
`;

/* --- THANK YOU --- */
const ThankYou = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--fv-text);
  text-align: center;
  padding: 24px;
  animation: ${scaleIn} 0.5s ease;
`;

const CheckCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.successBg};
  color: ${({ theme }) => theme.colors.success};
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
  color: var(--fv-secondary);
  margin: 0 0 32px;
`;

/* --- INTRO SCREEN --- */
const IntroCard = styled.div`
  width: 100%;
  max-width: 520px;
  color: var(--fv-text);
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
  color: var(--fv-secondary);
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
  color: var(--fv-secondary);
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
  border-bottom: 2px solid var(--fv-border);
  color: var(--fv-text);
  font-size: 20px;
  padding: 10px 0;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    border-bottom-color: var(--fv-accent);
  }

  &::placeholder {
    color: var(--fv-muted);
  }
`;

const StartButton = styled.button`
  height: 48px;
  padding: 0 28px;
  border-radius: 8px;
  background: var(--fv-accent);
  color: var(--fv-on-accent);
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
  align-self: flex-start;

  &:hover { background: var(--fv-accent-hover); }
  &:disabled { opacity: 0.4; cursor: default; }
`;

// El formato elegido en el constructor manda sobre el teclado: da igual como
// tenga el Bloq Mayus quien responde, el texto se convierte igual. Se aplica al
// guardar la respuesta, no con CSS, para que lo que se ve y lo que se envia
// sean lo mismo.
function applyTextCase(value, textCase) {
  if (textCase === "upper") return value.toLocaleUpperCase();
  if (textCase === "lower") return value.toLocaleLowerCase();
  return value;
}

/** Que decir segun por que no se pudo abrir. */
const REMOTE_ERRORS = {
  expired: {
    title: "Este enlace ya vencio",
    text: "Pide un enlace nuevo a quien te lo envio.",
  },
  closed: {
    title: "Formulario cerrado",
    text: "Este formulario no esta aceptando respuestas en este momento.",
  },
  login: {
    title: "Necesitas un enlace para responder",
    text: "Pide a quien creo el formulario un enlace para responder, o inicia sesion.",
  },
  notfound: {
    title: "Formulario no encontrado",
    text: "Puede que se haya eliminado, que el enlace se haya anulado o que sea incorrecto.",
  },
};

function remoteStatusFor(err, viaLink) {
  if (err.status === 410) return "expired";
  if (err.status === 409) return "closed";
  if (err.status === 401) return "login";
  if (err.status === 404) return "notfound";
  return viaLink && !err.isNetwork ? "notfound" : "error";
}

/**
 * Pantalla para responder. Se llega de dos formas:
 * - /formularios/:id/vista, con sesion (vista previa o formulario publico).
 * - /r/:token, un enlace que vence, sin necesidad de sesion.
 */
function FormView() {
  const { id: routeId, token } = useParams();
  const navigate = useNavigate();
  const { getForm, status, addResponse } = useForms();
  const { isAuthenticated } = useAuth();

  // Por enlace siempre manda lo que diga el enlace (puede haber vencido),
  // aunque el formulario tambien este en la lista del usuario.
  const contextForm = token ? undefined : getForm(routeId);

  // La lista del contexto solo trae los formularios propios y los compartidos
  // para editar. Uno publico de otra persona o un enlace no estan ahi: se piden
  // sueltos.
  const [remote, setRemote] = useState({ status: "idle", form: null, error: null });

  useEffect(() => {
    if (contextForm || (!token && status === "loading")) return;

    const controller = new AbortController();
    setRemote({ status: "loading", form: null, error: null });

    const request = token
      ? linksApi.open(token, { signal: controller.signal }).then((result) => result.form)
      : formsApi.getById(routeId, { signal: controller.signal });

    request
      .then((found) => setRemote({ status: "ready", form: found, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setRemote({ status: remoteStatusFor(err, Boolean(token)), form: null, error: err });
      });

    return () => controller.abort();
  }, [routeId, token, contextForm, status]);

  const form = contextForm ?? remote.form;
  const id = form?.id ?? routeId;

  // Quien puede editarlo vuelve al editor. Quien solo responde vuelve a
  // Compartidos si tiene sesion, o a la portada si llego por un enlace.
  const exitPath = form?.access && !token
    ? `/formularios/${id}/editar`
    : isAuthenticated ? "/compartidos" : "/";

  // El fondo lo elige quien crea el formulario. Cuando hay imagen, el texto de
  // toda la pantalla pasa a blanco mediante las variables CSS de Page.
  const formBackground = form?.backgroundImage || "";

  /**
   * Con el fondo por pregunta activado manda la imagen de la pregunta; si esa
   * no tiene, se usa la del formulario como reserva. La pantalla de datos y la
   * de gracias usan siempre la del formulario.
   */
  const resolveBackground = (question) => {
    if (form?.backgroundPerQuestion && question?.backgroundImage) {
      return question.backgroundImage;
    }
    return formBackground;
  };

  const backgroundPropsFor = (image) => ({
    $image: image || undefined,
    $overlay: form?.backgroundOverlay !== false,
    $hasBackground: Boolean(image),
  });

  // La pantalla de datos tambien puede tener la suya, con la misma reserva.
  const introBackground =
    form?.backgroundPerQuestion && form?.introBackgroundImage
      ? form.introBackgroundImage
      : formBackground;

  const backgroundProps = backgroundPropsFor(formBackground);

  const introFields = (form?.introFields || []).filter((f) => f.enabled);
  const hasIntro = introFields.length > 0;
  const hasQuestions = form?.questions?.length > 0;
  // Ojo: el paso NO se puede fijar con useState(hasIntro ? ...), porque en el
  // primer render el formulario aun no ha llegado de la API y hasIntro seria
  // false para siempre. Se guarda solo el paso elegido a mano y, mientras no
  // haya ninguno, se deduce del formulario ya cargado.
  const [chosenStep, setStep] = useState(null);
  const [introData, setIntroData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState("forward");
  const [animKey, setAnimKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  if (!form && (remote.status === "idle" || remote.status === "loading")) {
    return (
      <Page {...backgroundProps}>
        <ThankYou>
          <Spinner $size={28} />
          <ThankText style={{ marginTop: 20 }}>Cargando formulario...</ThankText>
        </ThankYou>
      </Page>
    );
  }

  if (!form && remote.status === "error") {
    return (
      <Page {...backgroundProps}>
        <ThankYou>
          <ThankTitle>No se pudo cargar</ThankTitle>
          <ThankText>
            {remote.error?.isNetwork
              ? "El servidor no responde. Intentalo de nuevo en un momento."
              : remote.error?.message}
          </ThankText>
          <SubmitButton onClick={() => window.location.reload()}>Reintentar</SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  if (!form) {
    const message = REMOTE_ERRORS[remote.status] ?? REMOTE_ERRORS.notfound;
    return (
      <Page {...backgroundProps}>
        <ThankYou>
          <ThankTitle>{message.title}</ThankTitle>
          <ThankText>{message.text}</ThankText>
          <SubmitButton onClick={() => navigate(exitPath)}>
            Volver
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  if (!hasIntro && !hasQuestions) {
    return (
      <Page {...backgroundProps}>
        <ThankYou>
          <ThankTitle>Formulario vacio</ThankTitle>
          <ThankText>Este formulario no tiene preguntas todavia.</ThankText>
          <SubmitButton onClick={() => navigate(exitPath)}>
            {form.access ? "Editar formulario" : "Volver"}
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isOnlyLetters = (v) => /^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]+$/.test(v);
  const isOnlyNumbers = (v) => /^[\d\-+()\s]+$/.test(v);

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

  const buildRespondent = () => {
    const respondent = {};
    introFields.forEach((f) => {
      respondent[f.id] = (introData[f.id] || "").trim();
    });
    return respondent;
  };

  const handleStart = async () => {
    if (!canStart || submitting) return;

    if (hasQuestions) {
      setStep("questions");
      return;
    }

    // Sin preguntas, pulsar "Comenzar" ya es el envio.
    setSubmitting(true);
    setSubmitError(null);

    const result = await addResponse(id, {}, buildRespondent(), token);
    setSubmitting(false);

    if (result.ok) setStep("submitted");
    else setSubmitError(result.error);
  };

  const handleIntroChange = (field, value) => {
    if (field.type === "name" && value && !/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]*$/.test(value)) return;
    if (field.type === "phone" && value && !/^[\d\-+()\s]*$/.test(value)) return;
    setIntroData((prev) => ({ ...prev, [field.id]: value }));
  };

  const nameField = introFields.find((f) => f.type === "name");
  const respondentName = (nameField ? introData[nameField.id] : null) || Object.values(introData)[0] || "";

  const step = chosenStep ?? (hasIntro ? "intro" : "questions");

  const question = hasQuestions ? form.questions[currentIndex] : null;
  const progress = hasQuestions ? ((currentIndex + 1) / form.questions.length) * 100 : 0;
  const currentAnswer = question ? answers[question.id] : undefined;

  const isAnswered = () => {
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    return currentAnswer.toString().trim() !== "";
  };

  const canProceed = !question?.required || isAnswered();

  const goNext = async () => {
    if (!canProceed || submitting) return;

    if (currentIndex < form.questions.length - 1) {
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i + 1);
      return;
    }

    // Ultima pregunta: se envia. Aqui si hay que esperar la respuesta del
    // servidor, porque quien responde tiene que saber si su envio llego.
    setSubmitting(true);
    setSubmitError(null);

    const result = await addResponse(id, answers, buildRespondent(), token);
    setSubmitting(false);

    if (result.ok) setStep("submitted");
    else setSubmitError(result.error);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection("backward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleTextChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: applyTextCase(value, question.textCase),
    }));
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
      <Page {...backgroundPropsFor(introBackground)} onKeyDown={handleKeyDown} tabIndex={0}>
        <TopBar>
          <FormTitleBar>{form.title}</FormTitleBar>
          <CloseButton onClick={() => navigate(exitPath)}>
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

            <StartButton onClick={handleStart} disabled={!canStart || submitting}>
              {submitting ? "Enviando..." : "Comenzar"}
              {submitting ? <Spinner $size={16} $color="currentColor" /> : <FiArrowRight size={16} />}
            </StartButton>

            {submitError && (
              <SubmitError>
                <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  {submitError.isNetwork
                    ? "No se pudo enviar: sin conexion con el servidor. Tus respuestas siguen aqui, vuelve a intentarlo."
                    : submitError.message}
                </span>
              </SubmitError>
            )}
          </IntroCard>
        </QuestionContainer>
      </Page>
    );
  }

  // --- SUBMITTED ---
  if (step === "submitted") {
    return (
      <Page>
        <TopBar>
          <FormTitleBar>{form.title}</FormTitleBar>
          <CloseButton onClick={() => navigate(exitPath)}>
            <FiX size={18} />
          </CloseButton>
        </TopBar>
        <ThankYou>
          <CheckCircle><FiCheck size={36} /></CheckCircle>
          <ThankTitle>
            {respondentName.trim()
              ? `Gracias, ${respondentName.trim().split(" ")[0]}`
              : "Gracias"}
          </ThankTitle>
          <ThankText>Tus respuestas han sido registradas correctamente.</ThankText>
          <SubmitButton onClick={() => navigate(exitPath)}>
            Volver
          </SubmitButton>
        </ThankYou>
      </Page>
    );
  }

  // --- QUESTIONS ---
  return (
    <Page {...backgroundPropsFor(resolveBackground(question))} onKeyDown={handleKeyDown} tabIndex={0}>
      <ProgressBar style={{ width: `${progress}%` }} />

      <TopBar>
        <FormTitleBar>{form.title}</FormTitleBar>
        <CloseButton onClick={() => navigate(exitPath)}>
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
          {submitError && (
            <SubmitError>
              <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {submitError.isNetwork
                  ? "No se pudo enviar: sin conexion con el servidor. Tus respuestas siguen aqui, vuelve a intentarlo."
                  : submitError.message}
              </span>
            </SubmitError>
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
            <SubmitButton onClick={goNext} disabled={!canProceed || submitting}>
              {submitting ? "Enviando..." : "Enviar"}
              {submitting ? <Spinner $size={16} $color="currentColor" /> : <FiCheck size={16} />}
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
